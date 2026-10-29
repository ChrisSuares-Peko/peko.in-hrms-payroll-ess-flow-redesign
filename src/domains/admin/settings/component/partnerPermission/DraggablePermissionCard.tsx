import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { DownOutlined, HolderOutlined, RightOutlined } from '@ant-design/icons';
import { Card, Flex } from 'antd';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

export const PERMISSION_DND_TYPE = 'PARTNER_PERMISSION_CARD';

interface DragItem {
    index: number;
}

interface DraggablePermissionCardProps {
    index: number;
    movePermission: (dragIndex: number, hoverIndex: number) => void;
    children: React.ReactNode;
    // When provided, the card shows this row permanently (grip + this header) and
    // makes `children` collapsible behind an expand/collapse chevron. Without it the
    // whole card stays expanded (legacy behaviour).
    header?: React.ReactNode;
    defaultOpen?: boolean;
}

// Walk up from the card to the nearest vertically-scrollable ancestor (the modal
// body). The HTML5 drag backend doesn't auto-scroll containers, so we scroll it
// ourselves when the cursor nears an edge — otherwise cards outside the viewport
// can't be reached to drop.
//
// This forces a style recalculation per ancestor, so it must NOT run per drag event.
// It's resolved once, when a drag starts.
const getScrollableParent = (node: HTMLElement | null): HTMLElement | null => {
    let current = node?.parentElement ?? null;
    while (current) {
        const { overflowY } = window.getComputedStyle(current);
        if (
            (overflowY === 'auto' || overflowY === 'scroll') &&
            current.scrollHeight > current.clientHeight
        ) {
            return current;
        }
        current = current.parentElement;
    }
    return null;
};

// Distance (px) from an edge within which dragging auto-scrolls, and the fastest
// it will scroll (px per animation frame) once the cursor reaches the very edge.
const SCROLL_EDGE = 72;
const MAX_SCROLL_SPEED = 16;

// How long a displaced card takes to glide to its new slot.
const FLIP_MS = 160;

const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;

// A single permission card that can be dragged (by its grip handle) up/down to
// reorder the permissions list. Reordering happens live on hover — once the cursor
// crosses a neighbour's midpoint the two swap — which is what drives the saved
// order (and therefore the sidebar structure). Only the grip initiates a drag, so
// the switches / checkboxes / icon field inside stay fully interactive.
const DraggablePermissionCard = ({
    index,
    movePermission,
    children,
    header,
    defaultOpen = false,
}: DraggablePermissionCardProps) => {
    // Outer node is the drop target; its box is never transformed, so hover
    // hit-testing always reads true layout position.
    const ref = useRef<HTMLDivElement>(null);
    // Inner node carries the glide animation only — purely visual.
    const flipRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLSpanElement>(null);
    const [open, setOpen] = useState(defaultOpen);
    const collapsible = header != null;

    const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({
        accept: PERMISSION_DND_TYPE,
        collect: monitor => ({ handlerId: monitor.getHandlerId() }),
        hover(item, monitor) {
            if (!ref.current) return;

            const dragIndex = item.index;
            const hoverIndex = index;
            // Cheapest check first — most hover events are over the dragged card
            // itself and can be dropped before touching the DOM at all.
            if (dragIndex === hoverIndex) return;

            const clientOffset = monitor.getClientOffset();
            if (!clientOffset) return;

            const hoverRect = ref.current.getBoundingClientRect();
            const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2;
            const hoverClientY = clientOffset.y - hoverRect.top;

            // Only swap once the cursor passes the item's midpoint so the reorder
            // doesn't flicker back and forth while hovering a single item.
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

            movePermission(dragIndex, hoverIndex);
            // Mutating the monitored item avoids repeated swaps for the same hover.
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag, preview] = useDrag({
        type: PERMISSION_DND_TYPE,
        item: () => ({ index }),
        collect: monitor => ({ isDragging: monitor.isDragging() }),
    });

    // Hide the browser's default (semi-transparent, laggy) drag snapshot. Instead the
    // real card dims (opacity) and the list reflows live under the cursor, which is
    // the smooth "sortable" feel.
    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, [preview]);

    // Edge auto-scroll, driven by the dragged card only.
    //
    // Previously this lived in `hover()`, which meant it (a) re-resolved the
    // scrollable ancestor on every drag event, and (b) only scrolled when the
    // pointer moved — hold the cursor at the edge and the list stopped. Here the
    // scroll parent is resolved once per drag and a rAF loop scrolls continuously
    // at a speed proportional to how deep into the edge zone the cursor is.
    useEffect(() => {
        if (!isDragging) return undefined;

        const scrollParent = getScrollableParent(ref.current);
        if (!scrollParent) return undefined;

        let pointerY: number | null = null;
        let frame = 0;

        const trackPointer = (event: DragEvent) => {
            pointerY = event.clientY;
        };

        const step = () => {
            frame = requestAnimationFrame(step);
            if (pointerY == null) return;

            const rect = scrollParent.getBoundingClientRect();
            const fromTop = pointerY - rect.top;
            const fromBottom = rect.bottom - pointerY;

            // Ease in over the edge zone so a shallow hover creeps and a deep one races.
            if (fromTop < SCROLL_EDGE) {
                const depth = Math.min(SCROLL_EDGE, SCROLL_EDGE - fromTop) / SCROLL_EDGE;
                scrollParent.scrollTop -= Math.ceil(depth * MAX_SCROLL_SPEED);
            } else if (fromBottom < SCROLL_EDGE) {
                const depth = Math.min(SCROLL_EDGE, SCROLL_EDGE - fromBottom) / SCROLL_EDGE;
                scrollParent.scrollTop += Math.ceil(depth * MAX_SCROLL_SPEED);
            }
        };

        document.addEventListener('dragover', trackPointer);
        frame = requestAnimationFrame(step);

        return () => {
            document.removeEventListener('dragover', trackPointer);
            cancelAnimationFrame(frame);
        };
    }, [isDragging]);

    // FLIP: when a swap moves this card to a new slot it would otherwise jump there
    // instantly. Measure the shift, apply it as an inverse transform, then release it
    // — so displaced cards glide out of the way instead of snapping.
    const lastTop = useRef<number | null>(null);
    const lastIndex = useRef(index);
    useLayoutEffect(() => {
        const node = flipRef.current;
        if (!node) return;

        const { top } = node.getBoundingClientRect();
        const previousTop = lastTop.current;
        // `top` is viewport-relative, and this list lives in a scrollable modal body
        // — so scrolling shifts it just as much as a reorder does. Without this gate
        // any re-render after a scroll (e.g. ticking a checkbox) measured the scroll
        // distance as a "move" and yanked the card back under the cursor, which both
        // looked like a flicker and could swallow the click that caused it.
        const changedSlot = lastIndex.current !== index;
        lastTop.current = top;
        lastIndex.current = index;

        // Nothing to animate on first paint, when this card kept its slot, for the
        // card under the cursor (it tracks the pointer, not a slot), or when the user
        // opts out of motion.
        if (previousTop === null || !changedSlot || isDragging || prefersReducedMotion()) return;

        const delta = previousTop - top;
        if (Math.abs(delta) < 1) return;

        node.style.transition = 'none';
        node.style.transform = `translateY(${delta}px)`;

        requestAnimationFrame(() => {
            node.style.transition = `transform ${FLIP_MS}ms cubic-bezier(0.2, 0, 0, 1)`;
            node.style.transform = '';
        });
    });

    // Whole card is the drop target; only the grip starts a drag.
    drop(ref);
    drag(handleRef);

    return (
        <div ref={ref} data-handler-id={handlerId}>
            <div ref={flipRef} style={{ willChange: 'transform' }}>
                <Card
                    size="small"
                    className={`mb-4 rounded-lg border ${
                        isDragging
                            ? 'border-brandColor opacity-40 shadow-lg'
                            : 'border-borderGray transition-shadow duration-150 hover:shadow-md'
                    }`}
                >
                    {collapsible ? (
                        <>
                            <Flex align="center" gap={10}>
                                <span
                                    ref={handleRef}
                                    title="Drag to reorder"
                                    className="flex cursor-grab text-textGrey transition-colors hover:text-brandColor active:cursor-grabbing"
                                >
                                    <HolderOutlined className="text-base" />
                                </span>
                                <div className="min-w-0 flex-1">{header}</div>
                                <span
                                    role="button"
                                    tabIndex={0}
                                    title={open ? 'Collapse' : 'Expand'}
                                    onClick={() => setOpen(prev => !prev)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' || e.key === ' ')
                                            setOpen(prev => !prev);
                                    }}
                                    className="flex cursor-pointer text-textGrey transition-colors hover:text-brandColor"
                                >
                                    {open ? <DownOutlined /> : <RightOutlined />}
                                </span>
                            </Flex>
                            {open && <div className="mt-3">{children}</div>}
                        </>
                    ) : (
                        <Flex align="flex-start" gap={10}>
                            <span
                                ref={handleRef}
                                title="Drag to reorder"
                                className="mt-1 flex cursor-grab text-textGrey transition-colors hover:text-brandColor active:cursor-grabbing"
                            >
                                <HolderOutlined className="text-base" />
                            </span>
                            <div className="min-w-0 flex-1">{children}</div>
                        </Flex>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default DraggablePermissionCard;
