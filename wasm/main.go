//go:build js && wasm

package main

import (
	"IWMmain/src/packages"
	"encoding/json"
	"syscall/js"
)

var (
	window   = js.Global()
	document = window.Get("document")
)

func main() {
	window.Set("Midi", js.FuncOf(func(this js.Value, args []js.Value) any {
		var x []*packages.TrackInfo
		json.Unmarshal([]byte(args[1].String()), &x)


		packages.Midi()
		return "a"
	}))

	select {}
}
