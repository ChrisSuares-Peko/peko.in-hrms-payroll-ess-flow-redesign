import { useCallback, useEffect, useRef, useState, type FC, type ElementType } from 'react';

type ClampedTextWithMoreProps = {
    text: string;
    clampClass?: string;
    textClassName?: string;
    moreClassName?: string;
    as?: ElementType;
};

/**
 * Truncates long text with CSS ellipsis; shows a "more" / "less" toggle when
 * content overflows the clamp. Used for product names on detail and cart.
 */
const ClampedTextWithMore: FC<ClampedTextWithMoreProps> = ({
    text,
    clampClass = 'line-clamp-2',
    textClassName = '',
    moreClassName = 'text-sm font-semibold text-lightRed',
    as: Tag = 'span',
}) => {
    const ref = useRef<HTMLSpanElement>(null);
    const [overflows, setOverflows] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const measure = useCallback(() => {
        const el = ref.current;
        if (!el || expanded) return;
        setOverflows(el.scrollHeight > el.clientHeight + 1);
    }, [expanded]);

    useEffect(() => {
        setExpanded(false);
    }, [text]);

    useEffect(() => {
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [measure, text]);

    const showToggle = overflows || expanded;

    return (
        <Tag className="min-w-0">
            <span ref={ref} className={[textClassName, expanded ? '' : clampClass].filter(Boolean).join(' ')}>
                {text}
            </span>
            {showToggle && (
                <>
                    {' '}
                    <button
                        type="button"
                        onClick={e => {
                            e.stopPropagation();
                            setExpanded(v => !v);
                        }}
                        className={moreClassName}
                    >
                        {expanded ? 'less' : 'more'}
                    </button>
                </>
            )}
        </Tag>
    );
};

export default ClampedTextWithMore;
