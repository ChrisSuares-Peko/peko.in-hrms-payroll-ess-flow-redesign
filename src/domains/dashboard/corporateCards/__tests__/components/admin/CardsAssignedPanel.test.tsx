import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import CardsAssignedPanel from '../../../components/admin/CardsAssignedPanel';
import { useDashboardNav } from '../../../components/common/dashboardNav';
import { CardData, CardRecord } from '../../../utils/types';

// -- SVG assets --------------------------------------------------------------
vi.mock('../../../assets/icons/action.svg', () => ({ default: 'action.svg' }));
vi.mock('../../../assets/icons/trail.svg', () => ({ default: 'trail.svg' }));
vi.mock('../../../assets/icons/noCard.svg', () => ({ default: 'noCard.svg' }));

// -- dashboardNav hook -------------------------------------------------------
vi.mock('../../../components/common/dashboardNav', () => ({
    useDashboardNav: vi.fn(),
    DashboardNavProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// -- PekoCard ----------------------------------------------------------------
vi.mock('../../../components/common/PekoCard', () => ({
    default: ({ card }: { card: CardData }) => (
        <div data-testid="peko-card" data-holder={card.holder} data-last4={card.last4}>
            {card.holder}
        </div>
    ),
}));

// -- SectionCard + ViewAllLink -----------------------------------------------
vi.mock('../../../components/common/SectionCard', () => ({
    default: ({
        title,
        badge,
        action,
        children,
    }: {
        title: string;
        badge?: string;
        action?: React.ReactNode;
        children: React.ReactNode;
    }) => (
        <div data-testid="section-card">
            <span data-testid="section-title">{title}</span>
            {badge && <span data-testid="section-badge">{badge}</span>}
            {action && <div data-testid="section-action">{action}</div>}
            <div data-testid="section-body">{children}</div>
        </div>
    ),
    ViewAllLink: ({ label, onClick }: { label?: string; onClick?: () => void }) => (
        <button type="button" data-testid="view-all-link" onClick={onClick}>
            {label}
        </button>
    ),
}));

// -- AuditTrailModal ---------------------------------------------------------
vi.mock('../../../components/admin/AuditTrailModal', () => ({
    default: ({ open, onClose, last4 }: { open: boolean; onClose: () => void; last4?: string }) =>
        open ? (
            <div data-testid="audit-trail-modal" data-last4={last4 ?? ''}>
                <button type="button" data-testid="audit-modal-close" onClick={onClose}>
                    Close
                </button>
            </div>
        ) : null,
}));

// -- ManageCardModal ---------------------------------------------------------
vi.mock('../../../components/admin/ManageCardModal', () => ({
    default: ({ card, onClose }: { card: CardRecord | null; onClose: () => void }) =>
        card ? (
            <div data-testid="manage-card-modal" data-last4={card.last4}>
                <button type="button" data-testid="manage-modal-close" onClick={onClose}>
                    Close
                </button>
            </div>
        ) : null,
}));

// -- RequestPhysicalCardModal ------------------------------------------------
// CardsAssignedPanel renders RequestPhysicalCardModal directly; stub it to avoid
// redux Provider requirements (the real component calls useAppDispatch).
vi.mock('../../../components/admin/RequestPhysicalCardModal', () => ({
    default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
        open ? (
            <div data-testid="request-physical-modal">
                <button type="button" onClick={onClose}>
                    Close
                </button>
            </div>
        ) : null,
}));

vi.mock('../../../utils/helpers', async importOriginal => ({
    ...(await importOriginal<typeof import('../../../utils/helpers')>()),
    formatRupees: (value: number) => `₹${value}`,
    formatRupeesDecimal: (value: number) => `₹${value}`,
    utilisationPercent: (used: number, limit: number) =>
        limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0,
}));

vi.mock('../../../components/common/StatusTag', () => ({
    default: ({ status }: any) => <span data-testid="card-status-tag">{status}</span>,
}));

// -- test helpers ------------------------------------------------------------
const makeCard = (overrides: Partial<CardData> = {}): CardData => ({
    key: '1',
    holder: 'Alice Johnson',
    last4: '1234',
    used: 5000,
    limit: 10000,
    ...overrides,
});

const makeRecord = (overrides: Partial<CardRecord> = {}): CardRecord => ({
    key: '1',
    holder: 'Alice Johnson',
    last4: '1234',
    department: '-',
    avatarText: 'AJ',
    type: 'Physical',
    status: 'Active',
    cardLimit: 10000,
    perTxnLimit: 5000,
    spent: 5000,
    remaining: 5000,
    ...overrides,
});

/** Builds the matching CardRecord[] for a CardData[] test fixture, keyed the same way
 *  AdminDashboardHome/CardsAssignedPanel match a carousel card to its full record. */
const toRecords = (cards: CardData[]): CardRecord[] =>
    cards.map(c =>
        makeRecord({
            key: c.key,
            holder: c.holder,
            last4: c.last4,
            cardLimit: c.limit,
            spent: c.used,
        })
    );

// -- tests -------------------------------------------------------------------
describe('CardsAssignedPanel', () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useDashboardNav as unknown as Mock).mockReturnValue(mockNavigate);
    });

    // -- section header ------------------------------------------------------
    describe('section header', () => {
        it('renders the section title "Cards Assigned"', () => {
            render(
                <CardsAssignedPanel
                    cards={[makeCard()]}
                    cardRecords={toRecords([makeCard()])}
                    activeCount={1}
                />
            );
            expect(screen.getByTestId('section-title')).toHaveTextContent('Cards Assigned');
        });

        it('renders the active and frozen counts in the badge', () => {
            render(
                <CardsAssignedPanel
                    cards={[makeCard()]}
                    cardRecords={toRecords([makeCard()])}
                    activeCount={3}
                />
            );
            expect(screen.getByTestId('section-badge')).toHaveTextContent(
                '( 3 Active + 0 Frozen )'
            );
        });

        it('renders the "View" link', () => {
            render(
                <CardsAssignedPanel
                    cards={[makeCard()]}
                    cardRecords={toRecords([makeCard()])}
                    activeCount={1}
                />
            );
            expect(screen.getByTestId('view-all-link')).toHaveTextContent('View');
        });

        it('calls navigate("cards") when the view link is clicked', () => {
            render(
                <CardsAssignedPanel
                    cards={[makeCard()]}
                    cardRecords={toRecords([makeCard()])}
                    activeCount={1}
                />
            );
            fireEvent.click(screen.getByTestId('view-all-link'));
            expect(mockNavigate).toHaveBeenCalledWith('cards');
        });
    });

    // -- card carousel -------------------------------------------------------
    describe('card carousel', () => {
        const twoCards = () => [
            makeCard({ key: '1', holder: 'Alice Johnson', last4: '1234' }),
            makeCard({ key: '2', holder: 'Bob Smith', last4: '5678' }),
        ];

        it('renders every card on the sliding track plus one edge clone at each end', () => {
            const cards = [
                makeCard({ key: '1', holder: 'Alice Johnson', last4: '1234' }),
                makeCard({ key: '2', holder: 'Bob Smith', last4: '5678' }),
                makeCard({ key: '3', holder: 'Carol Doe', last4: '9012' }),
            ];
            render(
                <CardsAssignedPanel cards={cards} cardRecords={toRecords(cards)} activeCount={3} />
            );
            // 3 real cards + leading clone (last card) + trailing clone (first card)
            expect(screen.getAllByTestId('peko-card')).toHaveLength(5);
        });

        it('shows the active card and both neighbour peeks by holder name', () => {
            const cards = [
                makeCard({ key: '1', holder: 'Alice Johnson', last4: '1234' }),
                makeCard({ key: '2', holder: 'Bob Smith', last4: '5678' }),
                makeCard({ key: '3', holder: 'Carol Doe', last4: '9012' }),
            ];
            render(
                <CardsAssignedPanel cards={cards} cardRecords={toRecords(cards)} activeCount={3} />
            );
            // default active is the second card, first + third peek on either side (the first and last
            // cards also appear once more as edge clones)
            expect(screen.getByText('Bob Smith')).toBeInTheDocument();
            expect(screen.getAllByText('Alice Johnson').length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText('Carol Doe').length).toBeGreaterThanOrEqual(1);
        });

        it('passes each card last4 through to its PekoCard', () => {
            const cards = [
                makeCard({ key: '1', holder: 'Alice Johnson', last4: '1111' }),
                makeCard({ key: '2', holder: 'Bob Smith', last4: '2222' }),
                makeCard({ key: '3', holder: 'Carol Doe', last4: '3333' }),
            ];
            render(
                <CardsAssignedPanel cards={cards} cardRecords={toRecords(cards)} activeCount={3} />
            );
            const last4s = screen
                .getAllByTestId('peko-card')
                .map(el => el.getAttribute('data-last4'));
            // default active (2nd) card plus its previous/next peeks are on screen
            expect(last4s).toEqual(expect.arrayContaining(['1111', '2222', '3333']));
        });

        it('renders no PekoCard elements when cards is empty', () => {
            render(<CardsAssignedPanel cards={[]} cardRecords={[]} activeCount={0} />);
            expect(screen.queryAllByTestId('peko-card')).toHaveLength(0);
        });

        it('renders a pagination dot per card when there is more than one card', () => {
            const cards = [
                makeCard({ key: '1', holder: 'Alice Johnson', last4: '1234' }),
                makeCard({ key: '2', holder: 'Bob Smith', last4: '5678' }),
                makeCard({ key: '3', holder: 'Carol Doe', last4: '9012' }),
            ];
            render(
                <CardsAssignedPanel cards={cards} cardRecords={toRecords(cards)} activeCount={3} />
            );
            expect(screen.getAllByTestId('carousel-dot')).toHaveLength(3);
        });

        it('does not render pagination dots or nav arrows when there is only one card', () => {
            render(
                <CardsAssignedPanel
                    cards={[makeCard()]}
                    cardRecords={toRecords([makeCard()])}
                    activeCount={1}
                />
            );
            expect(screen.queryAllByTestId('carousel-dot')).toHaveLength(0);
            expect(screen.queryByTestId('carousel-prev')).toBeNull();
            expect(screen.queryByTestId('carousel-next')).toBeNull();
        });

        const threeCards = () => [
            makeCard({ key: '1', holder: 'Alice Johnson', last4: '1234' }),
            makeCard({ key: '2', holder: 'Bob Smith', last4: '5678' }),
            makeCard({ key: '3', holder: 'Carol Doe', last4: '9012' }),
        ];

        it('marks the second dot active by default', () => {
            const cards = twoCards();
            render(
                <CardsAssignedPanel cards={cards} cardRecords={toRecords(cards)} activeCount={2} />
            );
            const dots = screen.getAllByTestId('carousel-dot');
            expect(dots[1]).toHaveAttribute('data-active', 'true');
            expect(dots[0]).toHaveAttribute('data-active', 'false');
        });

        it('marks a dot active when clicked', () => {
            const cards = twoCards();
            render(
                <CardsAssignedPanel cards={cards} cardRecords={toRecords(cards)} activeCount={2} />
            );
            const dots = screen.getAllByTestId('carousel-dot');
            // default is the second card; clicking the first activates it
            fireEvent.click(dots[0]);
            expect(dots[0]).toHaveAttribute('data-active', 'true');
            expect(dots[1]).toHaveAttribute('data-active', 'false');
        });

        it('advances to the next card via the next arrow', () => {
            const cards = threeCards();
            render(
                <CardsAssignedPanel cards={cards} cardRecords={toRecords(cards)} activeCount={3} />
            );
            // default is the second card; next advances to the third
            fireEvent.click(screen.getByTestId('carousel-next'));
            const dots = screen.getAllByTestId('carousel-dot');
            expect(dots[2]).toHaveAttribute('data-active', 'true');
        });

        it('goes back via the prev arrow and stops (disabled) on the first card', () => {
            const cards = threeCards();
            render(
                <CardsAssignedPanel cards={cards} cardRecords={toRecords(cards)} activeCount={3} />
            );
            // default is the second card; prev goes to the first
            fireEvent.click(screen.getByTestId('carousel-prev'));
            const dots = screen.getAllByTestId('carousel-dot');
            expect(dots[0]).toHaveAttribute('data-active', 'true');
            // the first card is the end of the line — the arrow is disabled and stays put
            expect(screen.getByTestId('carousel-prev')).toBeDisabled();
            fireEvent.click(screen.getByTestId('carousel-prev'));
            expect(dots[0]).toHaveAttribute('data-active', 'true');
        });
    });

    // -- balance remaining ---------------------------------------------------
    describe('balance remaining', () => {
        it('shows the "Balance Remaining" label and amount (limit - used) when a card is active', () => {
            render(
                <CardsAssignedPanel
                    cards={[makeCard({ used: 3000, limit: 10000 })]}
                    cardRecords={toRecords([makeCard({ used: 3000, limit: 10000 })])}
                    activeCount={1}
                />
            );
            expect(screen.getByText('Balance Remaining')).toBeInTheDocument();
            expect(screen.getByText('₹7000')).toBeInTheDocument();
        });

        it('shows the amount spent and the card limit', () => {
            render(
                <CardsAssignedPanel
                    cards={[makeCard({ used: 3000, limit: 10000 })]}
                    cardRecords={toRecords([makeCard({ used: 3000, limit: 10000 })])}
                    activeCount={1}
                />
            );
            expect(screen.getByText('Amount Spent: ₹3000')).toBeInTheDocument();
            expect(screen.getByText('Card Limit: ₹10000')).toBeInTheDocument();
        });

        it('does not show the balance section when cards is empty', () => {
            render(<CardsAssignedPanel cards={[]} cardRecords={[]} activeCount={0} />);
            expect(screen.queryByText('Balance Remaining')).toBeNull();
        });
    });

    // -- action buttons ------------------------------------------------------
    describe('action buttons', () => {
        it('renders both Manage and Audit Trail action buttons', () => {
            render(
                <CardsAssignedPanel
                    cards={[makeCard()]}
                    cardRecords={toRecords([makeCard()])}
                    activeCount={1}
                />
            );
            expect(screen.getByText('Manage')).toBeInTheDocument();
            expect(screen.getByText('Audit Trail')).toBeInTheDocument();
        });

        it('ManageCardModal is not visible before Manage is clicked', () => {
            render(
                <CardsAssignedPanel
                    cards={[makeCard()]}
                    cardRecords={toRecords([makeCard()])}
                    activeCount={1}
                />
            );
            expect(screen.queryByTestId('manage-card-modal')).toBeNull();
        });

        it('opens ManageCardModal when Manage button is clicked', () => {
            render(
                <CardsAssignedPanel
                    cards={[makeCard({ key: 'c1', last4: '4321' })]}
                    cardRecords={toRecords([makeCard({ key: 'c1', last4: '4321' })])}
                    activeCount={1}
                />
            );
            fireEvent.click(screen.getByText('Manage'));
            expect(screen.getByTestId('manage-card-modal')).toBeInTheDocument();
        });

        it('passes the active card last4 to ManageCardModal', () => {
            render(
                <CardsAssignedPanel
                    cards={[makeCard({ key: 'c1', last4: '7777' })]}
                    cardRecords={toRecords([makeCard({ key: 'c1', last4: '7777' })])}
                    activeCount={1}
                />
            );
            fireEvent.click(screen.getByText('Manage'));
            expect(screen.getByTestId('manage-card-modal')).toHaveAttribute('data-last4', '7777');
        });

        it('AuditTrailModal is not visible before Audit Trail is clicked', () => {
            render(
                <CardsAssignedPanel
                    cards={[makeCard()]}
                    cardRecords={toRecords([makeCard()])}
                    activeCount={1}
                />
            );
            expect(screen.queryByTestId('audit-trail-modal')).toBeNull();
        });

        it('opens AuditTrailModal when Audit Trail button is clicked', () => {
            render(
                <CardsAssignedPanel
                    cards={[makeCard({ key: 'c1', last4: '9999' })]}
                    cardRecords={toRecords([makeCard({ key: 'c1', last4: '9999' })])}
                    activeCount={1}
                />
            );
            fireEvent.click(screen.getByText('Audit Trail'));
            expect(screen.getByTestId('audit-trail-modal')).toBeInTheDocument();
        });

        it('passes the active card last4 to AuditTrailModal', () => {
            render(
                <CardsAssignedPanel
                    cards={[makeCard({ key: 'c1', last4: '9999' })]}
                    cardRecords={toRecords([makeCard({ key: 'c1', last4: '9999' })])}
                    activeCount={1}
                />
            );
            fireEvent.click(screen.getByText('Audit Trail'));
            expect(screen.getByTestId('audit-trail-modal')).toHaveAttribute('data-last4', '9999');
        });

        it('opens Manage and Audit Trail for the ACTIVE card, not the first one', () => {
            // Guards the wiring the carousel owns: with several cards it opens on the second, and both
            // actions must follow whichever card is centred.
            const cards = [
                makeCard({ key: 'c1', last4: '1111' }),
                makeCard({ key: 'c2', last4: '2222' }),
                makeCard({ key: 'c3', last4: '3333' }),
            ];
            render(
                <CardsAssignedPanel cards={cards} cardRecords={toRecords(cards)} activeCount={3} />
            );

            fireEvent.click(screen.getByText('Manage'));
            expect(screen.getByTestId('manage-card-modal')).toHaveAttribute('data-last4', '2222');
            fireEvent.click(screen.getByTestId('manage-modal-close'));

            // Advance to the third card — the actions must follow it.
            fireEvent.click(screen.getByTestId('carousel-next'));
            fireEvent.click(screen.getByText('Audit Trail'));
            expect(screen.getByTestId('audit-trail-modal')).toHaveAttribute('data-last4', '3333');
        });

        it('closes ManageCardModal when its onClose is called', () => {
            render(
                <CardsAssignedPanel
                    cards={[makeCard()]}
                    cardRecords={toRecords([makeCard()])}
                    activeCount={1}
                />
            );
            fireEvent.click(screen.getByText('Manage'));
            expect(screen.getByTestId('manage-card-modal')).toBeInTheDocument();
            fireEvent.click(screen.getByTestId('manage-modal-close'));
            expect(screen.queryByTestId('manage-card-modal')).toBeNull();
        });

        it('closes AuditTrailModal when its onClose is called', () => {
            render(
                <CardsAssignedPanel
                    cards={[makeCard()]}
                    cardRecords={toRecords([makeCard()])}
                    activeCount={1}
                />
            );
            fireEvent.click(screen.getByText('Audit Trail'));
            expect(screen.getByTestId('audit-trail-modal')).toBeInTheDocument();
            fireEvent.click(screen.getByTestId('audit-modal-close'));
            expect(screen.queryByTestId('audit-trail-modal')).toBeNull();
        });
    });

    // -- empty state ---------------------------------------------------------
    describe('empty state', () => {
        it('still renders the section card container when cards is empty', () => {
            render(<CardsAssignedPanel cards={[]} cardRecords={[]} activeCount={0} />);
            expect(screen.getByTestId('section-card')).toBeInTheDocument();
        });

        it('does not render action buttons in the empty state', () => {
            render(<CardsAssignedPanel cards={[]} cardRecords={[]} activeCount={0} />);
            expect(screen.queryByText('Manage')).toBeNull();
            expect(screen.queryByText('Audit Trail')).toBeNull();
        });

        it('shows a zero badge when there are no cards at all', () => {
            render(<CardsAssignedPanel cards={[]} cardRecords={[]} activeCount={0} />);
            expect(screen.getByTestId('section-badge')).toHaveTextContent(
                '( 0 Active + 0 Frozen )'
            );
        });
    });

    // -- frozen cards in the carousel ---------------------------------------
    describe('frozen cards', () => {
        const renderWith = (cards: CardData[], frozenCount = 0) =>
            render(
                <CardsAssignedPanel
                    cards={cards}
                    cardRecords={toRecords(cards)}
                    activeCount={2}
                    frozenCount={frozenCount}
                />
            );

        it('reports the frozen count alongside the active one', () => {
            renderWith([makeCard()], 1);

            expect(screen.getByTestId('section-badge')).toHaveTextContent(
                '( 2 Active + 1 Frozen )'
            );
        });

        it('renders the same badge while still loading, so it does not shift on load', () => {
            const { rerender } = render(
                <CardsAssignedPanel
                    cards={[]}
                    cardRecords={[]}
                    activeCount={2}
                    frozenCount={1}
                    loading
                />
            );
            const whileLoading = screen.getByTestId('section-badge').textContent;

            rerender(
                <CardsAssignedPanel
                    cards={[makeCard()]}
                    cardRecords={toRecords([makeCard()])}
                    activeCount={2}
                    frozenCount={1}
                />
            );

            expect(screen.getByTestId('section-badge').textContent).toBe(whileLoading);
        });

        it('marks the selected card when it is frozen', () => {
            renderWith([makeCard({ key: '1', status: 'Frozen' })], 1);

            expect(screen.getByTestId('card-status-tag')).toHaveTextContent('Frozen');
        });

        it('says nothing extra when the selected card is active', () => {
            renderWith([makeCard({ key: '1', status: 'Active' })]);

            expect(screen.queryByTestId('card-status-tag')).not.toBeInTheDocument();
        });

        it('says nothing when the card carries no status at all', () => {
            renderWith([makeCard({ key: '1' })]);

            expect(screen.queryByTestId('card-status-tag')).not.toBeInTheDocument();
        });

        it('names a pending termination rather than reading as a plain freeze', () => {
            renderWith(
                [makeCard({ key: '1', status: 'Frozen', terminationStatus: 'REQUESTED' })],
                0
            );

            expect(screen.getByTestId('card-status-tag')).toHaveTextContent(
                'Frozen (Termination Requested)'
            );
        });

        it('opens Manage for a frozen card', () => {
            renderWith([makeCard({ key: '9', last4: '9999', status: 'Frozen' })], 1);

            fireEvent.click(screen.getByText('Manage'));

            expect(screen.getByTestId('manage-card-modal')).toHaveAttribute('data-last4', '9999');
        });
    });
});
