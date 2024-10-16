import { useEffect, useState } from 'react';
import TrackConfigMenu from './TrackConfigMenu';

export default function Home() {
  const [wasmLoaded, setWasmLoaded] = useState(false);
  const [trackConfig, setTrackConfig] = useState(null);

  useEffect(() => {
    const loadWasm = async () => {
      setWasmLoaded(true);
    };

    loadWasm();
  }, []);

  const loadMidi = async (file) => {
    if (!wasmLoaded) {
      console.log("WASMがまだロードされていません。");
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    const midiData = new Uint8Array(arrayBuffer);

    GoGetMidiTracks(midiData);
  };

  return (
    <div className="container">
      <h1 className="mt-5">MIDI Loader</h1>

      <div className="mt-3">
        <label htmlFor="midiFile" className="form-label">Select a MIDI file:</label>
        <input
          type="file"
          className="form-control"
          id="midiFile"
          accept=".mid"
          onChange={(e) => loadMidi(e.target.files[0])}
        />
      </div>

      <div className="mt-5">
        <h2>Track Configurations</h2>
        <TrackConfigMenu onConfigChange={setTrackConfig} />
      </div>
    </div>
  );
}
