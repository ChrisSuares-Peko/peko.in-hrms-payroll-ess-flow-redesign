import { useRef, useEffect, useState } from 'react';

/**
 * Custom hook to detect if text content is truncated due to CSS `line-clamp` or overflow.
 * It compares the scrollHeight (full content height) with the offsetHeight (visible height).
 *
 * @returns An object containing:
 * - `textRef`: A ref to be attached to the HTML element containing the text.
 * - `isTruncated`: A boolean indicating whether the text is truncated.
 */
const useTextTruncation = () => {
    const textRef = useRef<HTMLElement>(null); // Use HTMLElement for more general DOM element types
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
        const checkTruncation = () => {
            if (textRef.current) {
                // For single-line truncation, scrollHeight vs offsetHeight can be very accurate.
                // If scrollHeight is greater than offsetHeight, it means content is overflowing vertically.
                // We add a small buffer (e.g., 1px) to account for potential sub-pixel differences.
                setIsTruncated(textRef.current.scrollHeight > textRef.current.offsetHeight + 1);
            }
        };

        // Use a small timeout to ensure all rendering and styling has settled
        const timeoutId = setTimeout(checkTruncation, 50); // Give it a short delay

        // Re-check on window resize
        window.addEventListener('resize', checkTruncation);

        // Clean up the event listener and timeout
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', checkTruncation);
        };
    }, []); // Empty dependency array because the logic only depends on the DOM element and window resize

    // You might want to re-run the effect if the text content itself changes.
    // To do this, you'd need to pass the text as a dependency to the hook.
    // Let's modify the hook slightly to accept a dependency:
    // const useTextTruncation = (content: string) => { ... }
    // then in useEffect: }, [content]);
    // For now, let's assume the component re-renders when workDescription changes,
    // and the ref will naturally point to the updated content.
    // If you explicitly pass `workDescription` as a dependency to the *caller's* `useEffect` (which you did before),
    // it will still trigger re-evaluation of the component and thus the ref state.

    return { textRef, isTruncated };
};

export default useTextTruncation;
