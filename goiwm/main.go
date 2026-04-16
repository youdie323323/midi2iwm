//go:build js && wasm
// +build js,wasm

package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"syscall/js"
)

func main() {
	js.Global().Set("goIwm", js.ValueOf(map[string]any{
		"midiStringifyTracks": js.FuncOf(func(this js.Value, p []js.Value) any {
			data, err := base64.StdEncoding.DecodeString(p[0].String())
			if err != nil {
				return err.Error()
			}

			ff, _, err := ReadMidiInformations(bytes.NewReader(data))
			if err != nil {
				return err.Error()
			}

			return "NOT_AN_ERROR:" + SmfString(ff)
		}),

		"midiToEventedObjects": js.FuncOf(func(this js.Value, p []js.Value) any {
			encodedMidi := p[0].String()
			encodedTrackConfigs := p[1].String()

			data, err := base64.StdEncoding.DecodeString(encodedMidi)
			if err != nil {
				return err.Error()
			}

			ff, _, err := ReadMidiInformations(bytes.NewReader(data))
			if err != nil {
				return err.Error()
			}

			var trackConfigs []TrackConfig

			err = json.Unmarshal([]byte(encodedTrackConfigs), &trackConfigs)
			if err != nil {
				return err.Error()
			}

			events, err := EventsFromMidiSMF(ff, trackConfigs)
			if err != nil {
				return err.Error()
			}

			var objects []*Object

			for _, v := range events {
				object := NewObject(1, 1, Block(1), make([]*Parameter, 0), nil, nil)

				object.Event = append(object.Event, v...)

				objects = append(objects, object)
			}

			out, err := ToXMLString(objects)
			if err != nil {
				return err.Error()
			}

			return []any{
				out,
				len(objects),
			}
		}),
	}))

	select {}
}
