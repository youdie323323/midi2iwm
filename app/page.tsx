'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script'

declare global {
  interface Window {
    __iwm_wasm_exports: any;
  }
}

export default function App() {
  const [showCanvas, setShowCanvas] = useState(false);

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

  function drawObjects(objects: any, rWidth: number, rHeight: number, id: string) {
    const canvas = document.getElementById(id) as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d')!;
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d')!;

    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;

    canvas.width = rWidth;
    canvas.height = rHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    objects.forEach((obj: any) => {
      offscreenCtx.beginPath();
      offscreenCtx.arc(obj.x, obj.y, obj.scale * 10, 0, 2 * Math.PI, false);
      offscreenCtx.fillStyle = `rgb(${obj.rgb})`;
      offscreenCtx.fill();
      offscreenCtx.closePath();
    });

    ctx.drawImage(offscreenCanvas, 0, 0, rWidth, rHeight);
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
          id="mapfile"
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
                  Image To IWM
                  <span className="ms-auto" style={{ color: "#666" }}>Stable</span>
                </h3>
                <p className="card-text">
                  Convert image to IWM using bullet
                </p>
                <input
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white dark:text-gray-400 focus:outline-none dark:bg-gray-100 dark:border-gray-200 dark:placeholder-gray-400"
                  aria-describedby="file_input_help"
                  accept=".png,.jpeg,.jfif"
                  onInput={async function (e) {
                    const file = (e.target as HTMLInputElement).files![0];
                    if (file) {
                      drawObjects(window.__iwm_wasm_exports.image((await imageAsBase64(file)), 798, 602, 0.6, 7), 798, 602, "preview-image");
                    }
                  } as React.ChangeEventHandler<HTMLInputElement>}
                  type="file" />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Please input your image. png,jpeg,jfif allowed</p><br></br>
                <button
                  className="btn btn-primary mt-2"
                  onClick={() => setShowCanvas(true)}
                >Show Preview</button>
                {showCanvas && (
                  <div className="fullscreen-canvas-container">
                    <button
                      className="btn btn-secondary close-preview-button"
                      onClick={() => setShowCanvas(false)}
                    >Close Preview</button>
                    <canvas id="preview-image"></canvas>
                  </div>
                )}
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
          flex-direction: column;
        }
        canvas {
          max-width: 90%;
          max-height: 90%;
        }
        .close-preview-button {
          margin-bottom: 10px;
        }
      `}</style>
      <Script src='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js' />
    </div>
  )
}