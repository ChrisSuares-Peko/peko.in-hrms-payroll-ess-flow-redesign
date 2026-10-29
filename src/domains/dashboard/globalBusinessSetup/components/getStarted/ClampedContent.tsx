import React, { useLayoutEffect, useRef, useState } from 'react';

import { sanitizeHtml } from '../../utils/sanitizeHtml';

interface ClampedContentProps {
    content: string;
    // Render `content` as trusted HTML (admin/vendor-authored) instead of text.
    html?: boolean;
    className?: string;
    contentClassName?: string;
    // Number of lines to clamp to before showing "See more" (default 3).
    lines?: number;
}

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

/**
 * Line-clamped text with a "See more"/"See less" toggle. Clamps to `lines`
 * (inline -webkit-box, so no Tailwind dynamic-class purge issues) and only
 * shows the toggle when the content actually overflows (ResizeObserver).
 * `stopPropagation` lets it live inside a pressable card without triggering the
 * card's onClick. Ported (adapted to antd/Tailwind + Peko red) from the vendor.
 */
const ClampedContent: React.FC<ClampedContentProps> = ({
    content,
    html,
    className = '',
    contentClassName = '',
    lines = 3,
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [clamped, setClamped] = useState(false);

    useLayoutEffect(() => {
        const el = ref.current;

        if (!el) return undefined;

        const check = () => setClamped(el.scrollHeight > el.clientHeight + 1);

        check();

        const ro = new ResizeObserver(check);

        ro.observe(el);

        return () => ro.disconnect();
    }, [content]);

    const clampStyle: React.CSSProperties = expanded
        ? {}
        : {
              display: '-webkit-box',
              WebkitLineClamp: lines,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
          };

    return (
        <div className={`relative ${className}`}>
            {html ? (
                <div
                    ref={ref}
                    className={`${contentClassName} [&_li_p]:my-0`}
                    style={clampStyle}
                    // Admin/vendor HTML, sanitized (same model as HighlightsCard).
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                />
            ) : (
                <div ref={ref} className={contentClassName} style={clampStyle}>
                    {content}
                </div>
            )}

            {clamped && !expanded && (
                <button
                    type="button"
                    onPointerDown={stop}
                    onClick={e => {
                        stop(e);
                        setExpanded(true);
                    }}
                    className="absolute bottom-0 right-0 bg-gradient-to-l from-white from-60% to-transparent pl-8 text-xs font-medium text-[#FF4F4F]"
                >
                    … See more
                </button>
            )}

            {expanded && (
                <button
                    type="button"
                    onPointerDown={stop}
                    onClick={e => {
                        stop(e);
                        setExpanded(false);
                    }}
                    className="mt-1 text-xs font-medium text-[#FF4F4F]"
                >
                    See less
                </button>
            )}
        </div>
    );
};

export default ClampedContent;
