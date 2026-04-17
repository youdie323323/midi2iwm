import { ReactNode, useRef, useEffect } from "react";

export interface Option<T> {
    label: string | ReactNode;
    value: T;
}

/**
 * User must add relative class on className.
 */
export default <T extends any>({
    options,
    selected,
    onChange,
}: {
    options: Array<Option<T>>;
    selected: T;
    onChange: (value: T) => void;
}) => {
    const buttonRefs = useRef<Array<HTMLButtonElement | null>>(new Array());
    const highlightRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const selectedIndex = options.findIndex((option) => option.value === selected);

        if (selectedIndex !== -1 && buttonRefs.current[selectedIndex] && highlightRef.current) {
            const { offsetLeft, offsetWidth } = buttonRefs.current[selectedIndex];

            highlightRef.current.style.left = `${offsetLeft}px`;
            highlightRef.current.style.width = `${offsetWidth}px`;
        }
    }, [selected, options]);

    return (
        <>
            <div
                ref={highlightRef}
                className="absolute top-0 left-0 h-full bg-white transition-all duration-75 ease-out"
                style={{ zIndex: -1 }}
            />

            {options.map((option, index) => (
                <button
                    key={index}
                    ref={(element) => void (buttonRefs.current[index] = element)}
                    onClick={() => onChange(option.value)}
                    className={`general-purpose-input ${selected === option.value ? "general-purpose-input-selected" : ""}`}
                >
                    {option.label}
                </button>
            ))}
        </>
    );
};