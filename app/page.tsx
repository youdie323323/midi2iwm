'use client';
import './globals.css';
import { Fragment, SyntheticEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import Modal from 'react-modal';
import 'katex/dist/katex.min.css';
import TeX from '@matejmazur/react-katex';

declare global {
  // Define exports between wasm
  interface Window {
    __wasm_iwm_exports: {
      getTracks: (arg: string) => string;
      midiToIwm: (arg: string, config: string) => string;
    },
    appendLog: (arg: string) => void;
  }
}

interface TrackConfig {
  id: any;
  Track: number;
  Instrumental: number;
  /**
   * @remarks
   * 
   * This value will string, but evalute to number on the submittion.
   */
  BaseNote: string;
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

type RealTrackConfig = Omit<TrackConfig, "BaseNote"> & { BaseNote: number };

const trackConfigKeys: (keyof TrackConfig)[] = ["id", "Track", "Instrumental", "BaseNote", "MaxNote", "Offsets", "Loop", "Speed", "StripAfter", "StripBefore", "StartAt"];

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
  BaseNote: "61",
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

Modal.setAppElement('body');

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
      linkElement.onclick = () => navigator.clipboard.writeText(data).then(
        () => {
          appendLog("Successfully copied!");
        },
        () => {
          appendLog("Copy failed, downloading...");
          downloadText(`out_${new Date().getTime()}.txt`, data);
        },
      );

      const textBefore = document.createTextNode("Done. click ");
      const textAfter = document.createTextNode(` to copy objects | num objects: ${numObject}`);

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
    switch (type) {
      case "checkbox": {
        newValue = checked;
        break;
      }

      default: {
        // BaseNote will evalute to number on the submittion
        if (name === "BaseNote") {
          newValue = value;
          break;
        }

        newValue = ["Speed", "Offsets.Pitch", "Offsets.Volume"].indexOf(name) !== -1 ?
          parseFloat(value) :
          parseInt(value, 10);

        break;
      }
    }

    if (typeof newValue === "number" && isNaN(newValue)) {
      newValue = "";
    }

    const keys = name.split('.');

    const [key1, key2]: [keyof TrackConfig, string] = keys;

    const updatedTracks = [...configs];
    if (keys.length === 1) {
      updatedTracks[index] = { ...updatedTracks[index], [name]: newValue };
    } else {
      updatedTracks[index] = {
        ...updatedTracks[index],
        [key1]: {
          ...updatedTracks[index][key1],
          [key2]: newValue,
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
    setConfigsModified(true);
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();

    const submitterKind = ((e.nativeEvent as SubmitEvent).submitter as HTMLInputElement).id;

    switch (submitterKind) {
      case "submitConfig": {
        const file = (document.getElementById("midi-input") as HTMLInputElement).files?.[0];
        if (!file) {
          appendLog("Please input midi file before submit");
          return;
        }

        const result = window.__wasm_iwm_exports.midiToIwm(
          await loadMidiFile(file),
          JSON.stringify(
            // Evalute all BaseNote
            configs.map(c => {
              const newBaseNote = function () {
                try {
                  const evaluted = Number(eval(c.BaseNote));
                  if (isNaN(evaluted)) return 61;
                  return evaluted;
                } catch (e) {
                  return 61;
                }
              }();

              return {
                ...c,
                BaseNote: newBaseNote,
              } satisfies RealTrackConfig;
            })
          )
        );
        if (!Array.isArray(result)) {
          appendLog(`Webassembly error: ${result}`);
          return;
        }

        appendLinkMessage("here", result[0] as string, result[1] as unknown as number);

        break;
      }

      case "submitAboutMore": {
        openModal();
        break;
      }

      default: window.alert("Unknown submittion: " + submitterKind);
    }
  };

  useLayoutEffect(() => {
    appendLog("Webassembly setup");
  }, []);

  // About more help modal

  const [modalIsOpen, setIsOpen] = useState(false);

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

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
              let result = window.__wasm_iwm_exports.getTracks(await loadMidiFile(file));
              if (typeof result !== "string" || !result.startsWith("vas:")) {
                appendLog(`Webassembly error: ${result}`);
                return;
              }
              // Remove "vas:"
              result = result.substring(4);
              appendLog(result);
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
      }}>export</div> with JSON</span>
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
              <h4><i className="fa-brands fa-itunes-note" style={{
                transform: "translate(0px, 1.45px)",
              }}></i> Config {track.id + 1}</h4>
              <div className="row mb-3">
                <div className="col">
                  <div className="d-flex justify-content-between">
                    <label htmlFor={`Track-${track.id}`} className="form-label">Track</label>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip className="custom-tooltip">Track number. You can view track list by log (you need to input midi file)<br />Type: <span style={{ color: "yellow" }}>Integer</span></Tooltip>}
                    >
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transform: "translate(8px, 4px)",
                        }}
                      ><i className="fas fa-info-circle"></i></span>
                    </OverlayTrigger>
                  </div>
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
                  <div className="d-flex justify-content-between">
                    <label htmlFor={`BaseNote-${track.id}`} className="form-label">Base Note</label>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip className="custom-tooltip">Pitch table value. Mainly controls when changing the pitch<br />Type: <span style={{ color: "yellow" }}>Integer</span></Tooltip>}
                    >
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transform: "translate(8px, 4px)",
                        }}
                      ><i className="fas fa-info-circle"></i></span>
                    </OverlayTrigger>
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    id={`BaseNote-${track.id}`}
                    name="BaseNote"
                    value={track.BaseNote}
                    onChange={(e) => handleInputChange(index, e)}
                  />
                </div>
                <div className="col">
                  <div className="d-flex justify-content-between">
                    <label htmlFor={`MaxNote-${track.id}`} className="form-label">Max Note</label>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip className="custom-tooltip">Maximum pitch value.<br />Type: <span style={{ color: "yellow" }}>Integer</span></Tooltip>}
                    >
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transform: "translate(8px, 4px)",
                        }}
                      ><i className="fas fa-info-circle"></i></span>
                    </OverlayTrigger>
                  </div>
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
              <h4><i className="fa-sharp fa-regular fa-volume" style={{
                transform: "translate(0px, 1.45px)",
              }}></i> Offsets</h4>
              <div className="row mb-3">
                <div className="col">
                  <div className="d-flex justify-content-between">
                    <label htmlFor={`Offsets.Volume-${track.id}`} className="form-label">Volume</label>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip className="custom-tooltip">Volume offset added to original volume. If volume constant is on, use this value as a fixed value.<br />Dont forgot that can use <span style={{ color: "cyan" }}>minus</span> value<br />Type: <span style={{ color: "green" }}>Decimal point</span></Tooltip>}
                    >
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transform: "translate(8px, 4px)",
                        }}
                      ><i className="fas fa-info-circle"></i></span>
                    </OverlayTrigger>
                  </div>
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
                  <div className="d-flex justify-content-between">
                    <label htmlFor={`Offsets.Pitch-${track.id}`} className="form-label">Pitch</label>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip className="custom-tooltip">Pitch offset added to original pitch. If pitch constant is on, use this value as a fixed value.<br />Dont forgot that can use <span style={{ color: "cyan" }}>minus</span> value<br />Type: <span style={{ color: "green" }}>Decimal point</span></Tooltip>}
                    >
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transform: "translate(8px, 4px)",
                        }}
                      ><i className="fas fa-info-circle"></i></span>
                    </OverlayTrigger>
                  </div>
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
              <h4><i className="fa-regular fa-arrows-rotate-reverse" style={{
                transform: "translate(0px, 1.45px)",
              }}></i> Loop</h4>
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
                  <div className="d-flex justify-content-between">
                    <label htmlFor={`Loop.LoopOffset-${track.id}`} className="form-label">Loop Offset</label>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip className="custom-tooltip">Offset frames added to the original loop frames.<br />Dont forgot that can use <span style={{ color: "cyan" }}>minus</span> value<br />Type: <span style={{ color: "yellow" }}>Integer</span></Tooltip>}
                    >
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transform: "translate(8px, 4px)",
                        }}
                      ><i className="fas fa-info-circle"></i></span>
                    </OverlayTrigger>
                  </div>
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
                  <div className="d-flex justify-content-between">
                    <label htmlFor={`Speed-${track.id}`} className="form-label">Speed</label>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip className="custom-tooltip">Frames speed<br />Type: <span style={{ color: "green" }}>Decimal point</span></Tooltip>}
                    >
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transform: "translate(8px, 4px)",
                        }}
                      ><i className="fas fa-info-circle"></i></span>
                    </OverlayTrigger>
                  </div>
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

        <div className="d-flex align-items-center justify-content-between">
          <input type="submit" value="Submit config" id="submitConfig" />
          <input type="submit" value="About more" id="submitAboutMore" />
        </div>
      </form>

      <div>
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          closeTimeoutMS={100}
          style={{
            overlay: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#000000',
              width: '900px',
              height: '600px',
              overflow: 'hidden',
            },
          }}
          contentLabel="About More Modal"
        >
          <h5
            style={{
              position: 'absolute',
              top: '15px',
              left: '18px',
            }}
          >
            About more
          </h5>
          <button
            onClick={closeModal}
            style={{
              position: 'absolute',
              right: '15px',
              top: '15px',
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>

          {/* Scrollable div */}
          <div style={{
            marginTop: '30px',
            height: 'calc(100% - 30px)',
            overflowY: 'auto',
          }}>
            <div>
              <h4>Useful Informations</h4>
              <div>
                <i>• This tool is created for game named &quot;I Wanna Maker&quot; on steam. This tool make the midi playable in I Wanna Maker using sound play event.</i>
              </div>
              <div>
                <i>• The site </i>
                <a href="https://signal.vercel.app/edit" target="_blank" style={{ color: "blue" }}>signal.vercel.app</a>
                <i> can easily show & edit midi file.</i><br />
              </div>
              <div>
                <i>• Example video: </i>
                <a href="https://youtu.be/1fFJa8grDLM?si=uBFsZHyR0hyZLGh-" target="_blank" style={{ color: "blue" }}>youtu.be/1fFJa8grDLM</a>
              </div>
            </div>

            <hr style={{
              margin: '20px 0',
              border: 'none',
              borderTop: '2px solid #ffffff'
            }} />

            <h4>Config Informations</h4>

            {/* Track */}
            <div>
              <h5>Track</h5>
              <i>Specifies which MIDI track number to process from the input file.</i><br />
              <i>• The number of the track you want to play, as indicated in the log</i><br />
              <i>• Track numbers start from 0</i><br />
              <i>• Only tracks containing note events are counted</i>
            </div>

            <hr style={{
              margin: '20px 0',
              border: 'none',
              borderTop: '1px solid #ffffff'
            }} />

            {/* Instrumental */}
            <div>
              <h5>Instrumental</h5>
              <i>Defines the sound ID to be used when playing notes from this track.</i><br />
            </div>

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ffffff' }} />

            {/* Base Note */}
            <div>
              <h5>Base Note</h5>
              <i>Base Note represents the reference MIDI note number used to calculate pitch frequencies.</i><br />
              <i>The frequency for any MIDI note number is calculated as:</i>
              <TeX math="f = f_0 \cdot 2^{\frac{n-69}{12}}" block />
              <i>where:</i><br />
              <i>• f is the frequency of the desired note</i><br />
              <i>• f₀ is the reference frequency (A4 = 440 Hz)</i><br />
              <i>• n is the MIDI note number</i><br />
              <i>In the implementation, relative pitch ratios are calculated using:</i>
              <TeX math="ratio_{j} = 2^{\frac{n-baseNote_{i}}{12}}" block />
              <i>where baseNote serves as the reference point (ratio = 1.0)</i><br />
              <i style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}>
                This value is evaluted as string on submittion. You can type value like this: &quot;61-10&quot;.
              </i>
            </div>

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ffffff' }} />

            {/* Max Note */}
            <div>
              <h5>Max Note</h5>
              <i>Max Note is a value used to calculate the amount by which to decrease the index keys of the pitch table.</i><br />
              <i>The decreasing value is calculated as follows:</i>
              <TeX math="pitchAdjustment_{i} = 7 \cdot \left\lceil\frac{Note_{i_{max}} - maxNote_{i}}{7}\right\rceil" block />
              <i>where <TeX math="Note_{i_{max}}" /> is the maximum of all pitches in <TeX math="Note_{i}" /></i>
            </div>

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ffffff' }} />

            {/* Volume Offset */}
            <div>
              <h5>Volume Offset</h5>
              <i>Adjusts the volume of notes in the track by adding an offset to the normalized velocity.</i><br />
              <i>The final volume is calculated as:</i>
              <TeX math="volume_{j} = normalize(velocity_{j}) + offset_{i}" block />
              <i>• Final volume is clamped between 0.05 and 1.0</i><br />
              <i>When Volume Constant is true:</i><br />
              <i>• The offset value is used directly as the volume</i>
            </div>

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ffffff' }} />

            {/* Pitch Offset */}
            <div>
              <h5>Pitch Offset</h5>
              <i>Adjusts the pitch of notes in the track by adding an offset to the calculated pitch ratio.</i><br />
              <i>The final pitch is calculated as:</i>
              <TeX math="pitch_{j} = pitchRatio_{j} + offset_{i}" block />
              <i>• Final pitch is clamped between 0.05 and 3.0</i><br />
              <i>When Pitch Constant is true:</i><br />
              <i>• The offset value is used directly as the pitch</i>
            </div>

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ffffff' }} />

            {/* Loop */}
            <div>
              <h5>Loop Configuration</h5>
              <i>Controls the looping behavior of the track:</i><br />
              <i>• Enable: Toggles looping on/off</i><br />
              <i>• Loop Offset: Adjusts the loop end point by adding frames to the calculated loop length</i><br />
              <i>The final loop length is calculated as:</i>
              <TeX math="loopFrames_{j} = maxOffset + loopOffset_{i}" block />
              <i>where maxOffset is the highest frame offset in the all of tracks</i>
            </div>

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ffffff' }} />

            {/* Speed */}
            <div>
              <h5>Speed</h5>
              <i>Adjusts the playback speed of the track.</i><br />
              <i>The frame offset for each note is calculated as:</i>
              <TeX math="offset_{j} = ticks_{j} \cdot tickLength \cdot 50 \cdot (2-speed_{i})" block />
              <i>where tickLength is the μs tempo of <TeX math="Note_{i}" /></i><br />
              <i>• speed &gt; 1: Notes play faster than original</i><br />
              <i>• speed &lt; 1: Notes play slower than original</i><br />
              <i>• speed = 1: Notes play at original tempo</i>
            </div>

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ffffff' }} />

            {/* Strip Before/After */}
            <div>
              <h5>Strip Before/After</h5>
              <i>Filters out notes based on their frame offsets:</i><br />
              <i>• Strip Before: Removes notes before the specified frame number</i><br />
              <i>• Strip After: Removes notes after the specified frame number</i><br />
              <i>When either value is 0, no stripping is performed for that boundary</i>
            </div>

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ffffff' }} />

            {/* Start At */}
            <div>
              <h5>Start At</h5>
              <i>Adds an offset to all note frame positions in the track.</i><br />
              <i>The final frame offset for each note becomes:</i>
              <TeX math="finalOffset_{j} = offset_{j} + startAt_{i} + 1" block />
              <i>• Positive values delay the track start</i><br />
              <i>• Negative values advance the track start</i>
            </div>
          </div>
        </Modal>
      </div>

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
