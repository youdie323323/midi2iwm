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
	absTicks uint64
	velocity uint8
	key      uint8
}

type TrackOffsets struct {
	Volume         float64 `json:"Volume"`
	VolumeConstant bool    `json:"VolumeConstant"`
	Pitch          float64 `json:"Pitch"`
	PitchConstant  bool    `json:"PitchConstant"`
}

type LoopConfig struct {
	Enable     bool `json:"Enable"`
	LoopOffset int  `json:"LoopOffset"`
}

type TrackConfig struct {
	Track        int          `json:"Track"`
	Instrumental int          `json:"Instrumental"`
	BaseNote     int          `json:"BaseNote"`
	MaxNote      int          `json:"MaxNote"`
	Offsets      TrackOffsets `json:"Offsets"`
	Loop         LoopConfig   `json:"Loop"`
	Speed        float64      `json:"Speed"`
	StripAfter   int          `json:"StripAfter"`
	StripBefore  int          `json:"StripBefore"`
	StartAt      int          `json:"StartAt"`
}

type TrackNotes struct {
	Notes []Note
	*TrackConfig
}

const (
	MIN_VELOCITY = 0.05
	MAX_VELOCITY = 1.0
)

const (
	STABLE_STANDARD int = 61
	STABLE_HIGHEST  int = 73
)

const MAX_FRAMES = 99999

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

func getPitchTable(standard int) []float64 {
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

// getHighestPitch get the max key (pitch) from the notes
// which is denoted as Note_{i_{max}}.
func getHighestPitch(n TrackNotes) int {
	return int(slices.MaxFunc(n.Notes, func(a Note, b Note) int {
		return cmp.Compare(a.key, b.key)
	}).key)
}

// normalizeVelocity resize standard midi velocity to IWM velocity.
func normalizeVelocity(velocity int) float64 {
	return MIN_VELOCITY + (math.Pow(float64(velocity)/127.0, 2) * (MAX_VELOCITY - MIN_VELOCITY))
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
    var currentBPM = tempoChanges[0].bpm

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

func getTempoChanges(smf *smf.SMF) []TempoChange {
    var changes []TempoChange
    var absTicks uint64

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

func GenerateMidiEvents(ff *smf.SMF, tc []*TrackConfig) ([][]*Event, error) {
	var trackNotesList []TrackNotes

	for _, cfg := range tc {
		var absTicks uint64
		var channel, velocity, key uint8
		var activeNotes []Note
		var processedNotes []Note
		activeNotesMap := make(map[uint64]map[uint8]bool)

		for _, event := range ff.Tracks[cfg.Track] {
			absTicks += uint64(event.Delta)

			switch {
			case event.Message.GetNoteStart(&channel, &key, &velocity):
				if activeNotesMap[absTicks] == nil {
					activeNotesMap[absTicks] = make(map[uint8]bool)
				}

				if !activeNotesMap[absTicks][key] {
					activeNotes = append(activeNotes, Note{
						absTicks: absTicks,
						velocity: velocity,
						key:      key,
					})
					activeNotesMap[absTicks][key] = true
				}

			case event.Message.GetNoteEnd(&channel, &key):
				for i, note := range activeNotes {
					if note.key == key {
						processedNotes = append(processedNotes, note)
						activeNotes = append(activeNotes[:i], activeNotes[i+1:]...)
						break
					}
				}
			}
		}

		if len(processedNotes) > 0 {
			trackNotesList = append(trackNotesList, TrackNotes{
				Notes:       processedNotes,
				TrackConfig: cfg,
			})
		}
	}

	tempoChanges := getTempoChanges(ff)
    timeFormat := ff.TimeFormat.(smf.MetricTicks)

	var events [][]*Event

	maxOffset := -1

	for _, tn := range trackNotesList {
		for _, note := range tn.Notes {
			seconds := ticksToSeconds(note.absTicks, tempoChanges, timeFormat)
            offset := int(seconds*50*(2-tn.Speed)) + tn.StartAt + 1
			if offset > MAX_FRAMES {
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

	parallelize(len(trackNotesList), func(i int) {
		tn := trackNotesList[i]

		pitchAdjustment := 0
		for i := getHighestPitch(tn); i > tn.MaxNote; i -= 7 {
			pitchAdjustment += 7
		}

		pitchTable := getPitchTable(tn.BaseNote)

		var trackEvents map[int]*Event = make(map[int]*Event, len(tn.Notes))

		for _, note := range tn.Notes {
			seconds := ticksToSeconds(note.absTicks, tempoChanges, timeFormat)
            offset := int(seconds*50*(2-tn.Speed)) + tn.StartAt + 1
			if offset > MAX_FRAMES {
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

			pitchIndex := int(note.key) - pitchAdjustment
			if pitchIndex < 0 {
				pitchIndex = 0
			}

			pitch := pitchTable[pitchIndex] + tn.Offsets.Pitch
			if tn.Offsets.PitchConstant {
				pitch = tn.Offsets.Pitch
			}
			pitch = max(0.05, min(3.0, pitch))

			volume := normalizeVelocity(int(note.velocity)) + tn.Offsets.Volume
			if tn.Offsets.VolumeConstant {
				volume = tn.Offsets.Volume
			}
			volume = max(MIN_VELOCITY, min(MAX_VELOCITY, volume))

			if _, ok := trackEvents[offset]; !ok {
				loopFrames := MAX_FRAMES
				if tn.Loop.Enable {
					loopFrames = maxOffset + tn.Loop.LoopOffset
					if loopFrames < 0 {
						continue
					}
				}

				trackEvents[offset] = &Event{
					EventID: 17,
					Param: ParamByMap(map[ParamKey]any{
						"offset": offset,
						"frames": loopFrames,
					}),
					Events: []*EventBody{
						{
							EventID: 104,
							Param: ParamByMap(map[ParamKey]any{
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
					Param: ParamByMap(map[ParamKey]any{
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
	})

	return events, nil
}

func parallelize(n int, f func(int)) {
	var wg sync.WaitGroup

	for i := range n {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			f(i)
		}(i)
	}

	wg.Wait()
}

func GetInstrumental(name string) int {
	switch name {
	case "Duck":
		return 0
	case "Glass Break":
		return 1
	case "Bubble":
		return 2
	case "Light Switch":
		return 3
	case "Ring Bell":
		return 4
	case "Exclamation":
		return 5
	case "Spring":
		return 6
	case "Horn":
		return 7
	case "OK":
		return 8
	case "Glass Break 2":
		return 9
	case "Punch":
		return 10
	case "Laser Gun":
		return 11
	case "Woosh":
		return 12
	case "Whistle":
		return 13
	case "Magic":
		return 14
	case "Ninja":
		return 15
	case "Clapping":
		return 16
	case "Drum Roll":
		return 17
	case "Piano":
		return 18
	case "Bass":
		return 19
	case "Party Noisemaker":
		return 20
	case "Hoot":
		return 21
	case "Laughter":
		return 22
	case "Suspense":
		return 23
	case "Wood Scraper":
		return 24
	case "Drum":
		return 25
	case "No-no":
		return 26
	case "Glass Bottle":
		return 27
	case "Woodimba":
		return 28
	case "Metallic Hit":
		return 29
	case "Gun":
		return 30
	case "Electric Charge":
		return 31
	case "Laser Blast (Foam Icon)":
		return 32
	case "Heartbeat":
		return 33
	case "Rubber Chicken":
		return 34
	case "Dog Bark":
		return 35
	case "Cat Meow":
		return 36
	case "Toll Bell":
		return 37
	case "Robot":
		return 38
	default:
		return 18
	}
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
