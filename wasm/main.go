//go:build js && wasm

package main

import (
	"IWMmain/src/basic"
	"IWMmain/src/packages"
	"bytes"
	"encoding/base64"
	"encoding/json"
	"encoding/xml"
	"syscall/js"
)

var (
	window   = js.Global()
	document = window.Get("document")
)

func main() {
	var fileStr string
	var fileSelected bool
	document.Call("getElementById", "mapfile").Call("addEventListener", "change", js.FuncOf(func(afgwafawa js.Value, bseysesfeses []js.Value) any {
		fReader := window.Get("FileReader").New()
		fReader.Set("onload", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			fileStr = this.Get("result").String()
			fileSelected = true
			return js.Undefined()
		}))
		fReader.Call("readAsText", bseysesfeses[0].Get("target").Get("files").Index(0))
		return js.Undefined()
	}))

	window.Set("Midi", js.FuncOf(func(this js.Value, args []js.Value) any {
		if fileSelected != true {
			return map[string]interface{}{
				"error":       true,
				"errorReason": "Please select map file",
			}
		}
		//args[0] - Base64 encoded midi data uint8Array
		//args[1] - []packages.TrackInfo json data
		//args[2] - speed
		//args[3] - Append obj map index
		//args[4] - Highest
		var aa basic.SfmMaps
		xml.Unmarshal([]byte(fileStr), &aa)

		dec, _ := base64.StdEncoding.DecodeString(args[0].String())

		var ee []packages.TrackInfo
		json.Unmarshal([]byte(args[1].String()), &ee)

		obj, err := packages.Midi(dec, ee, args[2].Float(), args[4].Int())
		if err != nil {
			return map[string]interface{}{
				"error":       true,
				"errorReason": err.Error(),
			}
		}
		t := basic.NewObject(0, 0, basic.OBJECT_TYPE_BLOCK, make([]*basic.Param, 0), nil)
		t.Event = append(t.Event, obj...)
		aa.SfmMap[args[3].Int()].Objects.Object = append(aa.SfmMap[args[3].Int()].Objects.Object, t)
		aa.SfmMap[args[3].Int()].Head.NumObjects += 1

		return map[string]interface{}{
			"error":  false,
			"newMap": basic.BuildXMLObject(aa),
		}
	}))

	window.Set("Image", js.FuncOf(func(this js.Value, args []js.Value) any {
		if fileSelected != true {
			return map[string]interface{}{
				"error":       true,
				"errorReason": "Please select map file",
			}
		}
		//args[0] - Base64 encoded image data
		//args[1] - scale (should be 0.5)
		//args[2] - width
		//args[3] - height
		//args[4] - Append obj map index
		//args[5] - offsetXY
		var aa basic.SfmMaps
		xml.Unmarshal([]byte(fileStr), &aa)

		dec, _ := base64.StdEncoding.DecodeString(args[0].String())

		obj, num, err := packages.Image(bytes.NewReader(dec), args[2].Int(), args[3].Int(), args[1].Float(), args[5].Int())
		if err != nil {
			return map[string]interface{}{
				"error":       true,
				"errorReason": err.Error(),
			}
		}

		aa.SfmMap[args[4].Int()].Objects.Object = append(aa.SfmMap[args[4].Int()].Objects.Object, obj...)
		aa.SfmMap[args[4].Int()].Head.NumObjects += num

		return map[string]interface{}{
			"error":  false,
			"newMap": basic.BuildXMLObject(aa),
		}
	}))

	window.Set("Bright", js.FuncOf(func(this js.Value, args []js.Value) any {
		if fileSelected != true {
			return map[string]interface{}{
				"error":       true,
				"errorReason": "Please select map file",
			}
		}
		//args[0] - Base64 encoded image data
		//args[1] - width
		//args[2] - height
		//args[3] - lumMax
		//args[4] - Append obj map index
		var aa basic.SfmMaps
		xml.Unmarshal([]byte(fileStr), &aa)

		dec, _ := base64.StdEncoding.DecodeString(args[0].String())

		obj, num, err := packages.Bright(bytes.NewReader(dec), args[1].Int(), args[2].Int(), args[3].Float())
		if err != nil {
			return map[string]interface{}{
				"error":       true,
				"errorReason": err.Error(),
			}
		}

		aa.SfmMap[args[4].Int()].Objects.Object = append(aa.SfmMap[args[4].Int()].Objects.Object, obj...)
		aa.SfmMap[args[4].Int()].Head.NumObjects += num

		return map[string]interface{}{
			"error":  false,
			"newMap": basic.BuildXMLObject(aa),
		}
	}))


	window.Get("console").Call("table", window.Get("JSON").Call("parse", string(ErrorSuteru(json.Marshal(
		[]struct {
			Name                 string `json:"Name"`
			Playkey              int    `json:"Playkey"`
			PlayKeyPitchStandard int    `json:"PlayKeyPitchStandard"`
			PlayKeyHighestPitch  int    `json:"PlayKeyHighestPitch"`
		}{
			{
				Name:                 "Duck",
				Playkey:              0,
				PlayKeyPitchStandard: 61,
				PlayKeyHighestPitch:  73,
			},
			{
				Name:                 "Piano",
				Playkey:              18,
				PlayKeyPitchStandard: 30,
				PlayKeyHighestPitch:  49,
			},
		},
	)))))
	select {}
}

func ErrorSuteru[T any](v T, _ ...error) T {
	return v
}
