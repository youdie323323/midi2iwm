'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script'
import MIDIPlayer from 'midi-player-js';
import Soundfont, {InstrumentName} from 'soundfont-player';

declare global {
  interface Window {
    __iwm_wasm_exports: any;
  }
}

const SUB_MAP_WIDTH = 798;
const SUB_MAP_HEIGHT = 609;

const MAX_MAP_WIDTH = 800;
const MAX_MAP_HEIGHT = 608;

export default function App() {
  const [showCanvas, setShowCanvas] = useState(false);
  const [fadeType, setFadeType] = useState<'fade-in' | 'fade-out'>('fade-in');

  useEffect(() => {
    if (showCanvas) {
      setFadeType('fade-in');
    } else {
      setFadeType('fade-out');
    }
  }, [showCanvas]);


  function handleCloseCanvas() {
    setFadeType('fade-out');
    setTimeout(() => {
      const previewContainer = document.getElementById("preview-container");
      previewContainer!.style.display = "none";
      setShowCanvas(false);
    }, 300);
  }

  function handleShowCanvas() {
    const previewContainer = document.getElementById("preview-container");
    previewContainer!.style.display = "block";

    setShowCanvas(true);
  }

  function imageAsBase64(input: any) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve((reader?.result as string).split(',')[1])
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(input);
    });
  }

  function drawObjects(result: any, rWidth: number, rHeight: number) {
    const canvas = document.getElementById("preview-image") as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d')!;
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d')!;

    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;

    offscreenCtx.fillStyle = 'black';
    offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    result.objects.forEach((obj: any) => {
      offscreenCtx.beginPath();
      offscreenCtx.arc(obj.x, obj.y, obj.scale * 10, 0, 2 * Math.PI, false);
      offscreenCtx.fillStyle = `rgb(${obj.rgb})`;
      offscreenCtx.fill();
      offscreenCtx.closePath();
    });

    ctx.drawImage(offscreenCanvas, 0, 0, rWidth, rHeight);

    offscreenCanvas.remove();
  }

  function readText(file: Blob) {
    return new Promise((resolve) => {
      var fr = new FileReader();
      fr.onload = (e) => {
        resolve(e.target?.result);
      };
      fr.readAsText(file);
    });
  };

  // https://kuma-emon.com/it/pc/1228/
  function downloadText(fName: string, text: string) {
    const blob = new Blob([text], { type: 'text/plain' });
    const aTag = document.createElement('a');
    aTag.href = URL.createObjectURL(blob);
    aTag.target = '_blank';
    aTag.download = fName;
    aTag.click();
    URL.revokeObjectURL(aTag.href);
  };

  // MIDI players
  const [player] = useState(new MIDIPlayer.Player());
  const [instruments, setInstruments] = useState<{ [key: number]: any }>({});
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  
  useEffect(() => {
    player.on('midiEvent', (event: { name?: any; channel?: any; noteNumber?: any; velocity?: any; noteName?: any }) => {
      const { channel, velocity, name, noteName } = event;

      if (!instruments[channel]) return;

      const instrument = instruments[channel];
      if (name === 'Note on' && velocity > 0) {
        instrument.play(noteName, audioContext!.currentTime, {
          gain: velocity / 127,
        });
      }
    });
  }, [player, instruments, audioContext]);

  const playMidi = async (file: File) => {
    if (!audioContext) {
      const context = new window.AudioContext();
      setAudioContext(context);

      const loadedInstruments = await Promise.all(
        [...Array(16).keys()].map(channel =>
          Soundfont.instrument(
            context,
            // Fuck-it, lmao
            'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/MusyngKite/acoustic_guitar_nylon-mp3.js' as InstrumentName,
          ).then(inst => ({ [channel]: inst }))
        )
      ).then(results => results.reduce((acc, cur) => ({ ...acc, ...cur }), {}));

      setInstruments(loadedInstruments);
      console.log('All instruments loaded');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        player.loadArrayBuffer(e.target.result as ArrayBuffer);
        player.play();  // Start playing the MIDI file after loading
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <div className="container mt-4">
        <h2>
          Welcome
        </h2>
        <p>
          This is a web tool made for i-Wanna-Maker on Steam. Please read and follow the official game rules.<br></br>
          This tool does not contain any viruses and only run in client-side using WebAssembly.
        </p>
        <input
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white dark:text-gray-400 focus:outline-none dark:bg-gray-100 dark:border-gray-200 dark:placeholder-gray-400"
          aria-describedby="file_input_help"
          accept=".map"
          id="map"
          type="file" />

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Please input your map file</p>

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
                  >image</i>{" "}
                  Image To Bullet
                  <span className="ms-auto" style={{ color: "#666" }}>Stable</span>
                </h3>
                <p className="card-text">
                  Reproduce the image using bullets blend color
                </p>
                <input
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white dark:text-gray-400 focus:outline-none dark:bg-gray-100 dark:border-gray-200 dark:placeholder-gray-400"
                  aria-describedby="file_input_help"
                  accept=".png,.jpeg,.jfif"
                  onInput={async function (e) {
                    if (!(document.getElementById('map') as HTMLInputElement).files![0]) {
                      globalThis.alert("Map file not specified")
                      return;
                    }

                    const txt = (await readText((document.getElementById('map') as HTMLInputElement).files![0])) as string | undefined | null;
                    if (!txt) {
                      globalThis.alert("Map file not specified")
                      return;
                    }

                    const file = (e.target as HTMLInputElement).files![0];
                    if (file) {
                      const result = window.__iwm_wasm_exports.image((await imageAsBase64(file)), SUB_MAP_WIDTH, SUB_MAP_HEIGHT, 0.6, 7, txt);
                      if (!(typeof result === 'object' && !Array.isArray(result) && result !== null)) {
                        globalThis.alert("Object generation failure. there are problems with your image and map.");
                        return
                      };

                      drawObjects(result, SUB_MAP_WIDTH, SUB_MAP_HEIGHT);
                      downloadText("download.map", result.rawXml)
                    }
                  } as React.ChangeEventHandler<HTMLInputElement>}
                  type="file" />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Please input your image. png,jpeg,jfif allowed</p>
                <button
                  className="btn btn-primary mt-2"
                  onClick={handleShowCanvas}
                >Show Preview</button>
                <div className={`fullscreen-canvas-container ${fadeType}`} id="preview-container" style={{ display: "none" }}>
                  <button
                    className="close-preview-button"
                    onClick={handleCloseCanvas}
                  >
                    <i className="material-icons">arrow_back</i>
                  </button>
                  <canvas id="preview-image" width="800" height="608"></canvas>
                </div>
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
                    className="material-icons text-primary-emphasis"
                    style={{
                      fontSize: 24,
                      marginRight: 10,
                      verticalAlign: "middle"
                    }}
                  >light</i>{" "}
                  Image To light
                  <span className="ms-auto" style={{ color: "#666" }}>Mysterious</span>
                </h3>
                <p className="card-text">
                  Reproduce the image using light hsl parameter
                </p>
                <input
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white dark:text-gray-400 focus:outline-none dark:bg-gray-100 dark:border-gray-200 dark:placeholder-gray-400"
                  aria-describedby="file_input_help"
                  accept=".png,.jpeg,.jfif"
                  onInput={async function (e) {
                    if (!(document.getElementById('map') as HTMLInputElement).files![0]) {
                      globalThis.alert("Map file not specified")
                      return;
                    }

                    const txt = (await readText((document.getElementById('map') as HTMLInputElement).files![0])) as string | undefined | null;
                    if (!txt) {
                      globalThis.alert("Map file not specified")
                      return;
                    }

                    const file = (e.target as HTMLInputElement).files![0];
                    if (file) {
                      const result = window.__iwm_wasm_exports.light((await imageAsBase64(file)), MAX_MAP_WIDTH, MAX_MAP_HEIGHT, 0.2, 8, txt);
                      if (!(typeof result === 'object' && !Array.isArray(result) && result !== null)) {
                        globalThis.alert("Object generation failure. there are problems with your image and map.");
                        return
                      };

                      downloadText("download.map", result.rawXml)
                    }
                  } as React.ChangeEventHandler<HTMLInputElement>}
                  type="file" />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Please input your image. png,jpeg,jfif allowed</p>
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
                    className="material-icons text-primary-emphasis"
                    style={{
                      fontSize: 24,
                      marginRight: 10,
                      verticalAlign: "middle"
                    }}
                  >music_note</i>{" "}
                  Midi to IWM
                  <span className="ms-auto" style={{ color: "#666" }}>Stable</span>
                </h3>
                <p className="card-text">
                  Convert midi to IWM<br></br>
                  Has a velocity system
                </p>
                <input
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white dark:text-gray-400 focus:outline-none dark:bg-gray-100 dark:border-gray-200 dark:placeholder-gray-400"
                  aria-describedby="file_input_help"
                  accept=".mid,.midi"
                  onInput={async function (e) {
                    const target = e.target as HTMLInputElement;
                    const file = target.files?.[0];
                    if (file) {
                      playMidi(file);
                    }
                  } as React.ChangeEventHandler<HTMLInputElement>}
                  type="file" />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Please input your mid file.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .fullscreen-canvas-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .fullscreen-canvas-container.fade-in {
          opacity: 1;
        }
        .fullscreen-canvas-container.fade-out {
          opacity: 0;
        }
        .close-preview-button {
          position: absolute;
          top: 10px;
          left: 10px;
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }
        canvas {
          max-width: 90%;
          max-height: 90%;
          margin: auto;
          display: block;
        }
      `}</style>
      <Script src='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js' />
    </div>
  )
}