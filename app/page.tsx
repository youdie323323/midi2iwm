"use client";

import "./globals.css";
import { type SyntheticEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { Tooltip, OverlayTrigger } from "react-bootstrap";
import Modal from "react-modal";
import "katex/dist/katex.min.css";
import TeX from "@matejmazur/react-katex";

const TRACKS_NORMAL_PREFIX = "NOT_AN_ERROR:" as const;

declare global {
    interface Window {
        goIwm: { // Define methods between wasm
            tracks(encodedMidi: string): `${typeof TRACKS_NORMAL_PREFIX}${string}` | string;
            midiToEventObjects(encodedMidi: string, encodedTrackConfigs: string): string;
        },
    }
}

const cyrb53 = (str: string, seed = 0): string => {
    let h1 = 0xdeadbeef ^ seed,
        h2 = 0x41c6ce57 ^ seed;

    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);

        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }

    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);

    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
};

const downloadJson = (fileName: string, data: string) => {
    const tempElement = document.createElement("a");
    const file = new Blob([data], { type: "application/json" });

    tempElement.href = URL.createObjectURL(file);
    tempElement.download = fileName;

    document.body.appendChild(tempElement);

    tempElement.click();

    document.body.removeChild(tempElement);
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

const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            if (e.target?.result)
                resolve(toBase64(e.target.result as ArrayBuffer));
        };

        reader.readAsArrayBuffer(file);
    });
};

function hasAllKeys<T>(obj: any, keys: Array<keyof T>): obj is T {
    return keys.every(key => key in obj);
}

/**
 * TypeScript implementation for go iwm TrackConfig.
 * Fields are must be same with original struct expect BaseNote, since parsing with JSON.
 */
interface TrackConfig {
    id: any;
    Track: number;
    Instrumental: number;
    /**
     * @remarks
     * This value is string since evaluted on submittion.
     * TODO: this is unsafe.
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

/**
 * Unevalutable version of TrackConfig (which means completely same as original struct).
 */
type RealTrackConfig = Omit<TrackConfig, "BaseNote"> & { BaseNote: number };

const TRACK_CONFIG_KEYS: Array<keyof TrackConfig> =
    ["id", "Track", "Instrumental", "BaseNote", "MaxNote", "Offsets", "Loop", "Speed", "StripAfter", "StripBefore", "StartAt"] as const;

const INSTRUMENTALS: Array<string> = [
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
    "Robot",
    "Damage",
];

type DotNestedKeys<T> = {
    [K in keyof T]: T[K] extends object
    ? K extends string | number
    ? `${K}` | `${K}.${DotNestedKeys<T[K]>}`
    : never
    : K extends string | number
    ? `${K}`
    : never;
}[keyof T];

type DotNestedTrackConfigKeys = DotNestedKeys<TrackConfig>;

const INTERNAL_CONFIG_FLOAT_KEYS: Array<DotNestedTrackConfigKeys> =
    ["Speed", "Offsets.Pitch", "Offsets.Volume"] as const;

const defaultTrackConfig = (id: number): TrackConfig => ({
    id: id,
    Track: 0,
    Instrumental: INSTRUMENTALS.indexOf("Piano"),  // Default is piano
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
    Speed: 1,
    StripAfter: 3000,
    StripBefore: 0,
    StartAt: 0,
});

const DEFAULT_TRACK_CONFIGS: Array<TrackConfig> = [defaultTrackConfig(0)];

const STORAGE_TRACK_CONFIG_KEY_PREFIX = "trackConfig_" as const;

const prefixTrackConfigName = (configName: string) => STORAGE_TRACK_CONFIG_KEY_PREFIX + configName;

const TRACK_CONFIG_SELECTION_DEFAULT_NAME = "VIEW_PLACEHOLDER_OFFSET" as const;

Modal.setAppElement("body");

export default function App() {
    const [trackConfigs, setTrackConfigs] = useState(DEFAULT_TRACK_CONFIGS);
    const [selectedTrackConfig, setSelectedTrackConfig] = useState(trackConfigs[0]);
    const [trackConfigNames, setTrackConfigNames] = useState<Array<string>>([]);
    const [trackConfigsModified, setTrackConfigsModified] = useState<boolean>(false);

    const trackConfigTabRef = useRef(null);
    const trackConfigImportInputRef = useRef<HTMLInputElement | null>(null);

    const [modalIsOpen, setIsOpen] = useState(false);

    function openModal() {
        setIsOpen(true);
    }

    function closeModal() {
        setIsOpen(false);
    }

    const openTrackConfigImportInput = () => {
        if (trackConfigImportInputRef.current)
            trackConfigImportInputRef.current.click();
    };

    const handleTrackConfigImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();

            reader.onload = () => {
                const fileContent = reader.result;
                if (typeof fileContent !== "string") {
                    log("Configuration is not valid type");

                    return;
                }

                const parsed = JSON.parse(fileContent);
                if (
                    !(
                        Array.isArray(parsed) &&
                        parsed.some(v => hasAllKeys(v, TRACK_CONFIG_KEYS))
                    )
                ) {
                    log("Configuration is not valid");

                    return;
                }

                setTrackConfigs(parsed as Array<TrackConfig>);
            };

            reader.readAsText(file);
        }

        event.target.value = "";
    };

    const refreshTrackConfigNames = () => {
        const names =
            Object.keys(localStorage)
                .filter(key => key.startsWith(STORAGE_TRACK_CONFIG_KEY_PREFIX))
                .map(key => key.replace(STORAGE_TRACK_CONFIG_KEY_PREFIX, ""));

        setTrackConfigNames(names);
    };

    useEffect(() => {
        if (typeof window !== "undefined")
            refreshTrackConfigNames();
    }, []);

    useLayoutEffect(() => {
        log("Webassembly setup");
    }, []);

    const saveTrackConfig = (name: string) => {
        const prefixedName = prefixTrackConfigName(name)

        if (localStorage.getItem(prefixedName)) {
            log(`Configuration "${name}" already exists`);

            return;
        }

        { // Set then refresh
            localStorage.setItem(prefixedName, JSON.stringify(trackConfigs));

            refreshTrackConfigNames();
        }

        localStorage.setItem(prefixedName, JSON.stringify(trackConfigs));

        log(`Configuration "${name}" has been saved to storage`);
    };

    const deleteTrackConfig = (name: string) => {
        const prefixedName = prefixTrackConfigName(name)

        if (!localStorage.getItem(prefixedName)) {
            log(`Configuration "${name}" not exists`);

            return;
        }

        { // Remove then refresh
            localStorage.removeItem(prefixedName);

            refreshTrackConfigNames();
        }

        log(`Configuration "${name}" deleted from storage`);
    };

    const loadTrackConfig = (name: string) => {
        if (name === TRACK_CONFIG_SELECTION_DEFAULT_NAME) {
            log("Invalid configuration selected");

            return;
        }

        if (trackConfigsModified) {
            const confirmed = window.confirm("Unsave change exists. Do you want to load the new configuration and discard current changes?");
            if (!confirmed) {
                log("Load canceled by user");

                return;
            }
        }

        const prefixedName = prefixTrackConfigName(name)

        const config = localStorage.getItem(prefixedName);
        if (config) {
            const parsedConfig = JSON.parse(config);

            if (parsedConfig.length > 0) {
                setTrackConfigs(parsedConfig);
                setSelectedTrackConfig(parsedConfig[0]);

                setTrackConfigsModified(false);

                log(`Configuration "${name}" loaded from storage`);
            }
        } else {
            log(`Configuration "${name}" not found in storage`);
        }
    };

    const log = (message: string) => {
        const logConsole = document.getElementById("log-console");
        if (logConsole) {
            const timestamp = new Date().toLocaleTimeString();

            const timestampSpan = `<span class="log-time text-nowrap">[${timestamp}]</span>`;

            const logLine = document.createElement("div");

            logLine.innerHTML =
                message.split("\n")
                    .filter(line => line.length !== 0)
                    .map(line => timestampSpan + line)
                    .join("\n");

            logConsole.appendChild(logLine);
            logConsole.scrollTop = logConsole.scrollHeight;
        }
    };

    const logGenerationDoneMessage = (objectsXml: string, numObjects: number) => {
        const logConsole = document.getElementById("log-console");
        if (logConsole) {
            const timestamp = new Date().toLocaleTimeString();

            const timestampSpan = document.createElement("span");

            timestampSpan.className = "log-time";
            timestampSpan.textContent = `[${timestamp}]`;

            const logLine = document.createElement("div");

            const linkElement = document.createElement("div");

            linkElement.className = "log-link";
            linkElement.innerHTML = "here";
            linkElement.onclick = () => navigator.clipboard.writeText(objectsXml).then(
                () => {
                    log("Successfully copied!");
                },
                () => {
                    log("Copy failed, downloading...");

                    downloadJson(`out_${new Date().getTime()}.txt`, objectsXml);
                },
            );

            const textBefore = document.createTextNode("Done. click ");
            const textAfter = document.createTextNode(` to copy objects | num objects: ${numObjects}`);

            logLine.appendChild(timestampSpan);
            logLine.appendChild(textBefore);
            logLine.appendChild(linkElement);
            logLine.appendChild(textAfter);

            logConsole.appendChild(logLine);

            logConsole.scrollTop = logConsole.scrollHeight;
        }
    };

    type HandleableEvents = React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>;

    type DetailedElement<T> = Omit<T, "name"> & { name: DotNestedTrackConfigKeys };

    type DetailedHandleableEventTarget =
        (EventTarget & DetailedElement<HTMLInputElement>) | (EventTarget & DetailedElement<HTMLSelectElement>);

    const handleInputChange = (event: HandleableEvents, index: number) => {
        const typedTarget =
            event.target as DetailedHandleableEventTarget;

        const { name, value, type } = typedTarget;

        let newValue: string | boolean | number;

        switch (type) {
            case "checkbox": {
                const { checked } = typedTarget;

                newValue = checked;

                break;
            }

            default: {
                if (name === "BaseNote") { // BaseNote will be evaluted
                    newValue = value;

                    break;
                }

                newValue =
                    INTERNAL_CONFIG_FLOAT_KEYS.indexOf(name) !== -1 ?
                        parseFloat(value) :
                        parseInt(value, 10);

                if (isNaN(newValue))
                    newValue = "";

                break;
            }
        }

        const keys = name.split(".");

        const updatedTracks = [...trackConfigs];

        if (keys.length > 1) {
            const [key1, key2] = keys as [keyof TrackConfig, string];

            updatedTracks[index] = {
                ...updatedTracks[index],

                [key1]: {
                    ...updatedTracks[index][key1],

                    [key2]: newValue,
                },
            };
        } else {
            updatedTracks[index] = { ...updatedTracks[index], [name]: newValue };
        }

        setTrackConfigs(updatedTracks);
        setTrackConfigsModified(true);
    };

    const addTabTrackConfig = () => {
        const newId =
            trackConfigs.length > 0
                ? Math.max(...trackConfigs.map(t => t.id)) + 1
                : 0;

        const config = defaultTrackConfig(newId);

        setTrackConfigs([...trackConfigs, config]);
        setSelectedTrackConfig(config);

        setTrackConfigsModified(true);
    };

    const removeTabTrackConfig = (current: TrackConfig) => {
        const removedTracks =
            trackConfigs.filter((track) => track.id !== current.id);

        setTrackConfigs(removedTracks);

        if (selectedTrackConfig?.id === current?.id) {
            const autoActivatedConfig =
                removedTracks[trackConfigs.indexOf(current)] || removedTracks[removedTracks.length - 1];

            if (autoActivatedConfig)
                setSelectedTrackConfig(autoActivatedConfig);
        }

        setTrackConfigsModified(true);
    };

    const handleSubmit = async (event: SyntheticEvent) => {
        event.preventDefault();

        const submitterId = ((event.nativeEvent as SubmitEvent).submitter as HTMLInputElement).id;

        switch (submitterId) {
            case "submitConfig": {
                const file = (document.getElementById("midi-input") as HTMLInputElement).files?.[0];
                if (!file) {
                    log("Please input midi file before submit");

                    return;
                }

                const result = window.goIwm.midiToEventObjects(
                    await readFileAsBase64(file),
                    JSON.stringify(
                        // Evalute all BaseNote
                        trackConfigs.map(c => {
                            let evalutedBaseNote: number;

                            try {
                                evalutedBaseNote = Number(eval(c.BaseNote));

                                // Fallback to catch behavior
                                if (isNaN(evalutedBaseNote)) throw "";
                            } catch (e) {
                                evalutedBaseNote = 61;
                            }

                            return {
                                ...c,

                                BaseNote: evalutedBaseNote,
                            } satisfies RealTrackConfig;
                        })
                    )
                );

                if (!Array.isArray(result)) {
                    log(`Webassembly error: ${result}`);

                    return;
                }

                const [objectsXml, numObjects] = result as unknown as [string, number];

                logGenerationDoneMessage(objectsXml, numObjects);

                break;
            }

            case "submitAboutMore": {
                openModal();

                break;
            }

            default:
                window.alert("Unknown submittion: " + submitterId);
        }
    };

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
                            let result = window.goIwm.tracks(await readFileAsBase64(file));
                            if (typeof result !== "string" || !result.startsWith(TRACKS_NORMAL_PREFIX)) {
                                log(`Webassembly error: ${result}`);

                                return;
                            }

                            // Remove TRACKS_NORMAL_PREFIX
                            result = result.substring(TRACKS_NORMAL_PREFIX.length);

                            log(result);
                        }
                    } as React.ChangeEventHandler<HTMLInputElement>}
                    type="file"
                />
            </div>

            <br />

            <h5>Log</h5><div aria-label="System Information" id="log-console"></div>

            <br />

            <div className="d-flex justify-content-end">
                <button className="btn btn-primary me-2" style={{ width: 75, height: 33, padding: "1px 0rem 0px 0px" }} onClick={() => {
                    const name = prompt("Input configuration name to delete");
                    if (!name) {
                        log(`Configuration ${name} is not valid`);

                        return;
                    }

                    saveTrackConfig(name);
                }}>
                    Save
                </button>

                <button className="btn btn-danger me-2" style={{ width: 82, height: 33, padding: "1px 0rem 0px 0px" }} onClick={() => {
                    const name = prompt("Input configuration name to delete");
                    if (!name) {
                        log(`Configuration ${name} is not valid`);

                        return;
                    }

                    deleteTrackConfig(name);
                }}>
                    Delete
                </button>

                <select
                    className="form-select me-2"
                    onChange={(e) => loadTrackConfig(e.target.value)}
                >
                    <option value={TRACK_CONFIG_SELECTION_DEFAULT_NAME}>Select Config to Load</option>

                    {trackConfigNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>
            </div>

            <span>...or <div className="log-link" onClick={openTrackConfigImportInput}>import</div>/<div className="log-link" onClick={
                () => {
                    const jsonTrackConfigs = JSON.stringify(trackConfigs);

                    downloadJson(`export_${cyrb53(jsonTrackConfigs)}.json`, jsonTrackConfigs);
                }
            }>export</div> with JSON</span>

            <br />

            <h5>Configuration editor</h5>
            <ul className="nav nav-tabs mb-3" ref={trackConfigTabRef}>
                <TransitionGroup component={null}>
                    {trackConfigs.map((track) => (
                        <CSSTransition
                            key={track.id}
                            nodeRef={trackConfigTabRef} in timeout={150}
                            classNames="fade"
                        >
                            <li className="nav-item" key={track.id}>
                                <div
                                    className={`nav-link ${selectedTrackConfig.id === track.id ? "active" : ""}`}
                                    onClick={() => setSelectedTrackConfig(track)}
                                >
                                    Config {track.id + 1}

                                    <button
                                        type="button"
                                        className="btn btn-close btn-close-white ms-1"
                                        onClick={(e) => {
                                            e.stopPropagation();

                                            removeTabTrackConfig(track);
                                        }}
                                        aria-label={`Close Configuration ${track.id + 1}`}
                                    />
                                </div>
                            </li>
                        </CSSTransition>
                    ))}
                </TransitionGroup>

                <li className="nav-item">
                    <button className="nav-link" onClick={addTabTrackConfig}>
                        + Add Config
                    </button>
                </li>
            </ul>

            <form onSubmit={handleSubmit}>
                {trackConfigs.map((track, index) => (
                    selectedTrackConfig.id === track.id && (
                        <div key={track.id} className="track-config mb-4">
                            <h4>
                                <i className="fa-brands fa-itunes-note" style={{ marginRight: "16px" }} />

                                Config {track.id + 1}
                            </h4>

                            <div className="row mb-3">
                                <div className="col">
                                    <div className="d-flex justify-content-between">
                                        <label htmlFor={`Track-${track.id}`} className="form-label">Track</label>

                                        <OverlayTrigger
                                            placement="top"
                                            overlay={
                                                <Tooltip className="custom-tooltip">
                                                    Track. You can view track list by log (you need to input midi file).
                                                    <br />
                                                    Type: <span style={{ color: "yellow" }}>Integer</span>.
                                                </Tooltip>
                                            }
                                        >
                                            <span
                                                style={{
                                                    width: "24px",
                                                    height: "24px",
                                                    fontSize: "14px",
                                                    cursor: "pointer",
                                                    transform: "translate(8px, 4px)",
                                                }}
                                            >
                                                <i className="fas fa-info-circle" />
                                            </span>
                                        </OverlayTrigger>
                                    </div>

                                    <input
                                        type="number"
                                        className="form-control"
                                        id={`Track-${track.id}`}
                                        name={"Track" satisfies DotNestedTrackConfigKeys}
                                        value={track.Track}
                                        onChange={(event) => handleInputChange(event, index)}
                                    />
                                </div>

                                <div className="col">
                                    <label htmlFor={`Instrumental-${track.id}`} className="form-label">Instrumental</label>

                                    <select
                                        className="form-select"
                                        aria-label="instrumental"
                                        id={`Instrumental-${track.id}`}
                                        name={"Instrumental" satisfies DotNestedTrackConfigKeys}
                                        value={track.Instrumental}
                                        onChange={(event) => handleInputChange(event, index)}
                                    >
                                        <option value=""> -- inst -- </option>

                                        {INSTRUMENTALS.map((track, index) => (
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
                                            overlay={
                                                <Tooltip className="custom-tooltip">
                                                    Pitch table value. Mainly controls when changing the pitch.
                                                    <br />
                                                    Type: <span style={{ color: "yellow" }}>Integer</span>.
                                                </Tooltip>
                                            }
                                        >
                                            <span
                                                style={{
                                                    width: "24px",
                                                    height: "24px",
                                                    fontSize: "14px",
                                                    cursor: "pointer",
                                                    transform: "translate(8px, 4px)",
                                                }}
                                            >
                                                <i className="fas fa-info-circle" />
                                            </span>
                                        </OverlayTrigger>
                                    </div>

                                    <input
                                        type="text"
                                        className="form-control"
                                        id={`BaseNote-${track.id}`}
                                        name={"BaseNote" satisfies DotNestedTrackConfigKeys}
                                        value={track.BaseNote}
                                        onChange={(event) => handleInputChange(event, index)}
                                    />
                                </div>

                                <div className="col">
                                    <div className="d-flex justify-content-between">
                                        <label htmlFor={`MaxNote-${track.id}`} className="form-label">Max Note</label>

                                        <OverlayTrigger
                                            placement="top"
                                            overlay={
                                                <Tooltip className="custom-tooltip">
                                                    Maximum pitch value.
                                                    <br />
                                                    Type: <span style={{ color: "yellow" }}>Integer</span>.
                                                </Tooltip>
                                            }
                                        >
                                            <span
                                                style={{
                                                    width: "24px",
                                                    height: "24px",
                                                    fontSize: "14px",
                                                    cursor: "pointer",
                                                    transform: "translate(8px, 4px)",
                                                }}
                                            >
                                                <i className="fas fa-info-circle" />
                                            </span>
                                        </OverlayTrigger>
                                    </div>

                                    <input
                                        type="number"
                                        className="form-control"
                                        id={`MaxNote-${track.id}`}
                                        name={"MaxNote" satisfies DotNestedTrackConfigKeys}
                                        value={track.MaxNote}
                                        onChange={(event) => handleInputChange(event, index)}
                                    />
                                </div>
                            </div>

                            {/* Offsets */}
                            <h4>
                                <i className="fa-sharp fa-regular fa-volume" style={{ marginRight: "10px" }} />

                                Offsets
                            </h4>
                            <div className="row mb-3">
                                <div className="col">
                                    <div className="d-flex justify-content-between">
                                        <label htmlFor={`Offsets.Volume-${track.id}`} className="form-label">Volume</label>

                                        <OverlayTrigger
                                            placement="top"
                                            overlay={
                                                <Tooltip className="custom-tooltip">
                                                    Volume offset added to original volume. If volume constant is on, will use this value as a fixed value.
                                                    <br />
                                                    Dont forgot that can use <span style={{ color: "cyan" }}>minus</span> value.
                                                    <br />
                                                    Type: <span style={{ color: "green" }}>Float</span>.
                                                </Tooltip>
                                            }
                                        >
                                            <span
                                                style={{
                                                    width: "24px",
                                                    height: "24px",
                                                    fontSize: "14px",
                                                    cursor: "pointer",
                                                    transform: "translate(8px, 4px)",
                                                }}
                                            >
                                                <i className="fas fa-info-circle" />
                                            </span>
                                        </OverlayTrigger>
                                    </div>

                                    <input
                                        type="number"
                                        className="form-control"
                                        id={`Offsets.Volume-${track.id}`}
                                        name={"Offsets.Volume" satisfies DotNestedTrackConfigKeys}
                                        value={track.Offsets.Volume}
                                        onChange={(event) => handleInputChange(event, index)}
                                    />
                                </div>
                                <div className="col">
                                    <label className="form-check-label" htmlFor={`Offsets.VolumeConstant-${track.id}`}>Volume Constant</label>

                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id={`Offsets.VolumeConstant-${track.id}`}
                                        name={"Offsets.VolumeConstant" satisfies DotNestedTrackConfigKeys}
                                        checked={track.Offsets.VolumeConstant}
                                        onChange={(event) => handleInputChange(event, index)}
                                    />
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col">
                                    <div className="d-flex justify-content-between">
                                        <label htmlFor={`Offsets.Pitch-${track.id}`} className="form-label">Pitch</label>

                                        <OverlayTrigger
                                            placement="top"
                                            overlay={
                                                <Tooltip className="custom-tooltip">
                                                    Pitch offset added to original pitch. If pitch constant is on, use this value as a fixed value.
                                                    <br />
                                                    Dont forgot that can use <span style={{ color: "cyan" }}>minus</span> value.
                                                    <br />
                                                    Type: <span style={{ color: "green" }}>Float</span>.
                                                </Tooltip>
                                            }
                                        >
                                            <span
                                                style={{
                                                    width: "24px",
                                                    height: "24px",
                                                    fontSize: "14px",
                                                    cursor: "pointer",
                                                    transform: "translate(8px, 4px)",
                                                }}
                                            >
                                                <i className="fas fa-info-circle" />
                                            </span>
                                        </OverlayTrigger>
                                    </div>

                                    <input
                                        type="number"
                                        className="form-control"
                                        id={`Offsets.Pitch-${track.id}`}
                                        name={"Offsets.Pitch" satisfies DotNestedTrackConfigKeys}
                                        value={track.Offsets.Pitch}
                                        onChange={(event) => handleInputChange(event, index)}
                                    />
                                </div>

                                <div className="col">
                                    <label className="form-check-label" htmlFor={`Offsets.PitchConstant-${track.id}`}>Pitch Constant</label>
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id={`Offsets.PitchConstant-${track.id}`}
                                        name={"Offsets.PitchConstant" satisfies DotNestedTrackConfigKeys}
                                        checked={track.Offsets.PitchConstant}
                                        onChange={(event) => handleInputChange(event, index)}
                                    />
                                </div>
                            </div>

                            {/* Loop Configuration */}
                            <h4>
                                <i className="fa-regular fa-arrows-rotate-reverse" style={{ marginRight: "10px" }} />

                                Loop
                            </h4>
                            <div className="row mb-3">
                                <div className="col">
                                    <label className="form-check-label" htmlFor={`Loop.Enable-${track.id}`}>Enable Loop</label>

                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id={`Loop.Enable-${track.id}`}
                                        name={"Loop.Enable" satisfies DotNestedTrackConfigKeys}
                                        checked={track.Loop.Enable}
                                        onChange={(event) => handleInputChange(event, index)}
                                    />
                                </div>

                                <div className="col">
                                    <div className="d-flex justify-content-between">
                                        <label htmlFor={`Loop.LoopOffset-${track.id}`} className="form-label">Loop Offset</label>

                                        <OverlayTrigger
                                            placement="top"
                                            overlay={
                                                <Tooltip className="custom-tooltip">
                                                    Offset frames added to the original loop frames.
                                                    <br />
                                                    Dont forgot that can use <span style={{ color: "cyan" }}>minus</span> value.
                                                    <br />
                                                    Type: <span style={{ color: "yellow" }}>Integer</span>.
                                                </Tooltip>
                                            }
                                        >
                                            <span
                                                style={{
                                                    width: "24px",
                                                    height: "24px",
                                                    fontSize: "14px",
                                                    cursor: "pointer",
                                                    transform: "translate(8px, 4px)",
                                                }}
                                            >
                                                <i className="fas fa-info-circle" />
                                            </span>
                                        </OverlayTrigger>
                                    </div>

                                    <input
                                        type="number"
                                        className="form-control"
                                        id={`Loop.LoopOffset-${track.id}`}
                                        name={"Loop.LoopOffset" satisfies DotNestedTrackConfigKeys}
                                        value={track.Loop.LoopOffset}
                                        onChange={(event) => handleInputChange(event, index)}
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
                                            overlay={
                                                <Tooltip className="custom-tooltip">
                                                    Frames speed.
                                                    <br />
                                                    Type: <span style={{ color: "green" }}>Float</span>.
                                                </Tooltip>
                                            }
                                        >
                                            <span
                                                style={{
                                                    width: "24px",
                                                    height: "24px",
                                                    fontSize: "14px",
                                                    cursor: "pointer",
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
                                        name={"Speed" satisfies DotNestedTrackConfigKeys}
                                        value={track.Speed}
                                        onChange={(event) => handleInputChange(event, index)}
                                    />
                                </div>

                                <div className="col">
                                    <label htmlFor={`StartAt-${track.id}`} className="form-label">Start At</label>

                                    <input
                                        type="number"
                                        className="form-control"
                                        id={`StartAt-${track.id}`}
                                        name={"StartAt" satisfies DotNestedTrackConfigKeys}
                                        value={track.StartAt}
                                        onChange={(event) => handleInputChange(event, index)}
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
                                        name={"StripBefore" satisfies DotNestedTrackConfigKeys}
                                        value={track.StripBefore}
                                        onChange={(event) => handleInputChange(event, index)}
                                    />
                                </div>

                                <div className="col">
                                    <label htmlFor={`StripAfter-${track.id}`} className="form-label">Strip After</label>

                                    <input
                                        type="number"
                                        className="form-control"
                                        id={`StripAfter-${track.id}`}
                                        name={"StripAfter" satisfies DotNestedTrackConfigKeys}
                                        value={track.StripAfter}
                                        onChange={(event) => handleInputChange(event, index)}
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
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                        },
                        content: {
                            top: "50%",
                            left: "50%",
                            right: "auto",
                            bottom: "auto",
                            marginRight: "-50%",
                            transform: "translate(-50%, -50%)",
                            backgroundColor: "#000000",
                            width: "900px",
                            height: "600px",
                            overflow: "hidden",
                        },
                    }}
                    contentLabel="About More Modal"
                >
                    <h5
                        style={{
                            position: "absolute",
                            top: "15px",
                            left: "18px",
                        }}
                    >
                        About more
                    </h5>

                    <button
                        onClick={closeModal}
                        style={{
                            position: "absolute",
                            right: "15px",
                            top: "15px",
                        }}
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>

                    {/* Scrollable div */}
                    <div style={{
                        marginTop: "30px",
                        height: "calc(100% - 30px)",
                        overflowY: "auto",
                    }}>
                        <div>
                            <h4>Useful Informations</h4>

                            <div>
                                <i>• This tool is created for game named &quot;I Wanna Maker&quot; on steam. This tool makes the midi playable in I Wanna Maker using sound play events.</i>
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
                            margin: "20px 0",
                            border: "none",
                            borderTop: "2px solid #ffffff"
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
                            margin: "20px 0",
                            border: "none",
                            borderTop: "1px solid #ffffff"
                        }} />

                        {/* Instrumental */}
                        <div>
                            <h5>Instrumental</h5>
                            <i>Defines the sound ID to be used when playing notes from this track.</i><br />
                        </div>

                        <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid #ffffff" }} />

                        {/* Base Note */}
                        <div>
                            <h5>Base Note</h5>
                            <i>Base Note represents the reference MIDI note number used to calculate pitch frequencies.</i><br />
                            <i>The frequency for any MIDI note number is calculated as:</i>
                            <TeX math="f_{n} = f_{0} \cdot 2^{\frac{n-69}{12}}," block />
                            <i>where:</i>
                            <br />
                            <i>• <TeX math="f_{n}" /> is the frequency of the note</i><br />
                            <i>• <TeX math="f_{0}" /> is the reference frequency (A4 = 440 Hz)</i><br />
                            <br />
                            <i>In the implementation, relative pitch ratios are calculated using:</i>
                            <TeX math="\text{PitchRatio}_{t,n} = 2^{\frac{n-\text{BaseNote}_{t}}{12}}." block />
                            <i>where:</i>
                            <br />
                            <i>• <TeX math="t" /> for representing <TeX math="t^{th}" /> config</i><br />
                            <i>• <TeX math="n" /> for representing <TeX math="n^{th}" /> note in <TeX math="t^{th}" /> config</i><br />
                            <i>• <TeX math="\text{BaseNote}_{t}" /> serves as the reference point (ratio = 1.0)</i><br />
                            <br />
                            <i style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}>
                                This value is evaluted as string on submittion. You can type value like this: &quot;61-10&quot;.
                            </i>
                        </div>

                        <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid #ffffff" }} />

                        {/* Max Note */}
                        <div>
                            <h5>Max Note</h5>
                            <i>Max Note is a value used to calculate the amount by which to decrease the index keys of the pitch table.</i><br />
                            <i>The decreasing value is calculated as follows:</i>
                            <TeX math="\text{PitchAdjustment}_{t} = 7 \left\lceil\frac{\text{Note}_{t_{max}} - \text{MaxNote}_{t}}{7}\right\rceil." block />
                            <i>where:</i>
                            <br />
                            <i>• <TeX math="t" /> for representing <TeX math="t^{th}" /> config</i><br />
                            <i>• <TeX math="\text{Note}_{t_{max}}" /> is the maximum of all pitches in <TeX math="\text{Note}_{t}" /></i>
                        </div>

                        <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid #ffffff" }} />

                        {/* Volume Offset */}
                        <div>
                            <h5>Volume Offset</h5>
                            <i>Adjusts the volume of notes in the track by adding an offset to the normalized velocity.</i><br />
                            <i>The final volume is calculated as:</i>
                            <TeX math="
\begin{aligned}
    v_{t,n} &= \operatorname{clamp} \left( V_{n_{\text{norm}}} + \text{VelocityOffset}_{t}, v_{\min}, v_{\max} \right), \\[0.5em]
    \text{where} \quad 
    v_{\min} &= \frac{1}{20}, \quad v_{\max} = 1, \\[1em]
    V_{n}&\colon \mathbb{N} \ni \mathcal{J} \longrightarrow \mathcal{V} \in \{x \in \mathbb{N} \mid 0 \leq x \leq 127\}, \\
    V_{n_{\text{norm}}} &= v_{\min} + \left( \left( \frac{V_{n}}{127} \right)^2 (v_{\max} - v_{\min}) \right).
\end{aligned}
" block />
                            <i>where:</i>
                            <br />
                            <i>• <TeX math="t" /> for representing <TeX math="t^{th}" /> config</i><br />
                            <i>• <TeX math="n" /> for representing <TeX math="n^{th}" /> note in <TeX math="t^{th}" /> config</i><br />
                            <i>• <TeX math="\text{VelocityOffset}_{t}" /> is a velocity offset</i>
                            <br /><br />
                            <i>When Volume Constant is true:</i><br />
                            <i>• The offset value is used directly as the volume</i>
                        </div>

                        <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid #ffffff" }} />

                        {/* Pitch Offset */}
                        <div>
                            <h5>Pitch Offset</h5>
                            <i>Adjusts the pitch of notes in the track by adding an offset to the calculated pitch ratio.</i><br />
                            <i>The final pitch is calculated as:</i>
                            <TeX math="\text{Pitch}_{t,n} = \operatorname{clamp} \left( \text{PitchRatio}_{t,n} + \text{PitchOffset}_{t}, \text{Pitch}_{\min}, \text{Pitch}_{\max} \right)" block />
                            <i>where:</i>
                            <br />
                            <i>• <TeX math="t" /> for representing <TeX math="t^{th}" /> config</i><br />
                            <i>• <TeX math="n" /> for representing <TeX math="n^{th}" /> note in <TeX math="t^{th}" /> config</i><br />
                            <i>• <TeX math="\text{PitchOffset}_{t}" /> is a pitch offset</i>
                            <br /><br />
                            <i>When Pitch Constant is true:</i><br />
                            <i>• The offset value is used directly as the pitch</i>
                        </div>

                        <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid #ffffff" }} />

                        {/* Loop */}
                        <div>
                            <h5>Loop Configuration</h5>
                            <i>Controls the looping behavior of the track:</i><br />
                            <i>• Enable: Toggles looping on/off</i><br />
                            <i>• Loop Offset: Adjusts the loop end point by adding frames to the calculated loop length</i><br />
                            <i>The final loop length is calculated as:</i>
                            <TeX math="\text{LoopFrames}_{t} = \text{MaxFrames} + \text{LoopOffset}_{t}" block />
                            <i>where:</i>
                            <br />
                            <i>• <TeX math="t" /> for representing <TeX math="t^{th}" /> config</i><br />
                            <i>• <TeX math="\text{LoopOffset}_{t}" /> is a loop offset</i><br />
                            <i>• <TeX math="\text{MaxFrames}" /> is the highest frames in the all of tracks</i>
                        </div>

                        <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid #ffffff" }} />

                        {/* Speed */}
                        <div>
                            <h5>Speed</h5>
                            <i>Adjusts the playback speed of the track.</i><br />
                            <i>The frame offset for each note is calculated as:</i>
                            <TeX math="\text{Frames}_{t,n} = \text{Tick}_{t,n} \cdot \text{Fps} \cdot (2-\text{FramesSpeed}_{t}) + \text{FramesOffset}_{t} + 1" block />
                            <i>where:</i>
                            <br />
                            <i>• <TeX math="t" /> for representing <TeX math="t^{th}" /> config</i><br />
                            <i>• <TeX math="n" /> for representing <TeX math="n^{th}" /> note in <TeX math="t^{th}" /> config</i><br />
                            <i>• <TeX math="\text{FramesOffset}_{t}" /> is a frames offset</i><br />
                            <i>• <TeX math="\text{FramesSpeed}_{t}" /> is a frames speed</i><br />
                            <i>• <TeX math="\text{Tick}_{t,n}" /> is the μs tempo</i><br />
                            <i>• <TeX math="\text{Fps}" /> is the game fps (always 50)</i>
                            <br /><br />
                            <i>• <TeX math="\text{FramesSpeed}_{t} \gt 1" />: Notes plays faster than original</i><br />
                            <i>• <TeX math="\text{FramesSpeed}_{t} \lt 1" />: Notes plays slower than original</i><br />
                            <i>• <TeX math="\text{FramesSpeed}_{t} = 1" />: Notes plays at original tempo</i>
                        </div>

                        <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid #ffffff" }} />

                        {/* Strip Before/After */}
                        <div>
                            <h5>Strip Before/After</h5>
                            <i>Filters out notes based on their frame offsets:</i><br />
                            <i>• Strip Before: Removes notes before the specified frame number</i><br />
                            <i>• Strip After: Removes notes after the specified frame number</i><br />
                            <i>When either value is 0, no stripping is performed for that boundary</i>
                        </div>
                    </div>
                </Modal>
            </div>

            <input
                type="file"
                accept=".json"
                ref={trackConfigImportInputRef}
                style={{ display: "none" }}
                onChange={handleTrackConfigImport}
            />
        </div>
    );
}