"use client";

import "./globals.css";
import { type SyntheticEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { Tooltip, OverlayTrigger } from "react-bootstrap";
import Modal from "react-modal";
import "katex/dist/katex.min.css";
import TeX from "@matejmazur/react-katex";
import Select from "react-select";
import { StaticImageData } from "next/image";
import { KatexOptions } from "katex";

import duckIcon from "../public/icons/duck.png";
import glassBreakIcon from "../public/icons/glass-break.png";
import bubbleIcon from "../public/icons/bubble.png";
import lightSwitchIcon from "../public/icons/light-switch.png";
import ringBellIcon from "../public/icons/ring-bell.png";
import exclamationIcon from "../public/icons/exclamation.png";
import springIcon from "../public/icons/spring.png";
import hornIcon from "../public/icons/horn.png";
import okIcon from "../public/icons/ok.png";
import punchIcon from "../public/icons/punch.png";
import laserGunIcon from "../public/icons/laser-gun.png";
import wooshIcon from "../public/icons/woosh.png";
import whistleIcon from "../public/icons/whistle.png";
import magicIcon from "../public/icons/magic.png";
import ninjaIcon from "../public/icons/ninja.png";
import clappingIcon from "../public/icons/clapping.png";
import drumRollIcon from "../public/icons/drum-roll.png";
import pianoIcon from "../public/icons/piano.png";
import bassIcon from "../public/icons/bass.png";
import partyNoisemakerIcon from "../public/icons/party-noisemaker.png";
import hootIcon from "../public/icons/hoot.png";
import laughterIcon from "../public/icons/laughter.png";
import suspenseIcon from "../public/icons/suspense.png";
import woodScraperIcon from "../public/icons/wood-scraper.png";
import drumIcon from "../public/icons/drum.png";
import nonoIcon from "../public/icons/no-no.png";
import glassBottleIcon from "../public/icons/glass-bottle.png";
import woodimbaIcon from "../public/icons/woodimba.png";
import metallicHitIcon from "../public/icons/metallic-hit.png";
import gunIcon from "../public/icons/gun.png";
import electricChargeIcon from "../public/icons/electric-charge.png";
import laserBlastIcon from "../public/icons/laser-blast.png";
import heartbeatIcon from "../public/icons/heartbeat.png";
import rubberChickenIcon from "../public/icons/rubber-chicken.png";
import dogBarkIcon from "../public/icons/dog-bark.png";
import catMeowIcon from "../public/icons/cat-meow.png";
import tollBellIcon from "../public/icons/toll-bell.png";
import robotIcon from "../public/icons/robot.png";
import damageIcon from "../public/icons/damage.png";

const TRACKS_NORMAL_PREFIX = "NOT_AN_ERROR:" as const;

declare global {
    interface Window {
        goIwm: { // Define methods between wasm
            tracks(encodedMidi: string): `${typeof TRACKS_NORMAL_PREFIX}${string}` | string;
            midiToEventObjects(encodedMidi: string, encodedTrackConfigs: string): string;
        },
    }
}

const cyrb53 = (text: string, seed = 0): string => {
    let h1 = 0xdeadbeef ^ seed,
        h2 = 0x41c6ce57 ^ seed;

    for (let i = 0, ch; i < text.length; i++) {
        ch = text.charCodeAt(i);

        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }

    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);

    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
};

const downloadText = (fileName: string, text: string) => {
    const tempElement = document.createElement("a");
    const file = new Blob([text], { type: "application/json" });

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
     * This value is string since evaluted in submittion.
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

const InstructionSelectLabel = (name: string, icon: StaticImageData) => {
    return (
        <div className="relative flex items-center w-full h-4">
            {name}
            <img style={{ objectFit: "fill", width: 24, height: 24, position: "absolute", right: -4 }} src={icon.src} />
        </div>
    );
};

const INSTRUCTION_PIANO_SELECT_OPTION = {
    value: 18,
    label: InstructionSelectLabel("Piano", pianoIcon),
};

const INSTRUCTION_SELECT_OPTIONS = [
    {
        value: 0,
        label: InstructionSelectLabel("Duck", duckIcon),
    },
    {
        value: 1,
        label: InstructionSelectLabel("Glass Break", glassBreakIcon),
    },
    {
        value: 2,
        label: InstructionSelectLabel("Bubble", bubbleIcon),
    },
    {
        value: 3,
        label: InstructionSelectLabel("Light Switch", lightSwitchIcon),
    },
    {
        value: 4,
        label: InstructionSelectLabel("Ring Bell", ringBellIcon),
    },
    {
        value: 5,
        label: InstructionSelectLabel("Exclamation", exclamationIcon),
    },
    {
        value: 6,
        label: InstructionSelectLabel("Spring", springIcon),
    },
    {
        value: 7,
        label: InstructionSelectLabel("Horn", hornIcon),
    },
    {
        value: 8,
        label: InstructionSelectLabel("OK", okIcon),
    },
    // { // No needed since its same with Glass Break
    //     value: 9,
    //     label: InstructionSelectLabel("Glass Break 2", glassBreakIcon),
    // },
    {
        value: 10,
        label: InstructionSelectLabel("Punch", punchIcon),
    },
    {
        value: 11,
        label: InstructionSelectLabel("Laser Gun", laserGunIcon),
    },
    {
        value: 12,
        label: InstructionSelectLabel("Woosh", wooshIcon),
    },
    {
        value: 13,
        label: InstructionSelectLabel("Whistle", whistleIcon),
    },
    {
        value: 14,
        label: InstructionSelectLabel("Magic", magicIcon),
    },
    {
        value: 15,
        label: InstructionSelectLabel("Ninja", ninjaIcon),
    },
    {
        value: 16,
        label: InstructionSelectLabel("Clapping", clappingIcon),
    },
    {
        value: 17,
        label: InstructionSelectLabel("Drum Roll", drumRollIcon),
    },
    INSTRUCTION_PIANO_SELECT_OPTION,
    {
        value: 19,
        label: InstructionSelectLabel("Bass", bassIcon),
    },
    {
        value: 20,
        label: InstructionSelectLabel("Party Noisemaker", partyNoisemakerIcon),
    },
    {
        value: 21,
        label: InstructionSelectLabel("Hoot", hootIcon),
    },
    {
        value: 22,
        label: InstructionSelectLabel("Laughter", laughterIcon),
    },
    {
        value: 23,
        label: InstructionSelectLabel("Suspense", suspenseIcon),
    },
    {
        value: 24,
        label: InstructionSelectLabel("Wood Scraper", woodScraperIcon),
    },
    {
        value: 25,
        label: InstructionSelectLabel("Drum", drumIcon),
    },
    {
        value: 26,
        label: InstructionSelectLabel("No-no", nonoIcon),
    },
    {
        value: 27,
        label: InstructionSelectLabel("Glass Bottle", glassBottleIcon),
    },
    {
        value: 28,
        label: InstructionSelectLabel("Woodimba", woodimbaIcon),
    },
    {
        value: 29,
        label: InstructionSelectLabel("Metallic Hit", metallicHitIcon),
    },
    {
        value: 30,
        label: InstructionSelectLabel("Gun", gunIcon),
    },
    {
        value: 31,
        label: InstructionSelectLabel("Electric Charge", electricChargeIcon),
    },
    {
        value: 32,
        label: InstructionSelectLabel("Laser Blast", laserBlastIcon),
    },
    {
        value: 33,
        label: InstructionSelectLabel("Heartbeat", heartbeatIcon),
    },
    {
        value: 34,
        label: InstructionSelectLabel("Rubber Chicken", rubberChickenIcon),
    },
    {
        value: 35,
        label: InstructionSelectLabel("Dog Bark", dogBarkIcon),
    },
    {
        value: 36,
        label: InstructionSelectLabel("Cat Meow", catMeowIcon),
    },
    {
        value: 37,
        label: InstructionSelectLabel("Toll Bell", tollBellIcon),
    },
    {
        value: 38,
        label: InstructionSelectLabel("Robot", robotIcon),
    },
    {
        value: 39,
        label: InstructionSelectLabel("Damage", damageIcon),
    },
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

const makeDefaultTrackConfig = (id: number): TrackConfig => ({
    id: id,
    Track: 0,
    Instrumental: INSTRUCTION_PIANO_SELECT_OPTION.value,  // Default is piano
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

const DEFAULT_TRACK_CONFIGS: Array<TrackConfig> = [makeDefaultTrackConfig(0)];

const STORAGE_TRACK_CONFIG_KEY_PREFIX = "trackConfig_" as const;

const prefixTrackConfigName = (configName: string) => STORAGE_TRACK_CONFIG_KEY_PREFIX + configName;

const TRACK_CONFIG_SELECTION_DEFAULT_NAME = "VIEW_PLACEHOLDER_OFFSET" as const;

const ABOUT_MORE_KATEX_MACROS = {
    macros: {
        [String.raw`\th`]: String.raw`\mathrm{th}`,

        [String.raw`\notes`]: String.raw`\notestr_{t}`,
        [String.raw`\notescrd`]: String.raw`\# \left( \notes \right)`,
        [String.raw`\notesindcs`]: String.raw`\{1, \; \cdots, \notescrd \}`,

        [String.raw`\notestr`]: String.raw`\mathcal{N}`,
        [String.raw`\notestrcrd`]: String.raw`\# \notestr`,
        [String.raw`\notestrindcs`]: String.raw`\{1, \; \cdots, \notestrcrd \}`,

        [String.raw`\pitch`]: String.raw`p_{\tiny \notestr_{t,n}}`,
        [String.raw`\pitchf`]: String.raw`\mathfrak{P}_{t,n}`,
        [String.raw`\pitchratio`]: String.raw`\mathfrak{R}_{\pitch}`,
        [String.raw`\pitchadj`]: String.raw`\mathfrak{A}_{t}`,
        [String.raw`\pitchmax`]: String.raw`\mathrm{max}_{p \tiny _ {\notes}}`,

        [String.raw`\vel`]: String.raw`\mathfrak{V}_{t,n}`,

        [String.raw`\loopfrm`]: String.raw`\mathfrak{L}_{t}`,

        [String.raw`\frm`]: String.raw`\mathfrak{F}_{t,n}`,
        [String.raw`\maxfrm`]: String.raw`\mathrm{max}_{\mathfrak{F}}`,
    },
} as const satisfies KatexOptions;

const AboutMoreBlockTex = (math: string) => {
    return (
        <TeX math={math} block settings={ABOUT_MORE_KATEX_MACROS} />
    );
};

const AboutMoreTex = (math: string) => {
    return (
        <TeX math={math} settings={ABOUT_MORE_KATEX_MACROS} />
    );
};

const AboutMoreTTex = AboutMoreTex("t");
const AboutMoreNTex = AboutMoreTex("n");

const AboutMoreTThTex = AboutMoreTex(String.raw`t^{\th}`);
const AboutMoreNThTex = AboutMoreTex(String.raw`n^{\th}`);

const AboutMoreSingleTThWhere =
    <>
        <i>where {AboutMoreTTex} for representing {AboutMoreTThTex} config</i>
    </>;

const AboutMoreTThNThWhere =
    <>
        <i>• {AboutMoreTTex} for representing {AboutMoreTThTex} config</i><br />
        <i>• {AboutMoreNTex} for representing {AboutMoreNThTex} note in {AboutMoreTThTex} config</i>
    </>;

const AboutMoreContinuableTThNThWhere =
    <>
        {AboutMoreTThNThWhere}
        <br />
    </>;

const AboutMoreSpecifiedInTThConfig =
    <>
        specified in {AboutMoreTThTex} config
    </>;

const AboutMoreConfigDescriptionTargetSeparator =
    <>
        <hr style={{ margin: "20px 0", border: "none", borderTop: "3px solid #ffffff" }} />
    </>;

const AboutMoreConfigDescriptionSeparator =
    <>
        <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid #ffffff" }} />
    </>;

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

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (trackConfigsModified) {
                e.preventDefault();

                e.returnValue = "";

                return "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [trackConfigsModified]);

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

    type HandleableEvents = React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>;

    type DetailedElement<T> = Omit<T, "name"> & { name: DotNestedTrackConfigKeys };

    type HTMLInputElementEventTarget = EventTarget & DetailedElement<HTMLInputElement>;
    type HTMLSelectElementEventTarget = EventTarget & DetailedElement<HTMLSelectElement>;

    type DetailedHandleableEventTargets =
        HTMLInputElementEventTarget | HTMLSelectElementEventTarget;

    const handleTrackConfigChange = (event: HandleableEvents, index: number) => {
        const typedTarget =
            event.target as DetailedHandleableEventTargets;

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

    const logGenerationDoneMessage = (data: string, numObjects: number) => {
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
            linkElement.onclick = () => navigator.clipboard.writeText(data).then(
                () => {
                    log("Successfully copied!");
                },
                () => {
                    log("Copy failed, downloading...");

                    downloadText(`out_${new Date().getTime()}.txt`, data);
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

    const addTabTrackConfig = () => {
        const newId =
            trackConfigs.length > 0
                ? Math.max(...trackConfigs.map(t => t.id)) + 1
                : 0;

        const config = makeDefaultTrackConfig(newId);

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
            case "submit-config": {
                const file = (document.getElementById("midi-input") as HTMLInputElement).files?.[0];
                if (!file) {
                    log("Please input midi file before submit configurations");

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

            case "about-more": {
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
                    type="file"
                    className="w-full px-2 py-2 text-sm"
                    aria-describedby="file_input_help"
                    accept=".mid,.midi"
                    id="midi-input"
                    onInput={async function (event) {
                        const file = (event.target as HTMLInputElement).files?.[0];
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
                />
            </div>

            <br />

            <h5>Log</h5><div aria-label="System Information" id="log-console"></div>

            <br />

            <div className="d-flex justify-content-end">
                <button className="btn btn-primary me-2" style={{ width: 75, height: 33, padding: "1px 0rem 0px 0px" }} onClick={() => {
                    const name = prompt("Input configuration name to delete");
                    if (!name) {
                        log(`Configuration "${name}" not valid`);

                        return;
                    }

                    saveTrackConfig(name);
                }}>
                    Save
                </button>

                <button className="btn btn-danger me-2" style={{ width: 82, height: 33, padding: "1px 0rem 0px 0px" }} onClick={() => {
                    const name = prompt("Input configuration name to delete");
                    if (!name) {
                        log(`Configuration "${name}" not valid`);

                        return;
                    }

                    deleteTrackConfig(name);
                }}>
                    Delete
                </button>

                <select
                    className="form-select me-2 configuration-select"
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

                    downloadText(`export_${cyrb53(jsonTrackConfigs)}.json`, jsonTrackConfigs);
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
                                                <Tooltip className="configuration-tooltip">
                                                    Track. You can view track list by log (you need to input midi file).
                                                    <br />
                                                    If track is logged like &quot;Track: x, name: ...&quot; you can input x here.
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
                                        className="form-control configuration-string-inputter"
                                        id={`Track-${track.id}`}
                                        name={"Track" satisfies DotNestedTrackConfigKeys}
                                        value={track.Track}
                                        onChange={(event) => handleTrackConfigChange(event, index)}
                                    />
                                </div>

                                <div className="col">
                                    <label htmlFor={`Instrumental-${track.id}`} className="form-label">Instrumental</label>

                                    <Select
                                        className="scroller"
                                        options={INSTRUCTION_SELECT_OPTIONS}
                                        id={`Instrumental-${track.id}`}
                                        value={INSTRUCTION_SELECT_OPTIONS.find(option => option.value === track.Instrumental)}
                                        defaultValue={INSTRUCTION_PIANO_SELECT_OPTION}
                                        placeholder="Type something..."
                                        onChange={(newValue) => handleTrackConfigChange(
                                            {
                                                target: {
                                                    name: "Instrumental" satisfies DotNestedTrackConfigKeys,
                                                    type: "select-one",
                                                    value: String(newValue?.value),
                                                } as HTMLSelectElementEventTarget,
                                            } as HandleableEvents,
                                            index,
                                        )}
                                        filterOption={(option, input) => {
                                            // Extract name
                                            const name = option.data.label.props.children[0].trim();

                                            return name.toLowerCase().includes(input.toLowerCase());
                                        }}
                                        styles={{
                                            control: (base) => ({
                                                ...base,

                                                width: "16rem",
                                                height: "2rem",
                                                minHeight: "2rem",
                                                borderColor: "#cccccc",
                                                fontFamily: "Courier New, Courier, monospace",
                                                cursor: "pointer",
                                            }),
                                            input: (base) => ({
                                                ...base,

                                                fontWeight: "600",
                                            }),
                                            container: (base) => ({
                                                ...base,

                                                color: "black",
                                            }),
                                            valueContainer: (base) => ({
                                                ...base,

                                                padding: "0 0.6rem",
                                            }),
                                            indicatorSeparator: props => ({
                                                display: "none",
                                            }),
                                            indicatorsContainer: (base, props) => ({
                                                ...base,

                                                height: "2rem",
                                            }),
                                            option: (base) => ({
                                                ...base,

                                                cursor: "pointer",
                                            }),
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col">
                                    <div className="d-flex justify-content-between">
                                        <label htmlFor={`BaseNote-${track.id}`} className="form-label">Base Note</label>

                                        <OverlayTrigger
                                            placement="top"
                                            overlay={
                                                <Tooltip className="configuration-tooltip">
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
                                        className="form-control configuration-string-inputter"
                                        id={`BaseNote-${track.id}`}
                                        name={"BaseNote" satisfies DotNestedTrackConfigKeys}
                                        value={track.BaseNote}
                                        onChange={(event) => handleTrackConfigChange(event, index)}
                                    />
                                </div>

                                <div className="col">
                                    <div className="d-flex justify-content-between">
                                        <label htmlFor={`MaxNote-${track.id}`} className="form-label">Max Note</label>

                                        <OverlayTrigger
                                            placement="top"
                                            overlay={
                                                <Tooltip className="configuration-tooltip">
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
                                        className="form-control configuration-string-inputter"
                                        id={`MaxNote-${track.id}`}
                                        name={"MaxNote" satisfies DotNestedTrackConfigKeys}
                                        value={track.MaxNote}
                                        onChange={(event) => handleTrackConfigChange(event, index)}
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
                                                <Tooltip className="configuration-tooltip">
                                                    Volume offset added to original volume. If volume constant is on, will use this value as volume constant.
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
                                        className="form-control configuration-string-inputter"
                                        id={`Offsets.Volume-${track.id}`}
                                        name={"Offsets.Volume" satisfies DotNestedTrackConfigKeys}
                                        value={track.Offsets.Volume}
                                        onChange={(event) => handleTrackConfigChange(event, index)}
                                    />
                                </div>
                                <div className="col">
                                    <label className="form-check-label" htmlFor={`Offsets.VolumeConstant-${track.id}`}>Volume Constant</label>

                                    <input
                                        type="checkbox"
                                        className="form-check-input configuration-checkbox"
                                        id={`Offsets.VolumeConstant-${track.id}`}
                                        name={"Offsets.VolumeConstant" satisfies DotNestedTrackConfigKeys}
                                        checked={track.Offsets.VolumeConstant}
                                        onChange={(event) => handleTrackConfigChange(event, index)}
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
                                                <Tooltip className="configuration-tooltip">
                                                    Pitch offset added to original pitch. If pitch constant is on, will use this value as pitch constant.
                                                    <br />
                                                    Dont forgot that you can use <span style={{ color: "cyan" }}>minus</span> value.
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
                                        className="form-control configuration-string-inputter"
                                        id={`Offsets.Pitch-${track.id}`}
                                        name={"Offsets.Pitch" satisfies DotNestedTrackConfigKeys}
                                        value={track.Offsets.Pitch}
                                        onChange={(event) => handleTrackConfigChange(event, index)}
                                    />
                                </div>

                                <div className="col">
                                    <label className="form-check-label" htmlFor={`Offsets.PitchConstant-${track.id}`}>Pitch Constant</label>

                                    <input
                                        type="checkbox"
                                        className="form-check-input configuration-checkbox"
                                        id={`Offsets.PitchConstant-${track.id}`}
                                        name={"Offsets.PitchConstant" satisfies DotNestedTrackConfigKeys}
                                        checked={track.Offsets.PitchConstant}
                                        onChange={(event) => handleTrackConfigChange(event, index)}
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
                                        className="form-check-input configuration-checkbox"
                                        id={`Loop.Enable-${track.id}`}
                                        name={"Loop.Enable" satisfies DotNestedTrackConfigKeys}
                                        checked={track.Loop.Enable}
                                        onChange={(event) => handleTrackConfigChange(event, index)}
                                    />
                                </div>

                                <div className="col">
                                    <div className="d-flex justify-content-between">
                                        <label htmlFor={`Loop.LoopOffset-${track.id}`} className="form-label">Loop Offset</label>

                                        <OverlayTrigger
                                            placement="top"
                                            overlay={
                                                <Tooltip className="configuration-tooltip">
                                                    Offset frames added to the original loop frames.
                                                    <br />
                                                    Dont forgot that you can use <span style={{ color: "cyan" }}>minus</span> value.
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
                                        className="form-control configuration-string-inputter"
                                        id={`Loop.LoopOffset-${track.id}`}
                                        name={"Loop.LoopOffset" satisfies DotNestedTrackConfigKeys}
                                        value={track.Loop.LoopOffset}
                                        onChange={(event) => handleTrackConfigChange(event, index)}
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
                                                <Tooltip className="configuration-tooltip">
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
                                        className="form-control configuration-string-inputter"
                                        id={`Speed-${track.id}`}
                                        name={"Speed" satisfies DotNestedTrackConfigKeys}
                                        value={track.Speed}
                                        onChange={(event) => handleTrackConfigChange(event, index)}
                                    />
                                </div>

                                <div className="col">
                                    <label htmlFor={`StartAt-${track.id}`} className="form-label">Start At</label>

                                    <input
                                        type="number"
                                        className="form-control configuration-string-inputter"
                                        id={`StartAt-${track.id}`}
                                        name={"StartAt" satisfies DotNestedTrackConfigKeys}
                                        value={track.StartAt}
                                        onChange={(event) => handleTrackConfigChange(event, index)}
                                    />
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col">
                                    <label htmlFor={`StripBefore-${track.id}`} className="form-label">Strip Before</label>

                                    <input
                                        type="number"
                                        className="form-control configuration-string-inputter"
                                        id={`StripBefore-${track.id}`}
                                        name={"StripBefore" satisfies DotNestedTrackConfigKeys}
                                        value={track.StripBefore}
                                        onChange={(event) => handleTrackConfigChange(event, index)}
                                    />
                                </div>

                                <div className="col">
                                    <label htmlFor={`StripAfter-${track.id}`} className="form-label">Strip After</label>

                                    <input
                                        type="number"
                                        className="form-control configuration-string-inputter"
                                        id={`StripAfter-${track.id}`}
                                        name={"StripAfter" satisfies DotNestedTrackConfigKeys}
                                        value={track.StripAfter}
                                        onChange={(event) => handleTrackConfigChange(event, index)}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                ))}

                <div className="d-flex align-items-center justify-content-between">
                    <input type="submit" className="configuration-submit" value="Submit config" id="submit-config" />
                    <input type="submit" className="configuration-submit" value="About more" id="about-more" />
                </div>
            </form>

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
                <div id="about-more-modal-container" style={{
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

                    {AboutMoreConfigDescriptionTargetSeparator}

                    <h4>Config Informations</h4>

                    {/* Track */}
                    <div>
                        <h5>Track</h5>
                        <i>Specifies which MIDI track number to process from the input file.</i><br />
                    </div>

                    {AboutMoreConfigDescriptionSeparator}

                    {/* Instrumental */}
                    <div>
                        <h5>Instrumental</h5>
                        <i>Defines the sound ID to be used when playing notes from this track.</i><br />
                    </div>

                    {AboutMoreConfigDescriptionSeparator}

                    {/* Base Note */}
                    <div>
                        <h5>Base Note</h5>
                        <i>Base Note represents the reference MIDI note number used to calculate pitch frequencies.</i><br />
                        <i>In the implementation, relative pitch ratios are calculated using:</i>
                        {AboutMoreBlockTex(String.raw`
                        \pitchratio = 2^{\frac{\operatorname{max} (\pitch \; - \; \pitchadj, 0)-\mathrm{BaseNote}_{t}}{12}}.
                        `)}
                        <i>where:</i><br />
                        {AboutMoreContinuableTThNThWhere}
                        <i>• {AboutMoreTex(String.raw`\mathrm{BaseNote}_{t}`)} serves as the reference point (ratio = 1.0)</i><br />
                        <br />
                        <i style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}>
                            This value is evaluted as string in submittion. You can type value like this: &quot;61-10&quot;.
                        </i>
                    </div>

                    <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid #ffffff" }} />

                    {/* Max Note */}
                    <div>
                        <h5>Max Note</h5>
                        <i>Max Note is a value used to calculate the amount by which to decrease the index keys of the pitch table.</i><br />
                        <i>The decreasing value is calculated as follows:</i>
                        {AboutMoreBlockTex(String.raw`
                        \pitchadj = 7 \left\lceil\frac{\pitchmax - \mathrm{MaxNote}_{t}}{7}\right\rceil.
                        `)}
                        {AboutMoreSingleTThWhere}
                    </div>

                    {AboutMoreConfigDescriptionSeparator}

                    {/* Volume Offset */}
                    <div>
                        <h5>Volume Offset</h5>
                        <i>Adjusts the volume of notes in the track by adding an offset to the normalized velocity.</i><br />
                        <i>The final volume is calculated as:</i>
                        {AboutMoreBlockTex(String.raw`
                        \mathrm{min}_{\mathfrak{V}} = \frac{1}{20}, \mathrm{max}_{\mathfrak{V}} = 1, \\[0.5em]
                        \mathrm{min}_{v} = 0, \mathrm{max}_{v} = 2^{7} - 1, \\[0.5em]
                        v : \notestrindcs \to \mathcal{B}(\notesindcs, \{ x \mid \mathbb{N} \ni x \wedge \mathrm{min}_v \leq x \leq \mathrm{max}_v\}), \\[0.5em]
                        V_{t,n} = \mathrm{min}_{\mathfrak{V}} + \left\lbrace \left( \frac{v(t)(n)}{\mathrm{max}_{v}} \right)^{L} (\mathrm{max}_{\mathfrak{V}} - \mathrm{min}_{\mathfrak{V}}) \right\rbrace, \\[0.5em]
                        \vel = \operatorname{clamp} \left( V_{t,n} + \mathrm{VelocityOffset}_{t}, \mathrm{min}_{\mathfrak{V}}, \mathrm{max}_{\mathfrak{V}} \right).
                        `)}
                        <i>where:</i><br />
                        {AboutMoreContinuableTThNThWhere}
                        <i>• {AboutMoreTex(String.raw`\mathrm{VelocityOffset}_{t}`)} is a velocity offset {AboutMoreSpecifiedInTThConfig}</i><br />
                        <i>• {AboutMoreTex(String.raw`L = 2`)} is a velocity linearity parameter</i><br />
                        <i>• {AboutMoreTex(String.raw`\mathcal{B}(A, B) \overset{\mathrm{def}}{=} \left\{f \mid f : A \to B, \; \left(\forall a_1, a_2 \in A, f(a_1) = f(a_2) \Rightarrow a_1 = a_2 \right) \wedge \left(\forall b \in B, \exists a \in A \;\: \text{s.t.} \; f(a) = b\right) \right\}`)}<br />
                        Therefore, {AboutMoreTex(String.raw`\mathcal{B}(A, B)`)} returning all of the bijections for {AboutMoreTex(String.raw`A \to B`)}.
                        </i><br />
                        <br />
                        <i>When Volume Constant is true:</i><br />
                        <i>• The offset value is used directly as the volume</i>
                    </div>

                    {AboutMoreConfigDescriptionSeparator}

                    {/* Pitch Offset */}
                    <div>
                        <h5>Pitch Offset</h5>
                        <i>Adjusts the pitch of notes in the track by adding an offset to the calculated pitch ratio.</i><br />
                        <i>The final pitch is calculated as:</i>
                        {AboutMoreBlockTex(String.raw`
                        \pitchmax = \displaystyle\max_{p \: \in \: \{\pitch \: \mid \: n \: \in \: \notesindcs} p, \\[0.5em]
                        \pitchf = \operatorname{clamp} \left( \pitchratio + \mathrm{PitchOffset}_{t}, \frac{1}{20}, 3 \right).
                        `)}
                        <i>where:</i><br />
                        {AboutMoreContinuableTThNThWhere}
                        <i>• {AboutMoreTex(String.raw`\pitch`)} is pitch of {AboutMoreNThTex} note in {AboutMoreTex(String.raw`\notes`)}</i><br />
                        <i>• {AboutMoreTex(String.raw`\notescrd`)} is total note count of {AboutMoreTex(String.raw`\notes`)}</i><br />
                        <i>• {AboutMoreTex(String.raw`\mathrm{PitchOffset}_{t}`)} is a pitch offset {AboutMoreSpecifiedInTThConfig}</i>
                        <br /><br />
                        <i>When Pitch Constant is true:</i><br />
                        <i>• The offset value is used directly as the pitch</i>
                    </div>

                    {AboutMoreConfigDescriptionSeparator}

                    {/* Loop */}
                    <div>
                        <h5>Loop Configuration</h5>
                        <i>Controls the looping behavior of the track:</i><br />
                        <i>• Enable: Toggles looping on/off</i><br />
                        <i>• Loop Offset: Adjusts the loop end point by adding frames to the calculated loop length</i><br />
                        <i>The final loop length is calculated as:</i>
                        {AboutMoreBlockTex(String.raw`
                        \loopfrm =
                            \begin{cases}
                                \maxfrm + \mathrm{LoopOffset}_{t} & \mathrm{if} \; \mathrm{LoopEnabled}_{t} \\
                                \mathrm{FramesLimit} & \mathrm{otherwise}
                            \end{cases}
                        `)}
                        <i>where:</i><br />
                        <i>• {AboutMoreTTex} for representing {AboutMoreTThTex} config</i><br />
                        <i>• {AboutMoreTex(String.raw`D_{t} \overset{\mathrm{def}}{=} \{\top, \bot\}, \; \mathrm{LoopEnabled}_{t} \in D_{t}`)} whether enables loop {AboutMoreSpecifiedInTThConfig}</i><br />
                        <i>• {AboutMoreTex(String.raw`\mathrm{LoopOffset}_{t}`)} is a loop offset {AboutMoreSpecifiedInTThConfig}</i><br />
                        <i>• {AboutMoreTex(String.raw`\mathrm{FramesLimit} = 99999`)} is max usable frames in game</i><br />
                        <i>• {AboutMoreTex(String.raw`\notestrcrd`)} is total config amount (max of {AboutMoreTTex})</i>
                    </div>

                    {AboutMoreConfigDescriptionSeparator}

                    {/* Speed */}
                    <div>
                        <h5>Speed</h5>
                        <i>Adjusts the playback speed of the track.</i><br />
                        <i>The frame offset for each note is calculated as:</i>
                        {AboutMoreBlockTex(String.raw`
                        \frm = \mathrm{Tick}_{t,n} \cdot \mathrm{Fps} \cdot (2-\mathrm{FramesSpeed}_{t}) + \mathrm{FramesOffset}_{t} + 1, \\[0.5em]
                        \maxfrm = \displaystyle\max_{f \: \in \: \{\frm \: \mid \: t \: \in \: \notestrindcs, \; n \: \in \: \notesindcs} f.
                        `)}
                        <i>where:</i><br />
                        {AboutMoreContinuableTThNThWhere}
                        <i>• {AboutMoreTex(String.raw`\mathrm{FramesOffset}_{t}`)} is a frames offset {AboutMoreSpecifiedInTThConfig}</i><br />
                        <i>• {AboutMoreTex(String.raw`\mathrm{FramesSpeed}_{t}`)} is a frames speed {AboutMoreSpecifiedInTThConfig}</i><br />
                        <i>• {AboutMoreTex(String.raw`\mathrm{Tick}_{t,n}`)} is the μs tempo</i><br />
                        <i>• {AboutMoreTex(String.raw`\mathrm{Fps} = 50`)} is a average of game fps</i><br />
                        <br />
                        <i>• {AboutMoreTex(String.raw`\mathrm{FramesSpeed}_{t} \gt 1`)}: Notes plays faster than original</i><br />
                        <i>• {AboutMoreTex(String.raw`\mathrm{FramesSpeed}_{t} \lt 1`)}: Notes plays slower than original</i><br />
                        <i>• {AboutMoreTex(String.raw`\mathrm{FramesSpeed}_{t} = 1`)}: Notes plays at original tempo</i>
                    </div>

                    {AboutMoreConfigDescriptionSeparator}

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