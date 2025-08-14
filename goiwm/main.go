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
		"tracks":           js.FuncOf(tracks),
		"midiToIwmObjects": js.FuncOf(midiToIwmObjects),
	}))

	select {}
}

func tracks(this js.Value, p []js.Value) any {
	data, err := base64.StdEncoding.DecodeString(p[0].String())
	if err != nil {
		return err.Error()
	}

	tracks, _, err := GetMidiTracks(bytes.NewReader(data))
	if err != nil {
		return err.Error()
	}

	return "NOT_AN_ERROR:" + SmfString(tracks)
}

func midiToIwmObjects(this js.Value, p []js.Value) any {
	encodedMidi := p[0].String()
	encodedTrackConfigs := p[1].String()

	data, err := base64.StdEncoding.DecodeString(encodedMidi)
	if err != nil {
		return err.Error()
	}

	tracks, _, err := GetMidiTracks(bytes.NewReader(data))
	if err != nil {
		return err.Error()
	}

	var c []*TrackConfig

	err = json.Unmarshal([]byte(encodedTrackConfigs), &c)
	if err != nil {
		return err.Error()
	}

	e, err := GenerateMidiEvents(tracks, c)
	if err != nil {
		return err.Error()
	}

	var objects []*Object

	for _, v := range e {
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
}
