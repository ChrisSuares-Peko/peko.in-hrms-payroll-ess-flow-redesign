import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import CardCarousel from '../../../components/common/CardCarousel';
import { CardData } from '../../../utils/types';

// -- PekoCard ----------------------------------------------------------------
vi.mock('../../../components/common/PekoCard', () => ({
    default: ({ card }: { card: CardData }) => (
        <div data-testid="peko-card" data-last4={card.last4}>
            {card.holder}
        </div>
    ),
}));

// -- test helpers ------------------------------------------------------------
const makeCards = (count: number): CardData[] =>
    Array.from({ length: count }, (_, i) => ({
        key: `k${i + 1}`,
        holder: `Holder ${i + 1}`,
        last4: `000${i + 1}`,
        used: 1000 * (i + 1),
        limit: 10000,
    }));

/** Index of the dot currently flagged active. */
const activeDot = () =>
    screen.getAllByTestId('carousel-dot').findIndex(d => d.getAttribute('data-active') === 'true');

/**
 * Simulate a horizontal drag across the viewport. jsdom implements no PointerEvent, so
 * fireEvent.pointerDown drops clientX — dispatch a plain bubbling event carrying the coordinates
 * instead, which React still surfaces to its onPointer* handlers.
 */
const firePointer = (el: Element, type: string, clientX: number) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.assign(event, { pointerId: 1, pointerType: 'touch', button: 0, clientX, clientY: 0 });
    fireEvent(el, event);
};

const drag = (dx: number) => {
    const viewport = screen.getByRole('group');
    firePointer(viewport, 'pointerdown', 200);
    firePointer(viewport, 'pointermove', 200 + dx);
    firePointer(viewport, 'pointerup', 200 + dx);
};

describe('CardCarousel', () => {
    beforeEach(() => vi.clearAllMocks());

    describe('rendering', () => {
        it('renders nothing when there are no cards', () => {
            const { container } = render(<CardCarousel cards={[]} />);
            expect(container).toBeEmptyDOMElement();
        });

        it('renders a single card with no arrows, dots or drag affordance', () => {
            render(<CardCarousel cards={makeCards(1)} />);
            expect(screen.getAllByTestId('peko-card')).toHaveLength(1);
            expect(screen.queryByTestId('carousel-prev')).toBeNull();
            expect(screen.queryByTestId('carousel-next')).toBeNull();
            expect(screen.queryAllByTestId('carousel-dot')).toHaveLength(0);
        });

        it('renders each card plus one edge clone at either end, and defaults to the second card', () => {
            render(<CardCarousel cards={makeCards(3)} />);
            expect(screen.getAllByTestId('peko-card')).toHaveLength(5);
            expect(activeDot()).toBe(1);
        });

        it('announces the active card position to screen readers', () => {
            render(<CardCarousel cards={makeCards(4)} />);
            expect(screen.getByText('Card 2 of 4')).toBeInTheDocument();
        });
    });

    describe('navigation', () => {
        it('advances with the next arrow and goes back with the previous arrow', () => {
            render(<CardCarousel cards={makeCards(3)} />);
            fireEvent.click(screen.getByTestId('carousel-next'));
            expect(activeDot()).toBe(2);
            fireEvent.click(screen.getByTestId('carousel-prev'));
            expect(activeDot()).toBe(1);
        });

        it('disables the previous arrow on the first card and stops there', () => {
            render(<CardCarousel cards={makeCards(3)} />);
            fireEvent.click(screen.getByTestId('carousel-prev')); // 2nd → 1st
            expect(activeDot()).toBe(0);
            expect(screen.getByTestId('carousel-prev')).toBeDisabled();

            fireEvent.click(screen.getByTestId('carousel-prev')); // no-op
            expect(activeDot()).toBe(0);
        });

        it('disables the next arrow on the last card and stops there', () => {
            render(<CardCarousel cards={makeCards(3)} />);
            fireEvent.click(screen.getByTestId('carousel-next')); // 2nd → 3rd
            expect(activeDot()).toBe(2);
            expect(screen.getByTestId('carousel-next')).toBeDisabled();

            fireEvent.click(screen.getByTestId('carousel-next')); // no-op
            expect(activeDot()).toBe(2);
        });

        it('keeps both arrows enabled on a middle card', () => {
            render(<CardCarousel cards={makeCards(3)} />);
            expect(screen.getByTestId('carousel-prev')).not.toBeDisabled();
            expect(screen.getByTestId('carousel-next')).not.toBeDisabled();
        });

        it('jumps straight to a card when its dot is clicked', () => {
            render(<CardCarousel cards={makeCards(4)} />);
            fireEvent.click(screen.getAllByTestId('carousel-dot')[3]);
            expect(activeDot()).toBe(3);
        });

        it('reports the active index to the parent', () => {
            const onActiveIndexChange = vi.fn();
            render(<CardCarousel cards={makeCards(3)} onActiveIndexChange={onActiveIndexChange} />);
            expect(onActiveIndexChange).toHaveBeenLastCalledWith(1);
            fireEvent.click(screen.getByTestId('carousel-next'));
            expect(onActiveIndexChange).toHaveBeenLastCalledWith(2);
        });
    });

    describe('keyboard', () => {
        it('is focusable and moves with the arrow keys', () => {
            render(<CardCarousel cards={makeCards(3)} />);
            const viewport = screen.getByRole('group');
            expect(viewport).toHaveAttribute('tabIndex', '0');

            fireEvent.keyDown(viewport, { key: 'ArrowRight' });
            expect(activeDot()).toBe(2);
            fireEvent.keyDown(viewport, { key: 'ArrowLeft' });
            expect(activeDot()).toBe(1);
        });

        it('jumps to the first and last card with Home and End', () => {
            render(<CardCarousel cards={makeCards(4)} />);
            const viewport = screen.getByRole('group');

            fireEvent.keyDown(viewport, { key: 'End' });
            expect(activeDot()).toBe(3);
            fireEvent.keyDown(viewport, { key: 'Home' });
            expect(activeDot()).toBe(0);
        });

        it('ignores unrelated keys', () => {
            render(<CardCarousel cards={makeCards(3)} />);
            fireEvent.keyDown(screen.getByRole('group'), { key: 'Enter' });
            expect(activeDot()).toBe(1);
        });
    });

    describe('swipe / drag', () => {
        it('advances on a leftward swipe', () => {
            render(<CardCarousel cards={makeCards(3)} />);
            drag(-80);
            expect(activeDot()).toBe(2);
        });

        it('goes back on a rightward swipe', () => {
            render(<CardCarousel cards={makeCards(3)} />);
            drag(80);
            expect(activeDot()).toBe(0);
        });

        it('ignores a drag shorter than the swipe threshold', () => {
            render(<CardCarousel cards={makeCards(3)} />);
            drag(-10);
            expect(activeDot()).toBe(1);
        });
    });

    describe('when the card list changes', () => {
        it('clamps the active card into range when the list shrinks', () => {
            const { rerender } = render(<CardCarousel cards={makeCards(5)} />);
            fireEvent.click(screen.getAllByTestId('carousel-dot')[4]);
            expect(activeDot()).toBe(4);

            // A card is terminated and the parent refetches with a shorter list.
            rerender(<CardCarousel cards={makeCards(2)} />);
            expect(screen.getAllByTestId('carousel-dot')).toHaveLength(2);
            expect(activeDot()).toBe(1);
        });

        it('falls back to the single-card layout when only one card remains', () => {
            const { rerender } = render(<CardCarousel cards={makeCards(3)} />);
            rerender(<CardCarousel cards={makeCards(1)} />);
            expect(screen.getAllByTestId('peko-card')).toHaveLength(1);
            expect(screen.queryAllByTestId('carousel-dot')).toHaveLength(0);
        });
    });

    describe('peeked cards', () => {
        const peekOverlays = () =>
            screen
                .getAllByRole('button', { hidden: true })
                .filter(b => b.className.includes('absolute inset-0'));

        it('brings a peeked card forward when it is clicked', () => {
            render(<CardCarousel cards={makeCards(4)} />);
            // Active is card 2, so the real peeks are cards 1 and 3 (clones are not clickable).
            expect(peekOverlays()).toHaveLength(3);

            fireEvent.click(peekOverlays()[0]); // card 1
            expect(activeDot()).toBe(0);
        });

        it('does not make the decorative edge clones clickable', () => {
            // The clone peeks would otherwise jump to the opposite end of the list, straight past the
            // arrow that is disabled there.
            render(<CardCarousel cards={makeCards(3)} />);
            fireEvent.click(screen.getByTestId('carousel-prev')); // → first card, prev now disabled
            expect(activeDot()).toBe(0);

            // Only the real neighbour (card 2) is clickable; the left peek is the last card's clone.
            const overlays = peekOverlays();
            expect(overlays).toHaveLength(2);
            fireEvent.click(overlays[0]);
            expect(activeDot()).toBe(1);
        });
    });

    describe('aborted gestures', () => {
        it('does not change the card when the browser cancels the gesture mid-drag', () => {
            // pointercancel is what fires when the browser claims the gesture for a vertical page scroll —
            // it must not be committed as a swipe.
            render(<CardCarousel cards={makeCards(3)} />);
            const viewport = screen.getByRole('group');
            firePointer(viewport, 'pointerdown', 200);
            firePointer(viewport, 'pointermove', 120); // 80px left, past the threshold
            firePointer(viewport, 'pointercancel', 120);
            expect(activeDot()).toBe(1);
        });
    });
});
