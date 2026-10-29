import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';

import MyCardsTab from '../../../../components/landingPage/myCards/MyCardsTab';
import { useCardsApi } from '../../../../hooks/user/useCardsApi';
import { useCardStatusApi } from '../../../../hooks/user/useCardStatusApi';
import { MyCard } from '../../../../utils/types';

// ---------------------------------------------------------------------------
// Hook mocks
// ---------------------------------------------------------------------------

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('../../../../hooks/user/useCardQuotaApi', () => ({
    useCardQuotaApi: () => ({
        quota: {
            used: 0, included: 1, purchased: 0, allowed: 1, remaining: 1,
            requiresPayment: false, unitPrice: 19, purchasable: true,
        },
        isLoading: false,
        refetchQuota: vi.fn(),
    }),
}));
vi.mock('../../../../hooks/user/useCardsApi', () => ({
    useCardsApi: vi.fn(),
}));

vi.mock('../../../../hooks/user/useCardStatusApi', () => ({
    useCardStatusApi: vi.fn(),
}));

vi.mock('../../../../components/common/dashboardNav', () => ({
    useDashboardNav: () => vi.fn(),
    DashboardNavProvider: ({ children }: any) => <>{children}</>,
}));

// ---------------------------------------------------------------------------
// Component mocks
// ---------------------------------------------------------------------------

vi.mock('../../../../components/landingPage/myCards/MyCardsHeader', () => ({
    default: ({ onRequestCard }: any) => (
        <div data-testid="my-cards-header">
            <button type="button" data-testid="request-card-btn" onClick={onRequestCard}>
                Request a Card
            </button>
        </div>
    ),
}));

vi.mock('../../../../components/landingPage/myCards/MyCardSkeleton', () => ({
    default: () => <div data-testid="card-skeleton" />,
}));

// Fetches on mount through the auth slice, which this suite stubs per-test; its own behaviour is covered
// in PhysicalCardTrackingSection.test.tsx.
vi.mock('../../../../components/admin/PhysicalCardTrackingSection', () => ({
    default: ({ showMember, emptyText }: any) => (
        <div
            data-testid="physical-card-tracking"
            data-show-member={String(showMember)}
            data-empty-text={emptyText}
        />
    ),
}));

vi.mock('../../../../components/landingPage/myCards/MyCardCard', () => ({
    default: ({
        card,
        onFreeze,
        onUnfreeze,
        onLimitIncrease,
        onTransactions,
        onRequestPhysical,
        onRequestUnfreeze,
        busy,
    }: any) => (
        <div data-testid={`card-card-${card.key}`} data-busy={String(busy)}>
            <span data-testid={`card-last4-${card.key}`}>{card.last4}</span>
            <span data-testid={`card-status-${card.key}`}>{card.status}</span>
            <button
                type="button"
                data-testid={`freeze-btn-${card.key}`}
                onClick={() => onFreeze?.(card)}
            >
                Freeze
            </button>
            <button
                type="button"
                data-testid={`unfreeze-btn-${card.key}`}
                onClick={() => onUnfreeze?.(card)}
            >
                Unfreeze
            </button>
            <button
                type="button"
                data-testid={`limit-btn-${card.key}`}
                onClick={() => onLimitIncrease?.(card)}
            >
                Limit increase
            </button>
            <button
                type="button"
                data-testid={`transactions-btn-${card.key}`}
                onClick={() => onTransactions?.(card)}
            >
                Transactions
            </button>
            <button
                type="button"
                data-testid={`physical-btn-${card.key}`}
                onClick={() => onRequestPhysical?.(card)}
            >
                Request physical
            </button>
            <button
                type="button"
                data-testid={`request-unfreeze-btn-${card.key}`}
                onClick={() => onRequestUnfreeze?.(card)}
            >
                Request unfreeze
            </button>
        </div>
    ),
}));

vi.mock('../../../../components/landingPage/myCards/ConfirmFreezeModal', () => ({
    default: ({ card, onClose, onConfirm }: any) =>
        card ? (
            <div data-testid="confirm-freeze-modal" data-last4={card.last4}>
                <button
                    type="button"
                    data-testid="confirm-freeze-btn"
                    onClick={() => onConfirm(card, { reason: 1, reasonNote: 'Left it in a cab' })}
                >
                    Confirm
                </button>
                <button type="button" data-testid="cancel-freeze-btn" onClick={onClose}>
                    Cancel
                </button>
            </div>
        ) : null,
}));

vi.mock('../../../../components/landingPage/myCards/LimitIncreaseModal', () => ({
    default: ({ card, onClose }: any) =>
        card ? (
            <div data-testid="limit-increase-modal" data-last4={card.last4}>
                <button type="button" onClick={onClose}>
                    Close limit
                </button>
            </div>
        ) : null,
}));

vi.mock('../../../../components/landingPage/myCards/RequestUnfreezeModal', () => ({
    default: ({ card, onClose, onSuccess }: any) =>
        card ? (
            <div data-testid="request-unfreeze-modal" data-last4={card.last4}>
                <button type="button" onClick={onClose}>
                    Close unfreeze request
                </button>
                <button type="button" onClick={onSuccess}>
                    Submit unfreeze request
                </button>
            </div>
        ) : null,
}));

vi.mock('../../../../components/landingPage/myCards/RequestPhysicalCardModal', () => ({
    default: ({ open, onClose }: any) =>
        open ? (
            <div data-testid="request-physical-modal">
                <button type="button" onClick={onClose}>
                    Close physical
                </button>
            </div>
        ) : null,
}));

vi.mock('../../../../components/landingPage/myCards/RequestNewCardModal', () => ({
    default: ({ open, onClose }: any) =>
        open ? (
            <div data-testid="request-new-card-modal">
                <button type="button" data-testid="close-new-card-btn" onClick={onClose}>
                    Close new card
                </button>
            </div>
        ) : null,
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockDispatch = vi.fn();
const mockRefetch = vi.fn();
const mockSubmitCardStatus = vi.fn();

const makeCard = (overrides: Partial<MyCard> = {}): MyCard => ({
    key: 'card-1',
    kind: 'Virtual Card',
    status: 'Active',
    holder: 'Jane Doe',
    last4: '1234',
    balance: 'â‚¹50,000',
    used: 10000,
    limit: 60000,
    ...overrides,
});

const defaultApiReturn = {
    cards: [],
    isLoading: false,
    refetch: mockRefetch,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MyCardsTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        (useCardsApi as Mock).mockReturnValue(defaultApiReturn);
        (useCardStatusApi as Mock).mockReturnValue({ submitCardStatus: mockSubmitCardStatus });
    });

    // -----------------------------------------------------------------------
    describe('loading state', () => {
        it('renders 3 skeletons while cards are loading', () => {
            (useCardsApi as Mock).mockReturnValue({ ...defaultApiReturn, isLoading: true });
            render(<MyCardsTab />);
            expect(screen.getAllByTestId('card-skeleton')).toHaveLength(3);
        });

        it('does not render card cards while loading', () => {
            (useCardsApi as Mock).mockReturnValue({
                ...defaultApiReturn,
                isLoading: true,
                cards: [makeCard()],
            });
            render(<MyCardsTab />);
            expect(screen.queryByTestId('card-card-card-1')).toBeNull();
        });
    });

    // -----------------------------------------------------------------------
    describe('physical card tracking', () => {
        it('renders the tracking section in the Cards tab', () => {
            render(<MyCardsTab />);
            expect(screen.getByTestId('physical-card-tracking')).toBeInTheDocument();
        });

        // A cardholder only ever sees their own orders, and the server does not resolve their name for
        // them — leaving the column on would print a dash down the whole table.
        it('drops the Member column for a cardholder', () => {
            render(<MyCardsTab />);
            expect(screen.getByTestId('physical-card-tracking').dataset.showMember).toBe('false');
        });

        it('gives the cardholder an empty state that says how to order one', () => {
            render(<MyCardsTab />);
            expect(screen.getByTestId('physical-card-tracking').dataset.emptyText).toMatch(
                /no physical cards ordered yet/i
            );
        });

        // The section is its own fetch, so it stands whether or not the card grid found anything.
        it('still renders while the card grid is loading', () => {
            (useCardsApi as Mock).mockReturnValue({ ...defaultApiReturn, isLoading: true });
            render(<MyCardsTab />);
            expect(screen.getByTestId('physical-card-tracking')).toBeInTheDocument();
        });

        it('still renders when the cardholder has no cards at all', () => {
            render(<MyCardsTab />);
            expect(screen.getByText(/no cards yet/i)).toBeInTheDocument();
            expect(screen.getByTestId('physical-card-tracking')).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    describe('empty state', () => {
        it('shows the empty state message when no cards exist', () => {
            render(<MyCardsTab />);
            expect(screen.getByText(/no cards yet/i)).toBeInTheDocument();
        });

        it('does not render any card cards when the list is empty', () => {
            render(<MyCardsTab />);
            expect(screen.queryAllByTestId(/^card-card-/)).toHaveLength(0);
        });
    });

    // -----------------------------------------------------------------------
    describe('card rendering', () => {
        it('renders a card card for each card returned', () => {
            const cards = [
                makeCard({ key: 'c1', last4: '1111' }),
                makeCard({ key: 'c2', last4: '2222' }),
            ];
            (useCardsApi as Mock).mockReturnValue({ ...defaultApiReturn, cards });
            render(<MyCardsTab />);
            expect(screen.getByTestId('card-card-c1')).toBeInTheDocument();
            expect(screen.getByTestId('card-card-c2')).toBeInTheDocument();
        });

        it('shows the last-4 digits for each card', () => {
            const cards = [makeCard({ key: 'c1', last4: '9876' })];
            (useCardsApi as Mock).mockReturnValue({ ...defaultApiReturn, cards });
            render(<MyCardsTab />);
            expect(screen.getByTestId('card-last4-c1')).toHaveTextContent('9876');
        });

        it('shows the status for each card', () => {
            const cards = [makeCard({ key: 'c1', status: 'Frozen' })];
            (useCardsApi as Mock).mockReturnValue({ ...defaultApiReturn, cards });
            render(<MyCardsTab />);
            expect(screen.getByTestId('card-status-c1')).toHaveTextContent('Frozen');
        });
    });

    // -----------------------------------------------------------------------
    describe('Request New Card modal', () => {
        it('RequestNewCardModal is closed initially', () => {
            render(<MyCardsTab />);
            expect(screen.queryByTestId('request-new-card-modal')).toBeNull();
        });

        it('opens RequestNewCardModal when the header button is clicked', () => {
            render(<MyCardsTab />);
            fireEvent.click(screen.getByTestId('request-card-btn'));
            expect(screen.getByTestId('request-new-card-modal')).toBeInTheDocument();
        });

        it('closes RequestNewCardModal when its close button is clicked', () => {
            render(<MyCardsTab />);
            fireEvent.click(screen.getByTestId('request-card-btn'));
            expect(screen.getByTestId('request-new-card-modal')).toBeInTheDocument();
            fireEvent.click(screen.getByTestId('close-new-card-btn'));
            expect(screen.queryByTestId('request-new-card-modal')).toBeNull();
        });
    });

    // -----------------------------------------------------------------------
    describe('freeze flow', () => {
        const setup = () => {
            const card = makeCard({ key: 'c1', last4: '1234', status: 'Active' });
            (useCardsApi as Mock).mockReturnValue({ ...defaultApiReturn, cards: [card] });
            render(<MyCardsTab />);
            return card;
        };

        it('ConfirmFreezeModal is closed initially', () => {
            setup();
            expect(screen.queryByTestId('confirm-freeze-modal')).toBeNull();
        });

        it('opens ConfirmFreezeModal when freeze action is triggered', () => {
            setup();
            fireEvent.click(screen.getByTestId('freeze-btn-c1'));
            expect(screen.getByTestId('confirm-freeze-modal')).toBeInTheDocument();
            expect(screen.getByTestId('confirm-freeze-modal').dataset.last4).toBe('1234');
        });

        it('closes ConfirmFreezeModal when cancelled', () => {
            setup();
            fireEvent.click(screen.getByTestId('freeze-btn-c1'));
            fireEvent.click(screen.getByTestId('cancel-freeze-btn'));
            expect(screen.queryByTestId('confirm-freeze-modal')).toBeNull();
        });

        it('calls submitCardStatus with FROZEN and the confirmed reason', async () => {
            mockSubmitCardStatus.mockResolvedValue(true);
            setup();
            fireEvent.click(screen.getByTestId('freeze-btn-c1'));
            fireEvent.click(screen.getByTestId('confirm-freeze-btn'));
            await waitFor(() => {
                expect(mockSubmitCardStatus).toHaveBeenCalledWith(
                    'c1',
                    'FROZEN',
                    1,
                    'Left it in a cab'
                );
            });
        });

        it('closes ConfirmFreezeModal after successful freeze', async () => {
            mockSubmitCardStatus.mockResolvedValue(true);
            setup();
            fireEvent.click(screen.getByTestId('freeze-btn-c1'));
            fireEvent.click(screen.getByTestId('confirm-freeze-btn'));
            await waitFor(() => expect(screen.queryByTestId('confirm-freeze-modal')).toBeNull());
        });

        it('dispatches a success toast after freezing', async () => {
            mockSubmitCardStatus.mockResolvedValue(true);
            setup();
            fireEvent.click(screen.getByTestId('freeze-btn-c1'));
            fireEvent.click(screen.getByTestId('confirm-freeze-btn'));
            await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
        });
    });

    // -----------------------------------------------------------------------
    describe('unfreeze flow', () => {
        // Restoring a card is always an admin decision, so a cardholder never calls the status endpoint for
        // it — the button opens the request flow.
        it('never calls submitCardStatus for an unfreeze', async () => {
            const card = makeCard({ key: 'c1', status: 'Frozen' });
            (useCardsApi as Mock).mockReturnValue({ ...defaultApiReturn, cards: [card] });
            render(<MyCardsTab />);
            fireEvent.click(screen.getByTestId('unfreeze-btn-c1'));
            await waitFor(() =>
                expect(screen.getByTestId('request-unfreeze-modal')).toBeInTheDocument()
            );
            expect(mockSubmitCardStatus).not.toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    describe('limit increase modal', () => {
        it('LimitIncreaseModal is closed initially', () => {
            const card = makeCard({ key: 'c1' });
            (useCardsApi as Mock).mockReturnValue({ ...defaultApiReturn, cards: [card] });
            render(<MyCardsTab />);
            expect(screen.queryByTestId('limit-increase-modal')).toBeNull();
        });

        it('opens LimitIncreaseModal when limit increase is triggered', () => {
            const card = makeCard({ key: 'c1', last4: '5678' });
            (useCardsApi as Mock).mockReturnValue({ ...defaultApiReturn, cards: [card] });
            render(<MyCardsTab />);
            fireEvent.click(screen.getByTestId('limit-btn-c1'));
            expect(screen.getByTestId('limit-increase-modal')).toBeInTheDocument();
            expect(screen.getByTestId('limit-increase-modal').dataset.last4).toBe('5678');
        });

        it('closes LimitIncreaseModal when its close button is clicked', () => {
            const card = makeCard({ key: 'c1' });
            (useCardsApi as Mock).mockReturnValue({ ...defaultApiReturn, cards: [card] });
            render(<MyCardsTab />);
            fireEvent.click(screen.getByTestId('limit-btn-c1'));
            fireEvent.click(screen.getByRole('button', { name: /close limit/i }));
            expect(screen.queryByTestId('limit-increase-modal')).toBeNull();
        });
    });

    // -----------------------------------------------------------------------
    // ADO 29155 — clicking "Transactions" on a specific card navigated to the Transactions tab but
    // never told it which card to filter by, so it showed every card's transactions.
    describe('transactions navigation', () => {
        it("calls onCardTransactions with the clicked card's last4", () => {
            const card = makeCard({ key: 'c1', last4: '2260' });
            (useCardsApi as Mock).mockReturnValue({ ...defaultApiReturn, cards: [card] });
            const onCardTransactions = vi.fn();
            render(<MyCardsTab onCardTransactions={onCardTransactions} />);

            fireEvent.click(screen.getByTestId('transactions-btn-c1'));

            expect(onCardTransactions).toHaveBeenCalledWith('2260');
        });

        it('does not throw when onCardTransactions is not provided', () => {
            const card = makeCard({ key: 'c1', last4: '2260' });
            (useCardsApi as Mock).mockReturnValue({ ...defaultApiReturn, cards: [card] });
            render(<MyCardsTab />);

            expect(() => fireEvent.click(screen.getByTestId('transactions-btn-c1'))).not.toThrow();
        });
    });

    // -----------------------------------------------------------------------
    describe('request physical card modal', () => {
        it('RequestPhysicalCardModal is closed initially', () => {
            const card = makeCard({ key: 'c1' });
            (useCardsApi as Mock).mockReturnValue({ ...defaultApiReturn, cards: [card] });
            render(<MyCardsTab />);
            expect(screen.queryByTestId('request-physical-modal')).toBeNull();
        });

        it('opens RequestPhysicalCardModal when request physical is triggered', () => {
            const card = makeCard({ key: 'c1' });
            (useCardsApi as Mock).mockReturnValue({ ...defaultApiReturn, cards: [card] });
            render(<MyCardsTab />);
            fireEvent.click(screen.getByTestId('physical-btn-c1'));
            expect(screen.getByTestId('request-physical-modal')).toBeInTheDocument();
        });

        it('closes RequestPhysicalCardModal when its close button is clicked', () => {
            const card = makeCard({ key: 'c1' });
            (useCardsApi as Mock).mockReturnValue({ ...defaultApiReturn, cards: [card] });
            render(<MyCardsTab />);
            fireEvent.click(screen.getByTestId('physical-btn-c1'));
            fireEvent.click(screen.getByRole('button', { name: /close physical/i }));
            expect(screen.queryByTestId('request-physical-modal')).toBeNull();
        });
    });
});

describe('MyCardsTab — unfreeze request', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        (useCardsApi as Mock).mockReturnValue(defaultApiReturn);
        (useCardStatusApi as Mock).mockReturnValue({ submitCardStatus: mockSubmitCardStatus });
    });

    const withCard = (override: Partial<MyCard> = {}) => {
        (useCardsApi as Mock).mockReturnValue({
            ...defaultApiReturn,
            cards: [makeCard({ key: 'c1', last4: '1111', status: 'Frozen', ...override })],
        });
    };

    // The backend 403s every cardholder unfreeze, so don't fire a call that must fail — open the request
    // popup instead.
    it('opens the request popup instead of calling the API', () => {
        withCard();
        render(<MyCardsTab />);

        fireEvent.click(screen.getByTestId('unfreeze-btn-c1'));

        expect(mockSubmitCardStatus).not.toHaveBeenCalled();
        expect(screen.getByTestId('request-unfreeze-modal')).toHaveAttribute('data-last4', '1111');
    });

    // Previously a self-placed freeze could be lifted directly. It cannot any more: otherwise "freeze, then
    // quietly unfreeze" would step around a control an admin has since put in place.
    it('still routes to the request popup for a freeze the cardholder placed themselves', () => {
        withCard({ frozenByRole: 'CARDHOLDER' });
        render(<MyCardsTab />);

        fireEvent.click(screen.getByTestId('unfreeze-btn-c1'));

        expect(mockSubmitCardStatus).not.toHaveBeenCalled();
        expect(screen.getByTestId('request-unfreeze-modal')).toBeInTheDocument();
    });

    it('refetches from the server after a successful request', () => {
        withCard();
        render(<MyCardsTab />);
        fireEvent.click(screen.getByTestId('unfreeze-btn-c1'));
        fireEvent.click(screen.getByText('Submit unfreeze request'));
        expect(mockRefetch).toHaveBeenCalled();
    });

    // The old code patched `cards` locally. unfreezeRequestStatus is server-computed policy, so a patched row
    // rendered the wrong affordance until the next unrelated refetch.
    it('refetches rather than patching local state after a freeze', async () => {
        mockSubmitCardStatus.mockResolvedValue(true);
        (useCardsApi as Mock).mockReturnValue({
            ...defaultApiReturn,
            cards: [makeCard({ key: 'c1', last4: '1111', status: 'Active' })],
        });
        render(<MyCardsTab />);

        // Freeze goes through the confirmation modal before it reaches the handler.
        fireEvent.click(screen.getByTestId('freeze-btn-c1'));
        fireEvent.click(screen.getByTestId('confirm-freeze-btn'));

        await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
    });
});
