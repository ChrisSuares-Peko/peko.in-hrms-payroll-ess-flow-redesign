import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useDashboardNav } from '../../../components/common/dashboardNav';
import MyCardsPanel from '../../../components/corporate/MyCardsPanel';
import { MyCard } from '../../../utils/types';

// ── SVG assets ──────────────────────────────────────────────────────────
vi.mock('../../../assets/icons/noCard.svg', () => ({ default: 'noCard.svg' }));

// ── dashboardNav hook ───────────────────────────────────────────────────
vi.mock('../../../components/common/dashboardNav', () => ({
    useDashboardNav: vi.fn(),
    DashboardNavProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── PekoCard ─────────────────────────────────────────────────────────────
vi.mock('../../../components/common/PekoCard', () => ({
    default: ({ card }: { card: MyCard }) => (
        <div data-testid="peko-card" data-holder={card.holder} data-last4={card.last4}>
            {card.holder}
        </div>
    ),
}));

// ── test helpers ─────────────────────────────────────────────────────────
const makeCard = (overrides: Partial<MyCard> = {}): MyCard => ({
    key: '1',
    holder: 'Alice Johnson',
    last4: '1234',
    balance: '₹0',
    used: 5000,
    limit: 15000,
    kind: 'Virtual Card',
    status: 'Active',
    ...overrides,
});

describe('MyCardsPanel', () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useDashboardNav as unknown as Mock).mockReturnValue(mockNavigate);
    });

    // ── Card limit value ────────────────────────────────────────────────
    describe('Card limit value', () => {
        it('shows the card spend limit, not the wallet balance', () => {
            render(
                <MyCardsPanel cards={[makeCard({ balance: '₹0', limit: 15000 })]} activeCount={1} />
            );
            expect(screen.getByText('Card limit')).toBeInTheDocument();
            expect(screen.getByText('₹15,000')).toBeInTheDocument();
        });

        it('still shows the spend limit when the wallet balance is zero', () => {
            render(
                <MyCardsPanel
                    cards={[makeCard({ balance: '₹0', limit: 15000, used: 15000 })]}
                    activeCount={1}
                />
            );
            expect(screen.queryByText('₹0')).toBeNull();
            expect(screen.getByText('₹15,000')).toBeInTheDocument();
            expect(screen.getByText(/Spend Limit: ₹15,000/)).toBeInTheDocument();
        });

        it('matches the "Spend Limit" value shown below the utilisation bar', () => {
            render(
                <MyCardsPanel
                    cards={[makeCard({ balance: '₹0', limit: 50000, used: 10000 })]}
                    activeCount={1}
                />
            );
            const limitTexts = screen.getAllByText('₹50,000');
            expect(limitTexts.length).toBeGreaterThanOrEqual(1);
            expect(screen.getByText(/Spend Limit: ₹50,000/)).toBeInTheDocument();
        });

        it('does not render a Card limit value when there are no cards', () => {
            render(<MyCardsPanel cards={[]} activeCount={0} />);
            expect(screen.queryByText('Card limit')).toBeNull();
        });
    });

    // ── carousel ─────────────────────────────────────────────────────────
    describe('card carousel', () => {
        it('renders every card on the sliding track plus one edge clone at each end', () => {
            const cards = [
                makeCard({ key: '1', holder: 'Alice Johnson', last4: '1234' }),
                makeCard({ key: '2', holder: 'Bob Smith', last4: '5678' }),
            ];
            render(<MyCardsPanel cards={cards} activeCount={2} />);
            // 2 real cards + a leading clone (last card) + a trailing clone (first card)
            expect(screen.getAllByTestId('peko-card')).toHaveLength(4);
        });

        it('renders nav arrows and a dot per card when there is more than one card', () => {
            const cards = [
                makeCard({ key: '1', holder: 'Alice Johnson', last4: '1234' }),
                makeCard({ key: '2', holder: 'Bob Smith', last4: '5678' }),
            ];
            render(<MyCardsPanel cards={cards} activeCount={2} />);
            expect(screen.getAllByTestId('carousel-dot')).toHaveLength(2);
            expect(screen.getByTestId('carousel-prev')).toBeInTheDocument();
            expect(screen.getByTestId('carousel-next')).toBeInTheDocument();
        });

        it('renders a single card without arrows or dots', () => {
            render(<MyCardsPanel cards={[makeCard()]} activeCount={1} />);
            expect(screen.getAllByTestId('peko-card')).toHaveLength(1);
            expect(screen.queryAllByTestId('carousel-dot')).toHaveLength(0);
            expect(screen.queryByTestId('carousel-prev')).toBeNull();
            expect(screen.queryByTestId('carousel-next')).toBeNull();
        });

        it('disables the previous arrow on the first card and the next arrow on the last', () => {
            const cards = [
                makeCard({ key: '1', holder: 'Alice Johnson', last4: '1234' }),
                makeCard({ key: '2', holder: 'Bob Smith', last4: '5678' }),
                makeCard({ key: '3', holder: 'Carol Doe', last4: '9012' }),
            ];
            render(<MyCardsPanel cards={cards} activeCount={3} />);
            // defaults to the second card, so both arrows are live
            expect(screen.getByTestId('carousel-prev')).not.toBeDisabled();
            expect(screen.getByTestId('carousel-next')).not.toBeDisabled();

            fireEvent.click(screen.getByTestId('carousel-prev')); // → first card
            expect(screen.getByTestId('carousel-prev')).toBeDisabled();

            fireEvent.click(screen.getByTestId('carousel-next')); // → second
            fireEvent.click(screen.getByTestId('carousel-next')); // → third (last)
            expect(screen.getByTestId('carousel-next')).toBeDisabled();
        });

        it('switches the shown card details when a dot is clicked', () => {
            const cards = [
                makeCard({ key: '1', holder: 'Alice Johnson', last4: '1234', limit: 15000 }),
                makeCard({ key: '2', holder: 'Bob Smith', last4: '5678', limit: 40000 }),
            ];
            render(<MyCardsPanel cards={cards} activeCount={2} />);
            // defaults to the second card
            expect(screen.getByText('₹40,000')).toBeInTheDocument();
            fireEvent.click(screen.getAllByTestId('carousel-dot')[0]);
            expect(screen.getByText('₹15,000')).toBeInTheDocument();
        });
    });

    // ── actions ──────────────────────────────────────────────────────────
    describe('actions', () => {
        it('calls onTopup with the active card when Limit Increase is clicked', () => {
            const onTopup = vi.fn();
            const card = makeCard();
            render(<MyCardsPanel cards={[card]} activeCount={1} onTopup={onTopup} />);
            fireEvent.click(screen.getByText('Limit Increase'));
            expect(onTopup).toHaveBeenCalledWith(card);
        });

        // ADO 29145 — "View Details" was wired to the same handler as "View all cards", so both
        // navigated to the cards list instead of showing just the selected card. It should instead open
        // that card's vendor-hosted view link, matching the Cards page's own "View Details" (MyCardsTab.tsx).
        it("opens the active card's vendor-hosted view link when View Details is clicked", () => {
            const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
            const card = makeCard({ cardViewLink: 'https://pinelabs.example/card/123' });
            render(<MyCardsPanel cards={[card]} activeCount={1} />);

            fireEvent.click(screen.getByText('View Details'));

            expect(openSpy).toHaveBeenCalledWith(
                'https://pinelabs.example/card/123',
                '_blank',
                'noopener,noreferrer'
            );
            openSpy.mockRestore();
        });

        it('does not navigate to the cards list or call onViewAll when View Details is clicked', () => {
            const onViewAll = vi.fn();
            const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
            render(
                <MyCardsPanel
                    cards={[makeCard({ cardViewLink: 'https://pinelabs.example/card/123' })]}
                    activeCount={1}
                    onViewAll={onViewAll}
                />
            );

            fireEvent.click(screen.getByText('View Details'));

            expect(onViewAll).not.toHaveBeenCalled();
            expect(mockNavigate).not.toHaveBeenCalled();
            openSpy.mockRestore();
        });

        it('does not open a window when the active card has no cardViewLink', () => {
            const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
            render(
                <MyCardsPanel cards={[makeCard({ cardViewLink: undefined })]} activeCount={1} />
            );

            fireEvent.click(screen.getByText('View Details'));

            expect(openSpy).not.toHaveBeenCalled();
            openSpy.mockRestore();
        });

        it('targets the ACTIVE card, not the first one, for Limit Increase and View Details', () => {
            // With several cards the carousel opens on the second, so both actions must act on that card.
            const onTopup = vi.fn();
            const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
            const cards = [
                makeCard({ key: '1', last4: '1111', cardViewLink: 'https://x.example/1' }),
                makeCard({ key: '2', last4: '2222', cardViewLink: 'https://x.example/2' }),
                makeCard({ key: '3', last4: '3333', cardViewLink: 'https://x.example/3' }),
            ];
            render(<MyCardsPanel cards={cards} activeCount={3} onTopup={onTopup} />);

            fireEvent.click(screen.getByText('Limit Increase'));
            expect(onTopup).toHaveBeenCalledWith(cards[1]);

            fireEvent.click(screen.getByText('View Details'));
            expect(openSpy).toHaveBeenCalledWith(
                'https://x.example/2',
                '_blank',
                'noopener,noreferrer'
            );

            // Advance a card — the actions follow.
            fireEvent.click(screen.getByTestId('carousel-next'));
            fireEvent.click(screen.getByText('Limit Increase'));
            expect(onTopup).toHaveBeenLastCalledWith(cards[2]);
            openSpy.mockRestore();
        });

        it('disables Limit Increase for a frozen card', () => {
            // ADO 29027 — the Cards page disables Limit Increase for frozen cards
            // (MyCardCard.tsx); the Dashboard widget must match.
            const onTopup = vi.fn();
            render(
                <MyCardsPanel
                    cards={[makeCard({ status: 'Frozen' })]}
                    activeCount={0}
                    onTopup={onTopup}
                />
            );
            expect(screen.getByText('Limit Increase').closest('button')).toBeDisabled();
            fireEvent.click(screen.getByText('Limit Increase'));
            expect(onTopup).not.toHaveBeenCalled();
        });

        it('keeps Limit Increase enabled for an active card', () => {
            const onTopup = vi.fn();
            const card = makeCard({ status: 'Active' });
            render(<MyCardsPanel cards={[card]} activeCount={1} onTopup={onTopup} />);
            expect(screen.getByText('Limit Increase').closest('button')).not.toBeDisabled();
            fireEvent.click(screen.getByText('Limit Increase'));
            expect(onTopup).toHaveBeenCalledWith(card);
        });
    });

    // ── empty state ──────────────────────────────────────────────────────
    describe('empty state', () => {
        it('shows the "No cards found" message when cards is empty', () => {
            render(<MyCardsPanel cards={[]} activeCount={0} />);
            expect(screen.getByText('No cards found')).toBeInTheDocument();
        });
    });
});
