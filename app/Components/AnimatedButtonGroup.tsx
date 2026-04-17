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
    const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const highlightRef = useRef<HTMLDivElement>(null);

    const updateHighlight = () => {
        const selectedIndex = options.findIndex((option) => option.value === selected);
        if (selectedIndex === -1 || !buttonRefs.current[selectedIndex] || !highlightRef.current)
            return;

        const button = buttonRefs.current[selectedIndex]!;

        const { offsetLeft, offsetWidth } = button;

        highlightRef.current.style.left = `${offsetLeft}px`;
        highlightRef.current.style.width = `${offsetWidth}px`;
    };

    useEffect(() => updateHighlight, [selected, options]);

    useEffect(() => {
        const observer = new ResizeObserver(() => requestAnimationFrame(updateHighlight));

        buttonRefs.current.forEach((button) => button && observer.observe(button));

        return () => observer.disconnect();
    }, [options]);

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
                    ref={(el) => {
                        buttonRefs.current[index] = el;
                    }}
                    onClick={() => onChange(option.value)}
                    className={`general-purpose-input ${selected === option.value ? "general-purpose-input-selected" : ""}`}
                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                    {option.label}
                </button>
            ))}
        </>
    );
};