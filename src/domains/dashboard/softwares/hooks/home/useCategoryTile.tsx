import { useMemo, useRef, useState, useEffect, useCallback } from 'react';

import useScreenSize from '@src/hooks/useScreenSize';

import { IsoftwareCategory } from '../../types';

const useCategoryTile = (categoryList: IsoftwareCategory[], isLoading: boolean) => {
    const screens = useScreenSize();
    const { tileIconSize } = useMemo(() => {
        let tile = 30;
        if (screens.xs) {
            tile = 20;
        } else if (screens.sm) {
            tile = 20;
        }
        return { tileIconSize: tile };
    }, [screens]);

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;

        if (el) {
            requestAnimationFrame(updateScrollState);
            el.addEventListener('scroll', updateScrollState);

            const resizeObserver = new ResizeObserver(updateScrollState);
            resizeObserver.observe(el);

            return () => {
                el.removeEventListener('scroll', updateScrollState);
                resizeObserver.disconnect();
            };
        }

        return undefined;
    }, [updateScrollState, categoryList, isLoading]);

    const scrollLeft = () => {
        scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
    };

    const scrollRight = () => {
        scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
    };

    return { tileIconSize, scrollRef, scrollLeft, scrollRight, canScrollLeft, canScrollRight };
};

export default useCategoryTile;
