'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script'

//declare
declare const Go: any;
declare const Midi: any;

export default function App() {
  //load wasm
  useEffect(() => {
    (async () => {
      const go = new Go();
      const result = await WebAssembly.instantiateStreaming(fetch('main.wasm'), go.importObject);
      go.run(result.instance);
    })();
  }, []);

  return (
    <div>
      <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className="container">
          <a className="navbar-brand">
            IWM Tools
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>
        </div>
      </nav>
      <div className="container mt-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item active" aria-current="page">
              Dashboard
            </li>
          </ol>
        </nav>
        <h2>
          Welcome
        </h2>
        <p>
          This is IWM tools dashboard.
        </p>

        <input
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white dark:text-gray-400 focus:outline-none dark:bg-gray-100 dark:border-gray-200 dark:placeholder-gray-400"
          aria-describedby="file_input_help"
          accept=".map"
          id="mapfile"
          type="file" />

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Please input your map file before, *.map file only</p>

        <div className="row row-cols-1 row-cols-md-2 g-4">
          <div className="col-md-6">
            <div className="card widget">
              <div className="card-body">
                <h3
                  className="card-title"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <i
                    className="material-icons text-primary-emphasis"
                    style={{
                      fontSize: 24,
                      marginRight: 10,
                      verticalAlign: "middle"
                    }}
                  >
                    image
                  </i>{" "}
                  Image To IWM
                  <span className="ms-auto" style={{ color: "#666" }}>
                    Stable
                  </span>
                </h3>
                <p className="card-text">
                  Convert image to IWM using fruit.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card widget">
              <div className="card-body">
                <h3
                  className="card-title"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <i
                    className="material-icons text-danger-emphasis"
                    style={{
                      fontSize: 24,
                      marginRight: 10,
                      verticalAlign: "middle"
                    }}
                  >
                    light_mode
                  </i>{" "}
                  Image to IWM Bright
                  <span className="ms-auto" style={{ color: "#666" }}>
                    Stable
                  </span>
                </h3>
                <p className="card-text">
                  Convert image to IWM using bright.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card widget">
              <div className="card-body">
                <h3
                  className="card-title"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <i
                    className="material-icons text-danger-emphasis"
                    style={{
                      fontSize: 24,
                      marginRight: 10,
                      verticalAlign: "middle"
                    }}
                  >
                    music_note
                  </i>{" "}
                  Midi to IWM
                  <span className="ms-auto" style={{ color: "#666" }}>
                    Stable
                  </span>
                </h3>
                <p className="card-text">
                  Convert midi to IWM.
                </p>
                <input
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white dark:text-gray-400 focus:outline-none dark:bg-gray-100 dark:border-gray-200 dark:placeholder-gray-400"
                  aria-describedby="file_input_help"
                  accept=".midi,.mid"
                  onInput={function (e) {
                    const infoJson = prompt(`Please input your info with JSON (piano Example (see the console for more info): [{"Index":0,"Volume":1,"PlayKey":0,"PlayKeyPitchStandard":61,"PlayKeyHighestPitch":73,"Offset":0}] )`)
                    const AppendMapIdx = prompt(`Please specify room index you wanna append (number)`)
                    const Speed = prompt(`Please input speed with float (1 ~ 2 good, float)`) as string
                    const BaseMinus = prompt(`Use baseMinus algorithm (same as MIDI to IWM) true / ...`)
                    let pitchForBaseMinus: boolean | string = false
                    if (BaseMinus == "true") {
                      pitchForBaseMinus = prompt(`Please input HighestPitch for baseMinus (number)`) as string
                    }
                    function _arrayBufferToBase64(buffer: any): string {
                      var binary = '';
                      var bytes = new Uint8Array(buffer as ArrayBuffer);
                      var len = bytes.byteLength;
                      for (var i = 0; i < len; i++) {
                        binary += String.fromCharCode(bytes[i]);
                      }
                      return window.btoa(binary);
                    }
                    const file = e.target.files?.item(0)
                    if (!file) return

                    const reader = new FileReader()
                    reader.addEventListener('load', function (e) {
                      const aa = Midi(
                        _arrayBufferToBase64(e.target?.result),
                        infoJson,
                        parseFloat(Speed),
                        BaseMinus === "true",
                        pitchForBaseMinus ? Number(pitchForBaseMinus) : 0,
                        Number(AppendMapIdx),
                      )
                      if (aa.error) {
                        alert(aa.errorReason)
                        return
                      }
                      console.log(aa.newMap)
                    });
                    reader.readAsArrayBuffer(e.target.files![0]);
                  } as React.ChangeEventHandler<HTMLInputElement>}
                  type="file" />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Input your midi file, option are ask by alert.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Script src='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js' />
    </div>
  )
}