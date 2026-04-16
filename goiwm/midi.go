package main

import (
	"cmp"
	"errors"
	"fmt"
	"io"
	"maps"
	"math"
	"slices"
	"strings"
	"sync"

	"gitlab.com/gomidi/midi/v2/smf"
)

type Note struct {
	ticks    uint64
	velocity uint8
	key      uint8
}

type TrackOffsets struct {
	Volume         float64 `json:"volume"`
	VolumeConstant bool    `json:"volumeConstant"`
	Pitch          float64 `json:"pitch"`
	PitchConstant  bool    `json:"pitchConstant"`
}

type TrackLoopConfig struct {
	Enable bool `json:"enable"`
	Offset int  `json:"offset"`
}

type TrackConfig struct {
	Track        int             `json:"track"`
	Instrumental int             `json:"instrumental"`
	BaseNote     int             `json:"baseNote"`
	MaxNote      uint8           `json:"maxNote"`
	Offsets      TrackOffsets    `json:"offsets"`
	Loop         TrackLoopConfig `json:"loop"`
	Speed        float64         `json:"speed"`
	StripAfter   int             `json:"stripAfter"`
	StripBefore  int             `json:"stripBefore"`
	StartAt      int             `json:"startAt"`
	DrumSplit    []struct {
		Key          uint8        `json:"key"`
		Instrumental int          `json:"instrumental"`
		Offsets      TrackOffsets `json:"offsets"`
	} `json:"drumSplit"`
}

type NotesWithTrackConfig struct {
	TrackConfig

	Notes []Note
}

func ReadMidiInformations(f io.Reader) (*smf.SMF, smf.MetricTicks, error) {
	ff, err := smf.ReadFrom(f)
	if err != nil {
		return nil, smf.MetricTicks(0), err
	}

	w, ok := ff.TimeFormat.(smf.MetricTicks)
	if !ok {
		return nil, smf.MetricTicks(0), errors.New("time format is not MetricTicks")
	}

	return ff, w, nil
}

var pitchMultiple = math.Pow(2, 1.0/12)

func calculatePitchTable(standard int) []float64 {
	pitchTable := make([]float64, 128)

	a := 1.0

	for i := standard; i < 128; i++ {
		pitchTable[i] = a

		a *= pitchMultiple
	}

	a = 1.0

	for i := standard - 1; i >= 0; i-- {
		a /= pitchMultiple

		pitchTable[i] = a
	}

	return pitchTable
}

// calculateHighestNote calculates the max pitch of the notes.
func calculateHighestNote(n NotesWithTrackConfig) Note {
	return slices.MaxFunc(n.Notes, func(a Note, b Note) int {
		return cmp.Compare(a.key, b.key)
	})
}

const maxUint7 = 1<<7 - 1

const (
	minVecloity = 0.05
	maxVecloity = 1.0
)

// normalizeVelocity normalizes midi velocity to IWM velocity.
func normalizeVelocity(velocity uint8) float64 {
	return minVecloity + (math.Pow(float64(velocity)/float64(maxUint7), 2.0) * (maxVecloity - minVecloity))
}

type TempoChange struct {
	absTicks uint64
	bpm      float64
}

func ticksToSeconds(absTicks uint64, tempoChanges []TempoChange, timeFormat smf.MetricTicks) float64 {
	if len(tempoChanges) == 0 {
		return 0
	}

	var seconds float64
	var lastTicks uint64

	bpm := tempoChanges[0].bpm

	for _, change := range tempoChanges {
		if change.absTicks > absTicks {
			break
		}

		deltaTicks := change.absTicks - lastTicks
		seconds += (60.0 / bpm) * float64(deltaTicks) / float64(timeFormat)

		lastTicks = change.absTicks
		bpm = change.bpm
	}

	remainingTicks := absTicks - lastTicks
	seconds += (60.0 / bpm) * float64(remainingTicks) / float64(timeFormat)

	return seconds
}

func collectTempoChanges(ff *smf.SMF) []TempoChange {
	var changes []TempoChange

	var absTicks uint64

	// Init changes with 120 bpm
	changes = append(changes, TempoChange{0, 120})

	for _, track := range ff.Tracks {
		for _, event := range track {
			absTicks += uint64(event.Delta)

			var bpm float64

			if event.Message.GetMetaTempo(&bpm) {
				changes = append(changes, TempoChange{absTicks, bpm})
			}
		}
	}

	slices.SortFunc(changes, func(a, b TempoChange) int {
		return cmp.Compare(a.absTicks, b.absTicks)
	})

	return changes
}

var mu sync.Mutex

func EventsFromMidiSMF(ff *smf.SMF, trackConfigs []TrackConfig) ([][]*Event, error) {
	var notesWithTrackConfigs []NotesWithTrackConfig

	for _, trackConfig := range trackConfigs {
		var ticks uint64

		var channel, key, velocity uint8

		var activeNotes []Note
		var processedNotes []Note

		activeNotesMap := make(map[uint64]map[uint8]bool)

		for _, track := range ff.Tracks[trackConfig.Track] {
			ticks += uint64(track.Delta)

			switch {
			case track.Message.GetNoteStart(&channel, &key, &velocity):
				if activeNotesMap[ticks] == nil {
					activeNotesMap[ticks] = make(map[uint8]bool)
				}

				if !activeNotesMap[ticks][key] {
					activeNotes = append(activeNotes, Note{
						ticks:    ticks,
						velocity: velocity,
						key:      key,
					})

					activeNotesMap[ticks][key] = true
				}

			case track.Message.GetNoteEnd(&channel, &key):
				for i, note := range activeNotes {
					if note.key == key {
						activeNotes = slices.Delete(activeNotes, i, i+1)
						processedNotes = append(processedNotes, note)

						break
					}
				}
			}
		}

		if len(processedNotes) == 0 {
			continue
		}

		if len(trackConfig.DrumSplit) > 0 {
			for _, mapping := range trackConfig.DrumSplit {
				var filteredNotes []Note

				for _, note := range processedNotes {
					if note.key == mapping.Key {
						filteredNotes = append(filteredNotes, note)
					}
				}

				if len(filteredNotes) > 0 {
					subTrackConfig := trackConfig

					subTrackConfig.Instrumental = mapping.Instrumental
					subTrackConfig.Offsets = mapping.Offsets

					notesWithTrackConfigs = append(notesWithTrackConfigs, NotesWithTrackConfig{
						TrackConfig: subTrackConfig,
						Notes:       filteredNotes,
					})
				}
			}
		} else {
			notesWithTrackConfigs = append(notesWithTrackConfigs, NotesWithTrackConfig{
				TrackConfig: trackConfig,
				Notes:       processedNotes,
			})
		}
	}

	tempoChanges := collectTempoChanges(ff)
	timeFormat := ff.TimeFormat.(smf.MetricTicks)

	var events [][]*Event

	maxOffset := -1

	for _, tn := range notesWithTrackConfigs {
		for _, note := range tn.Notes {
			seconds := ticksToSeconds(note.ticks, tempoChanges, timeFormat)

			offset := int(seconds*50*(2-tn.Speed)) + tn.StartAt + 1
			if offset > MaxEventFrames {
				break
			}

			if offset < 0 {
				continue
			}

			if tn.StripBefore != 0 && tn.StripBefore > offset {
				continue
			}

			if tn.StripAfter != 0 && tn.StripAfter < offset {
				break
			}

			maxOffset = max(maxOffset, offset)
		}
	}

	parallelize(
		len(notesWithTrackConfigs),
		func(i int) {
			tn := notesWithTrackConfigs[i]

			var pitchAdjustment int

			for i := calculateHighestNote(tn).key; i > tn.MaxNote; i -= 7 {
				pitchAdjustment += 7
			}

			pitchTable := calculatePitchTable(tn.BaseNote)

			var trackEvents map[int]*Event = make(map[int]*Event, len(tn.Notes))

			for _, note := range tn.Notes {
				seconds := ticksToSeconds(note.ticks, tempoChanges, timeFormat)

				offset := int(seconds*50*(2-tn.Speed)) + tn.StartAt + 1
				if offset > MaxEventFrames {
					break
				}

				if offset < 0 {
					continue
				}

				if tn.StripBefore != 0 && tn.StripBefore > offset {
					continue
				}

				if tn.StripAfter != 0 && tn.StripAfter < offset {
					break
				}

				pitchIndex := max(int(note.key)-pitchAdjustment, 0)

				var pitch float64

				if tn.Offsets.PitchConstant {
					pitch = tn.Offsets.Pitch
				} else {
					pitch = pitchTable[pitchIndex] + tn.Offsets.Pitch
				}

				pitch = max(0.05, min(3.0, pitch))

				var volume float64

				if tn.Offsets.VolumeConstant {
					volume = tn.Offsets.Volume
				} else {
					volume = normalizeVelocity(note.velocity) + tn.Offsets.Volume
				}

				volume = max(minVecloity, min(maxVecloity, volume))

				if _, ok := trackEvents[offset]; !ok {
					loopFrames := MaxEventFrames
					if tn.Loop.Enable {
						loopFrames = maxOffset + tn.Loop.Offset
						if loopFrames < 0 {
							continue
						}
					}

					trackEvents[offset] = &Event{
						EventID: 17,
						Parameters: ParametersByMap(map[string]any{
							"offset": offset,
							"frames": loopFrames,
						}),
						Events: []*EventBody{
							{
								EventID: 104,
								Parameters: ParametersByMap(map[string]any{
									"volume": volume,
									"pitch":  pitch,
									"sound":  tn.Instrumental,
								}),
							},
						},
					}
				} else {
					trackEvents[offset].Events = append(trackEvents[offset].Events, &EventBody{
						EventID: 104,
						Parameters: ParametersByMap(map[string]any{
							"volume": volume,
							"pitch":  pitch,
							"sound":  tn.Instrumental,
						}),
					})
				}
			}

			mu.Lock()

			events = append(events, slices.Collect(maps.Values(trackEvents)))

			mu.Unlock()
		},
	)

	return events, nil
}

func parallelize(end int, callback func(int)) {
	var wg sync.WaitGroup

	for i := range end {
		wg.Add(1)

		go func(i int) {
			defer wg.Done()

			callback(i)
		}(i)
	}

	wg.Wait()
}

var gmDrumMap = map[uint8]string{
	35: "Acoustic Bass Drum",
	36: "Bass Drum 1",
	37: "Side Stick",
	38: "Acoustic Snare",
	39: "Hand Clap",
	40: "Electric Snare",
	41: "Low Floor Tom",
	42: "Closed Hi Hat",
	43: "High Floor Tom",
	44: "Pedal Hi Hat",
	45: "Low Tom",
	46: "Open Hi Hat",
	47: "Low-Mid Tom",
	48: "Hi Mid Tom",
	49: "Crash Cymbal 1",
	50: "High Tom",
	51: "Ride Cymbal 1",
	52: "Chinese Cymbal",
	53: "Ride Bell",
	54: "Tambourine",
	55: "Splash Cymbal",
	56: "Cowbell",
	57: "Crash Cymbal 2",
	58: "Vibraslap",
	59: "Ride Cymbal 2",
	60: "Hi Bongo",
	61: "Low Bongo",
	62: "Mute Hi Conga",
	63: "Open Hi Conga",
	64: "Low Conga",
	65: "High Timbale",
	66: "Low Timbale",
	67: "High Agogo",
	68: "Low Agogo",
	69: "Cabasa",
	70: "Maracas",
	71: "Short Whistle",
	72: "Long Whistle",
	73: "Short Guiro",
	74: "Long Guiro",
	75: "Claves",
	76: "Hi Wood Block",
	77: "Low Wood Block",
	78: "Mute Cuica",
	79: "Open Cuica",
	80: "Mute Triangle",
	81: "Open Triangle",
}

func SmfString(s *smf.SMF) string {
	var builder strings.Builder

	for i, track := range s.Tracks {
		noteCount := 0

		var channel, key, velocity uint8
		var name string

		drumNotes := make(map[uint8]int)
		isDrumTrack := false

		for _, event := range track {
			if event.Message.GetNoteStart(&channel, &key, &velocity) {
				noteCount++

				if channel == 9 {
					drumNotes[key]++
					isDrumTrack = true
				}
			}

			event.Message.GetMetaTrackName(&name)
		}

		if noteCount == 0 {
			continue
		}

		if name == "" {
			name = "unknown"
		}

		if isDrumTrack {
			fmt.Fprintf(&builder, "Track: %d, name: %s, notes: %d (Drum Track)\n", i, name, noteCount)

			var keys []uint8

			for key := range drumNotes {
				keys = append(keys, key)
			}

			slices.Sort(keys)

			for _, key := range keys {
				drumName, ok := gmDrumMap[key]
				if !ok {
					drumName = "Unknown Drum"
				}

				fmt.Fprintf(&builder, "  - Key %d (%s): %d notes\n", key, drumName, drumNotes[key])
			}
		} else {
			fmt.Fprintf(&builder, "Track: %d, name: %s, notes: %d\n", i, name, noteCount)
		}
	}

	return builder.String()
}
