import { useEffect, useRef, useState } from 'react';

import { Flex, Spin } from 'antd';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = '/javascript/pdf.worker.min.js';

interface PDFAllPagesProps {
    fileUrl: string;
    onPageCountChange: (count: number) => void;
    onPageChange: (page: number) => void;
}

const PDFAllPages = ({ fileUrl, onPageCountChange, onPageChange }: PDFAllPagesProps) => {
    // wrapperRef is observed for width changes — it never changes size due to PDF content
    const wrapperRef = useRef<HTMLDivElement>(null);
    // containerRef receives the rendered canvases
    const containerRef = useRef<HTMLDivElement>(null);
    const callbacksRef = useRef({ onPageCountChange, onPageChange });
    callbacksRef.current = { onPageCountChange, onPageChange };

    const [isLoading, setIsLoading] = useState(true);
    const [pageCount, setPageCount] = useState(0);
    const lastWidthRef = useRef(0);
    const isRenderingRef = useRef(false);
    // Cancellation token — replaced each render so previous render stops early
    const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });

    const renderPdf = async (width: number) => {
        const container = containerRef.current;
        if (!container || !fileUrl) return;

        // Cancel any in-progress render
        cancelRef.current.cancelled = true;
        const signal = { cancelled: false };
        cancelRef.current = signal;

        isRenderingRef.current = true;
        setIsLoading(true);
        while (container.firstChild) container.removeChild(container.firstChild);

        try {
            const doc = await getDocument(fileUrl).promise;
            if (signal.cancelled) return;

            callbacksRef.current.onPageCountChange(doc.numPages);
            setPageCount(doc.numPages);
            const pixelRatio = window.devicePixelRatio || 1;

            const pageNumbers = Array.from({ length: doc.numPages }, (_, i) => i + 1);
            const pages = await Promise.all(pageNumbers.map(n => doc.getPage(n)));
            if (signal.cancelled) return;

            const renderTargets = pages.map((page, i) => {
                const pageNum = i + 1;
                const baseViewport = page.getViewport({ scale: 1 });
                const cssScale = width / baseViewport.width;
                const viewport = page.getViewport({ scale: cssScale * pixelRatio });

                const wrapper = document.createElement('div');
                wrapper.dataset.pageNumber = String(pageNum);
                wrapper.style.boxShadow = '0 1px 6px rgba(0,0,0,0.15)';
                if (pageNum < doc.numPages) wrapper.style.marginBottom = '8px';

                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                canvas.style.display = 'block';
                canvas.style.width = '100%';
                canvas.style.height = `${viewport.height / pixelRatio}px`;

                wrapper.appendChild(canvas);
                container.appendChild(wrapper);

                return { page, canvas, viewport };
            });

            let firstPageDone = false;
            await Promise.all(
                renderTargets.map(({ page, canvas, viewport }) => {
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return Promise.resolve();
                    return page.render({ canvasContext: ctx, viewport }).promise.then(() => {
                        if (!firstPageDone) {
                            firstPageDone = true;
                            setIsLoading(false);
                        }
                    });
                })
            );
        } catch {
            setIsLoading(false);
        } finally {
            if (!signal.cancelled) isRenderingRef.current = false;
        }
    };

    // Render on fileUrl change
    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;
        const width = wrapper.clientWidth || 600;
        lastWidthRef.current = width;
        renderPdf(width);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fileUrl]);

    // Observe the WRAPPER (not the canvas container) so adding canvases doesn't trigger loop
    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return undefined;

        let debounceTimer: ReturnType<typeof setTimeout>;

        const observer = new ResizeObserver(entries => {
            const newWidth = Math.round(entries[0].contentRect.width);
            // Skip trivial changes (scrollbar appears/disappears ≈ 15px) and in-progress renders
            if (Math.abs(newWidth - lastWidthRef.current) < 20) return;
            if (isRenderingRef.current) return;
            lastWidthRef.current = newWidth;

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => renderPdf(newWidth), 250);
        });

        observer.observe(wrapper);
        return () => {
            observer.disconnect();
            clearTimeout(debounceTimer);
            cancelRef.current.cancelled = true;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Track visible page on scroll
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return undefined;

        const handleScroll = () => {
            const wrappers = container.querySelectorAll<HTMLElement>('[data-page-number]');
            let currentPage = 0;
            const midpoint = container.scrollTop + container.clientHeight / 2;
            wrappers.forEach(el => {
                if (el.offsetTop <= midpoint)
                    currentPage = parseInt(el.dataset.pageNumber ?? '1', 10) - 1;
            });
            callbacksRef.current.onPageChange(currentPage);
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            {isLoading && (
                <Flex
                    justify="center"
                    align="center"
                    className="absolute inset-0 z-10 bg-white/70 min-h-[200px]"
                >
                    <Spin />
                </Flex>
            )}
            <div
                ref={containerRef}
                style={{
                    width: '100%',
                    backgroundColor: 'white',
                    padding: '8px',
                    boxSizing: 'border-box',
                }}
                className={pageCount > 1 ? 'max-h-[300px] sm:max-h-[500px] xl:max-h-[960px] overflow-auto' : undefined}
            />
        </div>
    );
};

export default PDFAllPages;
