import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { LeftOutlined, RightOutlined } from '@ant-design/icons';

import PekoCard from './PekoCard';
import { cn } from '../../utils/cn';
import { CardData } from '../../utils/types';

interface CardCarouselProps {
    cards: CardData[];
    /** Notified whenever the centred card changes, so the parent can show that card's details. */
    onActiveIndexChange?: (index: number) => void;
    className?: string;
}

/** Each slide occupies this share of the panel width; the rest is the peek of the two neighbours. */
const SLIDE_PCT = 76;
/** A drag must cover this share of the viewport (or MIN_SWIPE_PX) before it advances a card. */
const SWIPE_RATIO = 0.12;
const MIN_SWIPE_PX = 40;

/** Respect the OS "reduce motion" setting: land on the next card without sliding. */
const usePrefersReducedMotion = () => {
    const query = '(prefers-reduced-motion: reduce)';
    const [reduced, setReduced] = useState(
        () => (typeof window !== 'undefined' && window.matchMedia?.(query)?.matches) ?? false
    );

    useEffect(() => {
        const mq = typeof window !== 'undefined' ? window.matchMedia?.(query) : undefined;
        if (!mq?.addEventListener) return undefined;
        const onChange = () => setReduced(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    return reduced;
};

/**
 * Card carousel: the active card sits centred and larger, with the previous/next card peeking on either
 * side. The track also carries a clone of the last card at the front and of the first card at the back —
 * purely so the first and last card still show a peek on their outer side and therefore look identical to
 * the ones in the middle. Navigation itself is bounded: the arrows stop (and disable) at either end.
 *
 * `renderIndex` addresses the track: 1..total are the real cards (0 and total+1 are the visual-only clones).
 * It starts at 2 — the carousel deliberately opens on the SECOND card, so the parent's default action target
 * is card 2 as well. With exactly two cards that means opening on the last one, with Next already disabled.
 *
 * Navigation: drag/swipe, the arrows, the dots, clicking a peek, or the arrow keys when focused.
 */
const CardCarousel = ({ cards, onActiveIndexChange, className }: CardCarouselProps) => {
    const total = cards.length;
    const [renderIndex, setRenderIndex] = useState(() => (cards.length > 1 ? 2 : 1));
    const [dragDx, setDragDx] = useState(0);
    const [dragging, setDragging] = useState(false);
    const didInit = useRef(false);
    const dragStart = useRef<{ x: number; pointerId: number } | null>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const reducedMotion = usePrefersReducedMotion();

    const activeIndex = total > 1 ? (((renderIndex - 1) % total) + total) % total : 0;
    const slides = total > 1 ? [cards[total - 1], ...cards, cards[0]] : cards;
    const atFirst = activeIndex === 0;
    const atLast = activeIndex === total - 1;

    useEffect(() => {
        if (didInit.current || total < 2) return;
        didInit.current = true;
        setRenderIndex(2);
    }, [total]);

    useLayoutEffect(() => {
        setRenderIndex(prev => {
            if (total < 2) return 1;
            return Math.min(Math.max(prev, 1), total);
        });
    }, [total]);

    const notifyRef = useRef(onActiveIndexChange);
    notifyRef.current = onActiveIndexChange;
    useLayoutEffect(() => {
        notifyRef.current?.(activeIndex);
    }, [activeIndex]);

    /** Direct jump (dots, peek click, Home/End). */
    const goToCard = (index: number) => {
        if (total < 2) return;
        setRenderIndex(Math.min(Math.max(index, 0), total - 1) + 1);
    };

    /** Step one card, stopping at either end. */
    const stepCard = (dir: 1 | -1) => {
        if (total < 2) return;
        setRenderIndex(prev => Math.min(Math.max(prev + dir, 1), total));
    };

    /* ---- drag / swipe ------------------------------------------------------------------------ */
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (total < 2) return;
        if ((e.target as HTMLElement).closest('button')) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        dragStart.current = { x: e.clientX, pointerId: e.pointerId };
        setDragging(true);
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const start = dragStart.current;
        if (!start || start.pointerId !== e.pointerId) return;
        const width = viewportRef.current?.clientWidth ?? 0;
        const raw = e.clientX - start.x;
        if (width <= 0) {
            setDragDx(raw);
            return;
        }
        const slide = width * (SLIDE_PCT / 100);
        const maxRight = atFirst ? width * 0.06 : slide;
        const maxLeft = atLast ? width * 0.06 : slide;
        setDragDx(Math.max(Math.min(raw, maxRight), -maxLeft));
    };

    /** Finger lifted — commit the swipe if it cleared the threshold. */
    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
        const start = dragStart.current;
        if (!start || start.pointerId !== e.pointerId) return;
        dragStart.current = null;
        setDragging(false);
        const dx = dragDx;
        setDragDx(0);
        const width = viewportRef.current?.clientWidth ?? 0;
        const threshold = Math.max(MIN_SWIPE_PX, width * SWIPE_RATIO);
        if (dx <= -threshold) stepCard(1);
        else if (dx >= threshold) stepCard(-1);
    };

    /**
     * The browser took the gesture over (it decided this is a vertical page scroll, or a system gesture
     * kicked in). That is an abort, not a swipe: snap back without changing the card, otherwise scrolling
     * the dashboard on a phone would silently reselect a card — and with it the Balance/Limit shown and
     * what Manage / Audit Trail / Limit Increase act on.
     */
    const cancelDrag = (e: React.PointerEvent<HTMLDivElement>) => {
        const start = dragStart.current;
        if (!start || start.pointerId !== e.pointerId) return;
        dragStart.current = null;
        setDragging(false);
        setDragDx(0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (total < 2) return;
        const actions: Record<string, () => void> = {
            ArrowLeft: () => stepCard(-1),
            ArrowRight: () => stepCard(1),
            Home: () => goToCard(0),
            End: () => goToCard(total - 1),
        };
        const action = actions[e.key];
        if (!action) return;
        e.preventDefault();
        action();
    };

    const trackOffsetPct =
        total > 1
            ? ((renderIndex * SLIDE_PCT - (100 - SLIDE_PCT) / 2) / ((total + 2) * SLIDE_PCT)) * 100
            : 0;
    const slideTransition = !dragging && !reducedMotion;
    const arrowClasses =
        "absolute top-1/2 z-10 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-textHeadings shadow-md transition before:absolute before:-inset-2.5 before:content-[''] hover:bg-listBg focus-visible:ring-2 focus-visible:ring-textLightRed disabled:cursor-not-allowed disabled:opacity-40";

    if (total === 0) return null;

    return (
        <div className={cn('flex flex-col gap-3.5', className)}>
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <div
                ref={viewportRef}
                role="group"
                aria-roledescription="carousel"
                aria-label="Cards"
                tabIndex={total > 1 ? 0 : undefined}
                onKeyDown={handleKeyDown}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={cancelDrag}
                className={cn(
                    'relative overflow-hidden py-1 outline-none',
                    total > 1 && 'cursor-grab focus-visible:ring-2 focus-visible:ring-textLightRed',
                    dragging && 'cursor-grabbing select-none'
                )}
                style={total > 1 ? { touchAction: 'pan-y pinch-zoom' } : undefined}
            >
                {total > 1 ? (
                    <div
                        data-testid="carousel-track"
                        className={cn(
                            'flex',
                            slideTransition && 'transition-transform duration-300 ease-out'
                        )}
                        style={{
                            width: `${(total + 2) * SLIDE_PCT}%`,
                            transform: `translateX(calc(-${trackOffsetPct}% + ${dragDx}px))`,
                        }}
                    >
                        {slides.map((card, k) => {
                            const isActive = k === renderIndex;
                            const isClone = k === 0 || k === total + 1;
                            return (
                                <div
                                    key={`${k}-${card.key}`}
                                    className={cn(
                                        'relative shrink-0 px-px transition-all duration-300',
                                        isActive
                                            ? 'scale-100 opacity-100'
                                            : 'scale-[0.89] opacity-70'
                                    )}
                                    style={{ width: `${100 / (total + 2)}%` }}
                                >
                                    <div
                                        aria-hidden={!isActive}
                                        className={cn(!isActive && 'pointer-events-none')}
                                    >
                                        <PekoCard card={card} className="w-full" />
                                    </div>
                                    {!isActive && !isClone && (
                                        <button
                                            type="button"
                                            aria-hidden
                                            tabIndex={-1}
                                            onClick={() => goToCard(k - 1)}
                                            className="absolute inset-0 cursor-pointer rounded-2xl border-0 bg-transparent p-0"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="mx-auto w-[76%]">
                        <PekoCard card={cards[0]} className="w-full" />
                    </div>
                )}

                {total > 1 && (
                    <>
                        <button
                            type="button"
                            aria-label="Previous card"
                            data-testid="carousel-prev"
                            disabled={atFirst}
                            onClick={() => stepCard(-1)}
                            className={cn(arrowClasses, 'left-[12%]')}
                        >
                            <LeftOutlined className="text-[8px]" />
                        </button>
                        <button
                            type="button"
                            aria-label="Next card"
                            data-testid="carousel-next"
                            disabled={atLast}
                            onClick={() => stepCard(1)}
                            className={cn(arrowClasses, 'left-[88%]')}
                        >
                            <RightOutlined className="text-[8px]" />
                        </button>
                    </>
                )}
            </div>

            {total > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {cards.map((card, index) => (
                        <button
                            key={card.key}
                            type="button"
                            aria-label={`Go to card ${index + 1}`}
                            aria-current={index === activeIndex ? 'true' : undefined}
                            data-testid="carousel-dot"
                            data-active={index === activeIndex}
                            onClick={() => goToCard(index)}
                            className={cn(
                                "relative h-2 rounded-full transition-all before:absolute before:-inset-2 before:content-[''] focus-visible:ring-2 focus-visible:ring-textLightRed focus-visible:ring-offset-2",
                                index === activeIndex ? 'w-5 bg-textLightRed' : 'w-2 bg-listBg'
                            )}
                        />
                    ))}
                </div>
            )}

            <span className="sr-only" aria-live="polite">
                {total > 1 ? `Card ${activeIndex + 1} of ${total}` : ''}
            </span>
        </div>
    );
};

export default CardCarousel;
