import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
    threshold?: number;
    rootMargin?: string;
}

const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const canObserve = () =>
    typeof window !== 'undefined' && typeof window.IntersectionObserver === 'function';

// Reports `true` once the node is near the viewport, then stops observing. Callers must use this
// only to ADD an entrance animation — never to hide content until it flips, because an observer
// that never reports (an inert test stub, a clipped ancestor, a page restored mid-scroll) would
// then strand that content invisible forever. The default rootMargin deliberately expands the
// bottom edge so the flip happens while the node is still below the fold and the animation has
// finished by the time it is actually on screen.
export default function useInView<T extends HTMLElement>({
    threshold = 0,
    rootMargin = '0px 0px 15% 0px',
}: UseInViewOptions = {}) {
    const ref = useRef<T | null>(null);
    const [inView, setInView] = useState(() => !canObserve() || prefersReducedMotion());

    useEffect(() => {
        if (inView) return undefined;
        const node = ref.current;
        if (!node) return undefined;

        const observer = new IntersectionObserver(
            entries => {
                if (entries.some(entry => entry.isIntersecting)) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { threshold, rootMargin }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [inView, threshold, rootMargin]);

    return { ref, inView };
}
