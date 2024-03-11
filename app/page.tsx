'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script'

//declare
declare const Go: any;
declare const Midi: any;
declare const Image: any;
declare const Bright: any;

export default function App() {
  //load wasm
  useEffect(() => {
    (async () => {
      const go = new Go();
      const result = await WebAssembly.instantiateStreaming(fetch('main.wasm'), go.importObject);
      go.run(result.instance);
    })();
  }, []);
  function downloadText(fileName: string, text: string) {
    const aTag = document.createElement('a');
    aTag.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    aTag.target = '_blank';
    aTag.download = fileName;
    aTag.click();
    URL.revokeObjectURL(aTag.href);
  }
  function _arrayBufferToBase64(buffer: any): string {
    let binary = '';
    let bytes = new Uint8Array(buffer as ArrayBuffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
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

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Please input your map file before, *.map file only<br></br>Map file path is &quot;C:\Users\yourUsername\AppData\Local\IWM\maps&quot;</p>

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
                  Convert image to IWM using delicous fruit
                </p>
                <input
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white dark:text-gray-400 focus:outline-none dark:bg-gray-100 dark:border-gray-200 dark:placeholder-gray-400"
                  aria-describedby="file_input_help"
                  accept=".png,.jpeg"
                  onInput={function (e) {
                    const AppendMapIdx = prompt(`Please input room index you wanna append (number)`);
                    const Scale = prompt(`Please input fruit scale(0.5 = good)`);
                    const Width = prompt(`Please input width (fullMap = 794)`);
                    const Height = prompt(`Please input height (fullMap = 608)`);
                    
                    const file = e.target.files?.item(0)
                    if (!file) return

                    const reader = new FileReader()
                    reader.addEventListener('load', function (e) {
                      const imageObj = Image(
                        _arrayBufferToBase64(e.target?.result),
                        parseFloat(Scale as string),
                        Number(Width),
                        Number(Height),
                        Number(AppendMapIdx),
                      );
                      if (imageObj.error) {
                        alert(imageObj.errorReason)
                        return
                      }
                      downloadText("downloaded.map", imageObj.newMap)
                    });
                    reader.readAsArrayBuffer(e.target.files![0]);
                  } as React.ChangeEventHandler<HTMLInputElement>}
                  type="file" />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Input your image file</p>
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
                  Convert image to IWM using bright
                </p>
                <input
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white dark:text-gray-400 focus:outline-none dark:bg-gray-100 dark:border-gray-200 dark:placeholder-gray-400"
                  aria-describedby="file_input_help"
                  accept=".png,.jpeg"
                  onInput={function (e) {
                    const AppendMapIdx = prompt(`Please input room index you wanna append (number)`);
                    const Width = prompt(`Please input width (fullMap = 794)`);
                    const Height = prompt(`Please input height (fullMap = 608)`);
                    const MaxLum = prompt(`Please input brightness max (float)`);
                    
                    const reader = new FileReader()
                    reader.addEventListener('load', function (e) {
                      const brightObj = Bright(
                        _arrayBufferToBase64(e.target?.result),
                        Number(Width),
                        Number(Height),
                        parseFloat(MaxLum as string),
                        Number(AppendMapIdx),
                      );
                      if (brightObj.error) {
                        alert(brightObj.errorReason)
                        return
                      }
                      downloadText("downloaded.map", brightObj.newMap)
                    });
                    reader.readAsArrayBuffer(e.target.files![0]);
                  } as React.ChangeEventHandler<HTMLInputElement>}
                  type="file" />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Input your image file</p>
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
                    UnStable
                  </span>
                </h3>
                <p className="card-text">
                  Convert midi to IWM
                </p>
                <input
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white dark:text-gray-400 focus:outline-none dark:bg-gray-100 dark:border-gray-200 dark:placeholder-gray-400"
                  aria-describedby="file_input_help"
                  accept=".mid"
                  onInput={function (e) {
                    const AppendMapIdx = prompt(`Please input room index you wanna append (number)`)
                    const Speed = prompt(`Please input speed with float (1 ~ 2 good, float)`);
                    const HighestPitch = prompt(`Please highest pitch (number)`);

                    const reader = new FileReader()
                    reader.addEventListener('load', function (e) {
                      const midiObj = Midi(
                        _arrayBufferToBase64(e.target?.result),
                        (document.getElementById("JSONtrackInfo") as HTMLInputElement).value,
                        parseFloat(Speed as string),
                        Number(AppendMapIdx),
                        Number(HighestPitch)
                      );
                      if (midiObj.error) {
                        alert(midiObj.errorReason)
                        return
                      }
                      downloadText("downloaded.map", midiObj.newMap)
                    });
                    reader.readAsArrayBuffer(e.target.files![0]);
                  } as React.ChangeEventHandler<HTMLInputElement>}
                  type="file" />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Please input your midi file<br></br>Please enter track info with JSON, see the placeholder</p>
                <textarea
                  id="JSONtrackInfo"
                  rows={10}
                  className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="テキスト1&#10;テキスト2&#10;テキスト3"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Script src='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js' />
    </div>
  )
}