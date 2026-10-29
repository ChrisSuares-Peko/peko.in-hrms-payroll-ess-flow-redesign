import { useCallback, useEffect, useRef, useState } from 'react';

import { theme } from 'antd';

const DOCUMENT_WIDTH = 794;
const DEFAULT_DOCUMENT_HEIGHT = 1123;

interface ResponsiveHtmlPreviewProps {
    html: string;
    title?: string;
}

const ResponsiveHtmlPreview = ({ html, title = 'Invoice' }: ResponsiveHtmlPreviewProps) => {
    const { token } = theme.useToken();
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [preview, setPreview] = useState({
        height: DEFAULT_DOCUMENT_HEIGHT,
        scale: 1,
        offset: 0,
        ready: false,
    });

    const measure = useCallback(() => {
        const container = containerRef.current;
        const doc = iframeRef.current?.contentDocument;
        if (!container || !doc) return;

        const documentHeight = Math.max(
            doc.documentElement.scrollHeight,
            doc.body?.scrollHeight ?? 0,
            DEFAULT_DOCUMENT_HEIGHT
        );
        const availableWidth = container.clientWidth || DOCUMENT_WIDTH;
        const scale = Math.min(1, availableWidth / DOCUMENT_WIDTH);
        const offset = scale === 1 ? Math.max(0, (availableWidth - DOCUMENT_WIDTH) / 2) : 0;

        setPreview({ height: documentHeight, scale, offset, ready: true });
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return undefined;

        const handleResize = () => measure();
        window.addEventListener('resize', handleResize);

        const observer =
            typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(handleResize);
        observer?.observe(container);

        return () => {
            window.removeEventListener('resize', handleResize);
            observer?.disconnect();
        };
    }, [measure]);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: preview.height * preview.scale,
                overflow: 'hidden',
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadiusLG,
                background: token.colorBgContainer,
            }}
        >
            <iframe
                ref={iframeRef}
                srcDoc={html}
                title={title}
                scrolling="no"
                onLoad={measure}
                style={{
                    width: DOCUMENT_WIDTH,
                    height: preview.height,
                    border: 'none',
                    display: 'block',
                    pointerEvents: 'none',
                    opacity: preview.ready ? 1 : 0,
                    transform: `scale(${preview.scale})`,
                    transformOrigin: 'top left',
                    marginLeft: preview.offset,
                }}
            />
        </div>
    );
};

export default ResponsiveHtmlPreview;
