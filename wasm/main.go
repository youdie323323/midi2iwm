//go:build js && wasm

package main

import (
	"syscall/js"
)

var (
	window   = js.Global()
	document = window.Get("document")
)

func main() {
	window.Set("Image", js.FuncOf(func(this js.Value, args []js.Value) any {
		return "a"
	}))

	select {}
}
