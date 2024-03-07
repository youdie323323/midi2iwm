'use client';
import { useEffect } from 'react';
import Script from 'next/script'

//go class
declare const Go: any;

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
        
        <div className="input-group mb-3">
          <div className="input-group-prepend">
            <button
              className="btn btn-outline-secondary"
              type="button"
              id="inputGroupFileAddon03"
            >
              Button
            </button>
          </div>
          <div className="custom-file">
            <input
              type="file"
              className="custom-file-input"
              id="inputGroupFile03"
              aria-describedby="inputGroupFileAddon03"
            />
            <label className="custom-file-label" htmlFor="inputGroupFile03">
              Choose file
            </label>
          </div>
        </div>

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
              </div>
            </div>
          </div>
        </div>
      </div>
      <Script src='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js' />
    </div>
  )
}