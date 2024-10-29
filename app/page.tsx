'use client';
import './globals.css';
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CSSTransition, TransitionGroup } from 'react-transition-group';

interface TrackConfig {
  id: any;
  Track: number;
  Instrumental: number;
  BaseNote: number;
  MaxNote: number;
  Offsets: {
    Volume: number;
    VolumeConstant: boolean;
    Pitch: number;
    PitchConstant: boolean;
  };
  Loop: {
    Enable: boolean;
    LoopOffset: number;
  };
  Speed: number;
  StripAfter: number;
  StripBefore: number;
  StartAt: number;
}

const trackConfigKeys: (keyof TrackConfig)[] = ["id", "Track", "Instrumental", "BaseNote", "MaxNote", "Offsets", "Loop", "Speed", "StripAfter", "StripBefore", "StartAt"];

declare global {
  interface Window {
    __wasm_iwm_exports: {
      getTracks: (arg: string) => string;
      midiToObjectXML: (arg: string, config: string) => string;
    }
  }
}

const instrumentals: string[] = [
  "Duck",
  "Glass Break",
  "Bubble",
  "Light Switch",
  "Ring Bell",
  "Exclamation",
  "Spring",
  "Horn",
  "OK",
  "Glass Break 2",
  "Punch",
  "Laser Gun",
  "Woosh",
  "Whistle",
  "Magic",
  "Ninja",
  "Clapping",
  "Drum Roll",
  "Piano",
  "Bass",
  "Party Noisemaker",
  "Hoot",
  "Laughter",
  "Suspense",
  "Wood Scraper",
  "Drum",
  "No-no",
  "Glass Bottle",
  "Woodimba",
  "Metallic Hit",
  "Gun",
  "Electric Charge",
  "Laser Blast (Foam Icon)",
  "Heartbeat",
  "Rubber Chicken",
  "Dog Bark",
  "Cat Meow",
  "Toll Bell",
  "Robot"
];

const defaultTrackConfig = (id: number): TrackConfig => ({
  // Default is piano
  id: id,
  Track: 0,
  Instrumental: instrumentals.indexOf("Piano"),
  BaseNote: 51,
  MaxNote: 73,
  Offsets: {
    Volume: 0,
    VolumeConstant: false,
    Pitch: 0,
    PitchConstant: false,
  },
  Loop: {
    Enable: false,
    LoopOffset: 0,
  },
  Speed: 1.0,
  StripAfter: 3000,
  StripBefore: 0,
  StartAt: 0,
});

const defaultConfigs: TrackConfig[] = [defaultTrackConfig(0)];

export default function App() {
  const [configs, setConfigs] = useState(defaultConfigs);
  const [activeConfig, setActiveConfig] = useState(configs[0]);
  const [configNames, setConfigNames] = useState<string[]>([]);
  const [configsModified, setConfigsModified] = useState<boolean>(false);
  const tabListRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
    }
    return (hash >>> 0).toString(36).padStart(7, '0');
  };

  function hasAllKeys<T>(obj: any, keys: (keyof T)[]): obj is T {
    return keys.every(key => key in obj);
  }

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const fileContent = reader.result;
        if (typeof fileContent !== "string") {
          appendLog('Config is not valid type');
          return;
        }
        const parsed = JSON.parse(fileContent);
        if (!Array.isArray(parsed) || parsed.map((v) => hasAllKeys(v, trackConfigKeys)).some(v => v === false)) {
          appendLog('Config is not valid type');
          return;
        }
        setConfigs(parsed as TrackConfig[]);
      };
      reader.readAsText(file);
    }

    event.target.value = "";
  };

  const loadConfigNames = () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('trackConfig_'));
    setConfigNames(keys.map(key => key.replace('trackConfig_', '')));
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadConfigNames();
    }
  }, []);

  const saveConfigName = () => {
    const configName = prompt("Input config name to load");
    if (!configName) {
      appendLog('Please specify valid name');
      return
    }
    if (localStorage.getItem(`trackConfig_${configName}`) != null) {
      appendLog(`Config with name '${configName}' already exists`);
      return
    }
    localStorage.setItem(`trackConfig_${configName}`, JSON.stringify(configs));
    appendLog(`Configuration '${configName}' saved to storage`);
    loadConfigNames();
  };

  const deleteConfigName = () => {
    const configName = prompt("Input config name to delete");
    if (!configName) {
      appendLog('Please specify valid name');
      return
    }
    if (localStorage.getItem(`trackConfig_${configName}`) == null) {
      appendLog(`Config with name '${configName}' not exists`);
      return
    }
    localStorage.removeItem(`trackConfig_${configName}`);
    appendLog(`Configuration '${configName}' deleted from storage`);
    loadConfigNames();
  };

  const loadConfig = (name: string) => {
    if (name === "THIS_IS_TEMP_DONT_USE") {
      appendLog("Invalid config selected");
      return;
    }

    if (configsModified) {
      const confirmed = window.confirm("Unsaved changes exist. Do you want to load the new configuration and discard current changes?");
      if (!confirmed) {
        appendLog("Load canceled by user");
        return;
      }
    }

    const savedConfig = localStorage.getItem(`trackConfig_${name}`);
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      setConfigs(parsedConfig);
      if (parsedConfig.length > 0) {
        setActiveConfig(parsedConfig[0]);
      }
      appendLog(`Configuration '${name}' loaded from storage`);
      setConfigsModified(false);
    } else {
      appendLog(`Configuration '${name}' not found in storage`);
    }
  };

  function toBase64(buffer: ArrayBuffer): string {
    const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    const byteLength = buffer.byteLength;
    const bufferView = new Uint8Array(buffer);
    const remainingBytesCount = byteLength % 3;
    const mainLength = byteLength - remainingBytesCount;

    let string = "";
    let i = 0;

    for (; i < mainLength; i += 3) {
      const chunk = (bufferView[i] << 16) | (bufferView[i + 1] << 8) | bufferView[i + 2];
      string += base64Chars[(chunk & 0b111111000000000000000000) >> 18];
      string += base64Chars[(chunk & 0b000000111111000000000000) >> 12];
      string += base64Chars[(chunk & 0b000000000000111111000000) >> 6];
      string += base64Chars[(chunk & 0b000000000000000000111111)];
    }

    if (remainingBytesCount === 2) {
      const chunk = (bufferView[i] << 16) | (bufferView[i + 1] << 8);
      string += base64Chars[(chunk & 0b111111000000000000000000) >> 18];
      string += base64Chars[(chunk & 0b000000111111000000000000) >> 12];
      string += base64Chars[(chunk & 0b000000000000111111000000) >> 6];
      string += "=";

    } else if (remainingBytesCount === 1) {
      const chunk = (bufferView[i] << 16);
      string += base64Chars[(chunk & 0b111111000000000000000000) >> 18];
      string += base64Chars[(chunk & 0b000000111111000000000000) >> 12];
      string += "==";
    }

    return string;
  }

  const appendLog = (message: string) => {
    const logConsole = document.getElementById("log-console");
    if (logConsole) {
      const timestamp = new Date().toLocaleTimeString();
      const timestampSpan = `<span class="log-time text-nowrap">[${timestamp}]</span>`;
      const logLine = document.createElement("div");
      logLine.innerHTML = message.split("\n").map((str) => str.length !== 0 ? (timestampSpan + str) : null).filter(c => c != null).join("\n");
      logConsole.appendChild(logLine);
      logConsole.scrollTop = logConsole.scrollHeight;
    }
  };

  const appendLinkMessage = (message: string, data: string, numObject: number) => {
    const logConsole = document.getElementById("log-console");
    if (logConsole) {
      const timestamp = new Date().toLocaleTimeString();
      const timestampSpan = document.createElement("span");
      timestampSpan.className = "log-time";
      timestampSpan.textContent = `[${timestamp}]`;

      const logLine = document.createElement("div");

      const linkElement = document.createElement("div");
      linkElement.className = "log-link";
      linkElement.innerHTML = message;
      linkElement.onclick = () => {
        downloadText("out.txt", data);
      };

      const textBefore = document.createTextNode("Done. click ");
      const textAfter = document.createTextNode(` to download objects | num objects: ${numObject}`);

      logLine.appendChild(timestampSpan);
      logLine.appendChild(textBefore);
      logLine.appendChild(linkElement);
      logLine.appendChild(textAfter);

      logConsole.appendChild(logLine);
      logConsole.scrollTop = logConsole.scrollHeight;
    }
  };

  const downloadText = (filename: string, text: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: "application/json" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const loadMidiFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(toBase64(e.target.result as ArrayBuffer));
        }
      };
      reader.readAsArrayBuffer(file);
    })
  };

  const handleInputChange = (index: number, e: any) => {
    const { name, value, type, checked } = e.target;
    let newValue;
    if (type === "checkbox") {
      newValue = checked;
    } else if (type === "number") {
      newValue = ["Speed", "Offsets.Pitch", "Offsets.Volume"].indexOf(name) !== -1 ? parseFloat(value) : parseInt(value, 10);
    } else {
      newValue = parseInt(value, 10);
    }
    if (isNaN(newValue)) {
      newValue = "";
    }
    const keys = name.split('.');

    const updatedTracks = [...configs];
    if (keys.length === 1) {
      updatedTracks[index] = { ...updatedTracks[index], [name]: newValue };
    } else {
      updatedTracks[index] = {
        ...updatedTracks[index],
        [keys[0]]: {
          ...updatedTracks[index][keys[0] as keyof TrackConfig],
          [keys[1]]: newValue,
        },
      };
    }
    setConfigs(updatedTracks);
    setConfigsModified(true);
  };

  const addConfig = () => {
    const newId = configs.length > 0 ? Math.max(...configs.map(t => t.id)) + 1 : 0;
    const config = defaultTrackConfig(newId);
    setConfigs([...configs, config]);
    setActiveConfig(config);
    setConfigsModified(true);
  };

  const removeConfig = (cur: TrackConfig) => {
    const updatedTracks = configs.filter((track) => track.id !== cur.id);
    setConfigs(updatedTracks);
    if (activeConfig?.id === cur?.id) {
      const newActiveConfig = updatedTracks[configs.indexOf(cur)] || updatedTracks[updatedTracks.length - 1];
      if (newActiveConfig) {
        setActiveConfig(newActiveConfig);
      }
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const file = (document.getElementById("midi-input") as HTMLInputElement).files?.[0];
    if (!file) {
      appendLog("Please input midi file before submit");
      return;
    }
    const result = window.__wasm_iwm_exports.midiToObjectXML(await loadMidiFile(file), JSON.stringify(configs));
    appendLinkMessage("here", result[0] as string, result[1] as unknown as number);
  };

  useLayoutEffect(() => {
    appendLog("Webassembly setup");
  }, []);

  return (
    <div className="container">
      <div className="text-center mt-2">
        <p className="block mb-2 text-sm text-gray-500 dark:text-gray-400 w-full" id="file_input_help">MIDI files only (.mid, .midi)</p>
        <input
          className="w-full px-2 py-2 text-sm"
          aria-describedby="file_input_help"
          accept=".mid,.midi"
          id="midi-input"
          onInput={async function (e) {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              appendLog(window.__wasm_iwm_exports.getTracks(await loadMidiFile(file)));
            }
          } as React.ChangeEventHandler<HTMLInputElement>}
          type="file"
        />
      </div>
      <br />
      <h5>Log</h5><div aria-label="System Information" id="log-console"></div>
      <br />
      <div className="d-flex justify-content-end">
        <button className="btn btn-primary me-2" style={{ width: 75, height: 33, padding: "1px 0rem 0px 0px" }} onClick={saveConfigName}>Save</button>
        <button className="btn btn-danger me-2" style={{ width: 82, height: 33, padding: "1px 0rem 0px 0px" }} onClick={deleteConfigName}>Delete</button>
        <select
          className="form-select me-2"
          onChange={(e) => loadConfig(e.target.value)}
        >
          <option value="THIS_IS_TEMP_DONT_USE">Select Config to Load</option>
          {configNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      <span>...or <div className='log-link' onClick={openFileDialog}>import</div>/<div className='log-link' onClick={() => {
        const configsJson = JSON.stringify(configs);
        downloadText(`export_${simpleHash(configsJson)}.json`, configsJson);
      }}>export</div> as JSON</span>
      <br />
      <h5>Config editor</h5>
      <ul className="nav nav-tabs mb-3" ref={tabListRef}>
        <TransitionGroup component={null}>
          {configs.map((track) => (
            <CSSTransition
              key={track.id}
              nodeRef={tabListRef} in timeout={150}
              classNames="fade"
            >
              <li className="nav-item" key={track.id}>
                <div
                  className={`nav-link ${activeConfig.id === track.id ? 'active' : ''}`}
                  onClick={() => setActiveConfig(track)}
                >
                  Config {track.id + 1}
                  <button
                    type="button"
                    className="btn btn-close btn-close-white ms-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeConfig(track);
                    }}
                    aria-label={`Close Config ${track.id + 1}`}
                  />
                </div>
              </li>
            </CSSTransition>
          ))}
        </TransitionGroup>
        <li className="nav-item">
          <button className="nav-link" onClick={addConfig}>
            + Add Config
          </button>
        </li>
      </ul>

      <form onSubmit={handleSubmit}>
        {configs.map((track, index) => (
          activeConfig.id === track.id && (
            <div key={track.id} className="track-config mb-4">
              <h4><i className="fa-brands fa-itunes-note"></i> Config {track.id + 1}</h4>
              <div className="row mb-3">
                <div className="col">
                  <label htmlFor={`Track-${track.id}`} className="form-label">Track</label>
                  <input
                    type="number"
                    className="form-control"
                    id={`Track-${track.id}`}
                    name="Track"
                    value={track.Track}
                    onChange={(e) => handleInputChange(index, e)}
                  />
                </div>
                <div className="col">
                  <label htmlFor={`Instrumental-${track.id}`} className="form-label">Instrumental</label>
                  <select
                    className="form-select"
                    aria-label="instrumental"
                    id={`Instrumental-${track.id}`}
                    name="Instrumental"
                    value={track.Instrumental}
                    onChange={(e) => handleInputChange(index, e)}
                  >
                    <option value=""> -- inst -- </option>
                    {instrumentals.map((track, index) => (
                      <option value={index} key={index}>{track}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col">
                  <label htmlFor={`BaseNote-${track.id}`} className="form-label">Base Note</label>
                  <input
                    type="number"
                    className="form-control"
                    id={`BaseNote-${track.id}`}
                    name="BaseNote"
                    value={track.BaseNote}
                    onChange={(e) => handleInputChange(index, e)}
                  />
                </div>
                <div className="col">
                  <label htmlFor={`MaxNote-${track.id}`} className="form-label">Max Note</label>
                  <input
                    type="number"
                    className="form-control"
                    id={`MaxNote-${track.id}`}
                    name="MaxNote"
                    value={track.MaxNote}
                    onChange={(e) => handleInputChange(index, e)}
                  />
                </div>
              </div>

              {/* Offsets */}
              <h4><i className="fa-sharp fa-regular fa-volume"></i> Offsets</h4>
              <div className="row mb-3">
                <div className="col">
                  <label htmlFor={`Offsets.Volume-${track.id}`} className="form-label">Volume</label>
                  <input
                    type="number"
                    className="form-control"
                    id={`Offsets.Volume-${track.id}`}
                    name="Offsets.Volume"
                    value={track.Offsets.Volume}
                    onChange={(e) => handleInputChange(index, e)}
                  />
                </div>
                <div className="col">
                  <label className="form-check-label" htmlFor={`Offsets.VolumeConstant-${track.id}`}>Volume Constant</label>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`Offsets.VolumeConstant-${track.id}`}
                    name="Offsets.VolumeConstant"
                    checked={track.Offsets.VolumeConstant}
                    onChange={(e) => handleInputChange(index, e)}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col">
                  <label htmlFor={`Offsets.Pitch-${track.id}`} className="form-label">Pitch</label>
                  <input
                    type="number"
                    className="form-control"
                    id={`Offsets.Pitch-${track.id}`}
                    name="Offsets.Pitch"
                    value={track.Offsets.Pitch}
                    onChange={(e) => handleInputChange(index, e)}
                  />
                </div>
                <div className="col">
                  <label className="form-check-label" htmlFor={`Offsets.PitchConstant-${track.id}`}>Pitch Constant</label>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`Offsets.PitchConstant-${track.id}`}
                    name="Offsets.PitchConstant"
                    checked={track.Offsets.PitchConstant}
                    onChange={(e) => handleInputChange(index, e)}
                  />
                </div>
              </div>

              {/* Loop Configuration */}
              <h4><i className="fa-regular fa-arrows-rotate-reverse"></i> Loop</h4>
              <div className="row mb-3">
                <div className="col">
                  <label className="form-check-label" htmlFor={`Loop.Enable-${track.id}`}>Enable Loop</label>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`Loop.Enable-${track.id}`}
                    name="Loop.Enable"
                    checked={track.Loop.Enable}
                    onChange={(e) => handleInputChange(index, e)}
                  />
                </div>
                <div className="col">
                  <label htmlFor={`Loop.LoopOffset-${track.id}`} className="form-label">Loop Offset</label>
                  <input
                    type="number"
                    className="form-control"
                    id={`Loop.LoopOffset-${track.id}`}
                    name="Loop.LoopOffset"
                    value={track.Loop.LoopOffset}
                    onChange={(e) => handleInputChange(index, e)}
                  />
                </div>
              </div>

              {/* Other fields */}
              <h4>Frame</h4>
              <div className="row mb-3">
                <div className="col">
                  <label htmlFor={`Speed-${track.id}`} className="form-label">Speed</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id={`Speed-${track.id}`}
                    name="Speed"
                    value={track.Speed}
                    onChange={(e) => handleInputChange(index, e)}
                  />
                </div>
                <div className="col">
                  <label htmlFor={`StartAt-${track.id}`} className="form-label">Start At</label>
                  <input
                    type="number"
                    className="form-control"
                    id={`StartAt-${track.id}`}
                    name="StartAt"
                    value={track.StartAt}
                    onChange={(e) => handleInputChange(index, e)}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col">
                  <label htmlFor={`StripBefore-${track.id}`} className="form-label">Strip Before</label>
                  <input
                    type="number"
                    className="form-control"
                    id={`StripBefore-${track.id}`}
                    name="StripBefore"
                    value={track.StripBefore}
                    onChange={(e) => handleInputChange(index, e)}
                  />
                </div>
                <div className="col">
                  <label htmlFor={`StripAfter-${track.id}`} className="form-label">Strip After</label>
                  <input
                    type="number"
                    className="form-control"
                    id={`StripAfter-${track.id}`}
                    name="StripAfter"
                    value={track.StripAfter}
                    onChange={(e) => handleInputChange(index, e)}
                  />
                </div>
              </div>
            </div>
          )
        ))}

        <input type="submit" value="Submit config" />
      </form>

      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}