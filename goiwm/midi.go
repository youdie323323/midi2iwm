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
	Volume         float64 `json:"Volume"`
	VolumeConstant bool    `json:"VolumeConstant"`
	Pitch          float64 `json:"Pitch"`
	PitchConstant  bool    `json:"PitchConstant"`
}

type TrackLoopConfig struct {
	Enable     bool `json:"Enable"`
	LoopOffset int  `json:"LoopOffset"`
}

type TrackConfig struct {
	Track        int             `json:"Track"`
	Instrumental int             `json:"Instrumental"`
	BaseNote     int             `json:"BaseNote"`
	MaxNote      uint8           `json:"MaxNote"`
	Offsets      TrackOffsets    `json:"Offsets"`
	Loop         TrackLoopConfig `json:"Loop"`
	Speed        float64         `json:"Speed"`
	StripAfter   int             `json:"StripAfter"`
	StripBefore  int             `json:"StripBefore"`
	StartAt      int             `json:"StartAt"`
}

type NotesWithTrackConfig struct {
	*TrackConfig

	Notes []Note
}

const (
	stableStandard int = 61
	stableHighest  int = 73
)

func GetMidiTracks(f io.Reader) (*smf.SMF, smf.MetricTicks, error) {
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

func generatePitchTable(standard int) []float64 {
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

	currentBPM := tempoChanges[0].bpm

	for _, change := range tempoChanges {
		if change.absTicks > absTicks {
			break
		}

		deltaTicks := change.absTicks - lastTicks
		seconds += (60.0 / currentBPM) * float64(deltaTicks) / float64(timeFormat)

		lastTicks = change.absTicks
		currentBPM = change.bpm
	}

	remainingTicks := absTicks - lastTicks
	seconds += (60.0 / currentBPM) * float64(remainingTicks) / float64(timeFormat)

	return seconds
}

func collectTempoChanges(smf *smf.SMF) []TempoChange {
	var changes []TempoChange
	var absTicks uint64

	// Init changes with 120 bpm
	changes = append(changes, TempoChange{0, 120})

	for _, track := range smf.Tracks {
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

func GenerateMidiEvents(ff *smf.SMF, trackConfigs []*TrackConfig) ([][]*Event, error) {
	var trackNotesList []NotesWithTrackConfig

	for _, cfg := range trackConfigs {
		var ticks uint64

		var channel, velocity, key uint8

		var activeNotes []Note
		var processedNotes []Note

		activeNotesMap := make(map[uint64]map[uint8]bool)

		for _, event := range ff.Tracks[cfg.Track] {
			ticks += uint64(event.Delta)

			switch {
			case event.Message.GetNoteStart(&channel, &key, &velocity):
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

			case event.Message.GetNoteEnd(&channel, &key):
				for i, note := range activeNotes {
					if note.key == key {
						processedNotes = append(processedNotes, note)
						activeNotes = slices.Delete(activeNotes, i, i+1)

						break
					}
				}
			}
		}

		if len(processedNotes) > 0 {
			trackNotesList = append(trackNotesList, NotesWithTrackConfig{
				Notes:       processedNotes,
				TrackConfig: cfg,
			})
		}
	}

	tempoChanges := collectTempoChanges(ff)
	timeFormat := ff.TimeFormat.(smf.MetricTicks)

	var events [][]*Event

	maxOffset := -1

	for _, tn := range trackNotesList {
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
		len(trackNotesList),
		func(i int) {
			tn := trackNotesList[i]

			pitchAdjustment := 0
			for i := calculateHighestNote(tn).key; i > tn.MaxNote; i -= 7 {
				pitchAdjustment += 7
			}

			pitchTable := generatePitchTable(tn.BaseNote)

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
						loopFrames = maxOffset + tn.Loop.LoopOffset
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

var instrumentals = map[string]int{
	"Duck":                    0,
	"Glass Break":             1,
	"Bubble":                  2,
	"Light Switch":            3,
	"Ring Bell":               4,
	"Exclamation":             5,
	"Spring":                  6,
	"Horn":                    7,
	"OK":                      8,
	"Glass Break 2":           9,
	"Punch":                   10,
	"Laser Gun":               11,
	"Woosh":                   12,
	"Whistle":                 13,
	"Magic":                   14,
	"Ninja":                   15,
	"Clapping":                16,
	"Drum Roll":               17,
	"Piano":                   18,
	"Bass":                    19,
	"Party Noisemaker":        20,
	"Hoot":                    21,
	"Laughter":                22,
	"Suspense":                23,
	"Wood Scraper":            24,
	"Drum":                    25,
	"No-no":                   26,
	"Glass Bottle":            27,
	"Woodimba":                28,
	"Metallic Hit":            29,
	"Gun":                     30,
	"Electric Charge":         31,
	"Laser Blast (Foam Icon)": 32,
	"Heartbeat":               33,
	"Rubber Chicken":          34,
	"Dog Bark":                35,
	"Cat Meow":                36,
	"Toll Bell":               37,
	"Robot":                   38,
	"Damage":                  39,
}

// InstrumentalFromName returns instrumental from name.
func InstrumentalFromName(name string) int {
	if val, ok := instrumentals[name]; ok {
		return val
	}

	return 18 // default value
}

func SmfString(s *smf.SMF) string {
	var builder strings.Builder

	for i, track := range s.Tracks {
		noteCount := 0

		var channel, key, velocity uint8

		var name string

		for _, event := range track {
			if event.Message.GetNoteStart(&channel, &key, &velocity) {
				noteCount++
			}

			event.Message.GetMetaTrackName(&name)
		}

		if noteCount == 0 {
			continue
		}

		if name == "" {
			name = "unknown"
		}

		builder.WriteString(fmt.Sprintf("Track: %d, name: %s, notes: %d\n", i, name, noteCount))
	}

	return builder.String()
}
