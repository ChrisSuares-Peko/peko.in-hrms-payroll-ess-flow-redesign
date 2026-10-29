import { useCallback, useRef, useEffect } from 'react';

type useInfiniteScrollTypes = {
    setPage: () => void;
    loading: boolean;
    hasMore: boolean;
};

const useInfiniteScroll = ({ setPage, loading, hasMore }: useInfiniteScrollTypes) => {
    const observer = useRef<IntersectionObserver | null>(null);

    const loaderRef = useCallback<IntersectionObserverCallback>(
        node => {
            if (loading) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
                if (entries[0].isIntersecting && hasMore) {
                    setPage();
                }
            });

            if (node) observer.current.observe(node as any);
        },
        [setPage, loading, hasMore]
    );

    // eslint-disable-next-line arrow-body-style
    useEffect(() => {
        return () => {
            if (observer.current) observer.current.disconnect();
        };
    }, []);

    return loaderRef;
};

export default useInfiniteScroll;
