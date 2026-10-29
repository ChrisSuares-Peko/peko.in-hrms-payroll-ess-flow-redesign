import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';

import CorporateDashboardHome from '../../../components/corporate/CorporateDashboardHome';
import { useCardsApi } from '../../../hooks/user/useCardsApi';
import { useDashboardSummaryApi } from '../../../hooks/user/useDashboardSummaryApi';

// ---------------------------------------------------------------------------
// Hook mocks
// ---------------------------------------------------------------------------

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('../../../hooks/user/useCardQuotaApi', () => ({
    useCardQuotaApi: () => ({
        quota: {
            used: 0, included: 1, purchased: 0, allowed: 1, remaining: 1,
            requiresPayment: false, unitPrice: 19, purchasable: true,
        },
        isLoading: false,
        refetchQuota: vi.fn(),
    }),
}));
vi.mock('../../../hooks/user/useCardsApi', () => ({
    useCardsApi: vi.fn(),
}));

vi.mock('../../../hooks/user/useDashboardSummaryApi', () => ({
    useDashboardSummaryApi: vi.fn(),
}));

vi.mock('../../../components/common/dashboardNav', () => ({
    useDashboardNav: () => vi.fn(),
    DashboardNavProvider: ({ children }: any) => <>{children}</>,
}));

// ---------------------------------------------------------------------------
// Component mocks
// ---------------------------------------------------------------------------

vi.mock('../../../components/common/StatCard', () => ({
    default: ({ stat }: any) => (
        <div data-testid={`stat-card-${stat.key}`}>
            <span data-testid={`stat-label-${stat.key}`}>{stat.label}</span>
            <span data-testid={`stat-value-${stat.key}`}>{stat.value}</span>
            <span data-testid={`stat-caption-${stat.key}`}>{stat.caption}</span>
        </div>
    ),
}));

vi.mock('../../../components/common/SectionCard', () => ({
    default: ({ title, children }: any) => (
        <div data-testid={`section-card-${title?.replace(/\s+/g, '-').toLowerCase()}`}>
            <span>{title}</span>
            {children}
        </div>
    ),
    ViewAllLink: ({ onClick }: any) => (
        <button type="button" data-testid="view-all-link" onClick={onClick}>
            View all
        </button>
    ),
}));

vi.mock('../../../components/common/RecentTransactions', () => ({
    default: ({ items }: any) => (
        <div data-testid="recent-transactions-list">
            {(items ?? []).map((item: any) => (
                <div key={item.key} data-testid={`txn-${item.key}`}>
                    {item.merchant} - {item.status}
                </div>
            ))}
        </div>
    ),
}));

vi.mock('../../../components/common/ProgressList', () => ({
    default: ({ rows }: any) => (
        <div data-testid="progress-list">
            {(rows ?? []).map((r: any) => (
                <div key={r.key} data-testid={`cat-row-${r.key}`}>
                    {r.label}
                </div>
            ))}
        </div>
    ),
}));

vi.mock('../../../components/corporate/MyCardsPanel', () => ({
    default: ({ cards, activeCount, onTopup }: any) => (
        <div data-testid="my-cards-panel" data-active={activeCount}>
            <button
                type="button"
                data-testid="topup-trigger"
                onClick={() => onTopup?.({ key: 'c1', last4: '1234' })}
            >
                Topup
            </button>
        </div>
    ),
}));

vi.mock('../../../components/landingPage/myCards/RequestNewCardModal', () => ({
    default: ({ open, onClose }: any) =>
        open ? (
            <div data-testid="request-new-card-modal">
                <button type="button" data-testid="close-new-card" onClick={onClose}>
                    Close
                </button>
            </div>
        ) : null,
}));

vi.mock('../../../components/landingPage/myCards/RequestTopupModal', () => ({
    default: ({ open, onClose }: any) =>
        open ? (
            <div data-testid="request-topup-modal">
                <button type="button" data-testid="close-topup" onClick={onClose}>
                    Close
                </button>
            </div>
        ) : null,
}));

vi.mock('../../../components/landingPage/myCards/LimitIncreaseModal', () => ({
    default: ({ card, onClose }: any) =>
        card ? (
            <div data-testid="limit-increase-modal">
                <button type="button" data-testid="close-limit" onClick={onClose}>
                    Close
                </button>
            </div>
        ) : null,
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockRefetch = vi.fn();

const defaultCardsReturn = { cards: [], isLoading: false, refetch: mockRefetch };
const defaultSummaryReturn = { summary: null };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CorporateDashboardHome', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as Mock).mockReturnValue(vi.fn());
        (useCardsApi as Mock).mockReturnValue(defaultCardsReturn);
        (useDashboardSummaryApi as Mock).mockReturnValue(defaultSummaryReturn);
    });

    // -----------------------------------------------------------------------
    describe('header', () => {
        it('renders the Corporate Card heading', () => {
            render(<CorporateDashboardHome />);
            expect(screen.getByRole('heading', { name: /corporate card/i })).toBeInTheDocument();
        });

        it('renders the Request Limit Increase button', () => {
            render(<CorporateDashboardHome />);
            expect(
                screen.getByRole('button', { name: /request limit increase/i })
            ).toBeInTheDocument();
        });

        it('renders the New card request button', () => {
            render(<CorporateDashboardHome />);
            expect(screen.getByRole('button', { name: /new card request/i })).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    describe('KPI stat cards', () => {
        it('renders the My cards stat card', () => {
            render(<CorporateDashboardHome />);
            expect(screen.getByTestId('stat-card-my-cards')).toBeInTheDocument();
        });

        it('renders the Spent this period stat card', () => {
            render(<CorporateDashboardHome />);
            expect(screen.getByTestId('stat-card-spent')).toBeInTheDocument();
        });

        it('renders the Open requests stat card', () => {
            render(<CorporateDashboardHome />);
            expect(screen.getByTestId('stat-card-open-requests')).toBeInTheDocument();
        });

        it('renders the Pending reimbursements stat card', () => {
            render(<CorporateDashboardHome />);
            expect(screen.getByTestId('stat-card-pending-reimbursements')).toBeInTheDocument();
        });

        it('shows the total card count (including frozen and other statuses) as the value', () => {
            (useCardsApi as Mock).mockReturnValue({
                ...defaultCardsReturn,
                cards: [
                    { key: 'c1', status: 'Active' },
                    { key: 'c2', status: 'Frozen' },
                    { key: 'c3', status: 'Active' },
                    { key: 'c4', status: 'Frozen' },
                    { key: 'c5', status: 'Active' },
                ],
            });
            render(<CorporateDashboardHome />);
            expect(screen.getByTestId('stat-value-my-cards')).toHaveTextContent('5');
        });

        it('shows the active card count in the caption, separate from the total', () => {
            (useCardsApi as Mock).mockReturnValue({
                ...defaultCardsReturn,
                cards: [
                    { key: 'c1', status: 'Active' },
                    { key: 'c2', status: 'Frozen' },
                    { key: 'c3', status: 'Active' },
                ],
            });
            render(<CorporateDashboardHome />);
            expect(screen.getByTestId('stat-value-my-cards')).toHaveTextContent('3');
            expect(screen.getByTestId('stat-caption-my-cards')).toHaveTextContent('2 active');
        });

        it('defaults to 0 cards and 0 active when none are loaded', () => {
            render(<CorporateDashboardHome />);
            expect(screen.getByTestId('stat-value-my-cards')).toHaveTextContent('0');
            expect(screen.getByTestId('stat-caption-my-cards')).toHaveTextContent('0 active');
        });
    });

    // -----------------------------------------------------------------------
    describe('Recent Transactions section', () => {
        it('shows the empty state when there are no recent transactions', () => {
            render(<CorporateDashboardHome />);
            expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument();
        });

        it('renders the recent transactions list when data is available', () => {
            (useDashboardSummaryApi as Mock).mockReturnValue({
                summary: {
                    recentTransactions: [
                        {
                            id: 1,
                            merchant: 'Amazon',
                            amount: 500,
                            date: '2024-01-10',
                            status: 'Completed',
                            member: null,
                        },
                        {
                            id: 2,
                            merchant: 'Swiggy',
                            amount: 200,
                            date: '2024-01-11',
                            status: 'Completed',
                            member: null,
                        },
                    ],
                },
            });
            render(<CorporateDashboardHome />);
            expect(screen.getByTestId('recent-transactions-list')).toBeInTheDocument();
            expect(screen.getByTestId('txn-1')).toHaveTextContent('Amazon');
            expect(screen.getByTestId('txn-2')).toHaveTextContent('Swiggy');
        });

        // The widget used to remap a declined transaction's 'Declined' status to 'Rejected' — a word
        // borrowed from the unrelated approval-request vocabulary — so the same transaction showed
        // "Rejected" here but "Declined" on the Transactions page (ADO 29086). It must show the same
        // word feTransactionStatus produced, unchanged.
        it('shows "Declined" (not "Rejected") for a declined transaction, matching the Transactions page', () => {
            (useDashboardSummaryApi as Mock).mockReturnValue({
                summary: {
                    recentTransactions: [
                        {
                            id: 1,
                            merchant: 'PinePerk_Test_MerchantT',
                            amount: 20,
                            date: '2026-07-24',
                            status: 'Declined',
                            member: null,
                        },
                        {
                            id: 2,
                            merchant: 'PinePerk_Test_MerchantT',
                            amount: 1000,
                            date: '2026-07-24',
                            status: 'Processing',
                            member: null,
                        },
                    ],
                },
            });
            render(<CorporateDashboardHome />);
            expect(screen.getByTestId('txn-1')).toHaveTextContent('Declined');
            expect(screen.getByTestId('txn-1')).not.toHaveTextContent('Rejected');
            expect(screen.getByTestId('txn-2')).toHaveTextContent('Processing');
        });
    });

    // -----------------------------------------------------------------------
    describe('Spend by Category section', () => {
        it('shows the empty state when no category spend data', () => {
            render(<CorporateDashboardHome />);
            expect(screen.getByText(/no spend data available/i)).toBeInTheDocument();
        });

        it('renders the progress list when spend data is present', () => {
            (useDashboardSummaryApi as Mock).mockReturnValue({
                summary: {
                    spendByCategory: [
                        { category: 'Travel', amount: 5000 },
                        { category: 'Software', amount: 3000 },
                    ],
                },
            });
            render(<CorporateDashboardHome />);
            expect(screen.getByTestId('progress-list')).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    describe('MyCardsPanel', () => {
        it('renders MyCardsPanel', () => {
            render(<CorporateDashboardHome />);
            expect(screen.getByTestId('my-cards-panel')).toBeInTheDocument();
        });

        it('passes the active card count to MyCardsPanel', () => {
            (useCardsApi as Mock).mockReturnValue({
                ...defaultCardsReturn,
                cards: [
                    { key: 'c1', status: 'Active' },
                    { key: 'c2', status: 'Frozen' },
                    { key: 'c3', status: 'Active' },
                ],
            });
            render(<CorporateDashboardHome />);
            expect(screen.getByTestId('my-cards-panel').dataset.active).toBe('2');
        });
    });

    // -----------------------------------------------------------------------
    describe('RequestNewCardModal', () => {
        it('is closed initially', () => {
            render(<CorporateDashboardHome />);
            expect(screen.queryByTestId('request-new-card-modal')).toBeNull();
        });

        it('opens when New card request is clicked', () => {
            render(<CorporateDashboardHome />);
            fireEvent.click(screen.getByRole('button', { name: /new card request/i }));
            expect(screen.getByTestId('request-new-card-modal')).toBeInTheDocument();
        });

        it('closes when its close button is clicked', () => {
            render(<CorporateDashboardHome />);
            fireEvent.click(screen.getByRole('button', { name: /new card request/i }));
            fireEvent.click(screen.getByTestId('close-new-card'));
            expect(screen.queryByTestId('request-new-card-modal')).toBeNull();
        });
    });

    // -----------------------------------------------------------------------
    describe('RequestTopupModal', () => {
        it('is closed initially', () => {
            render(<CorporateDashboardHome />);
            expect(screen.queryByTestId('request-topup-modal')).toBeNull();
        });

        it('opens when Request Limit Increase is clicked', () => {
            render(<CorporateDashboardHome />);
            fireEvent.click(screen.getByRole('button', { name: /request limit increase/i }));
            expect(screen.getByTestId('request-topup-modal')).toBeInTheDocument();
        });

        it('closes when its close button is clicked', () => {
            render(<CorporateDashboardHome />);
            fireEvent.click(screen.getByRole('button', { name: /request limit increase/i }));
            fireEvent.click(screen.getByTestId('close-topup'));
            expect(screen.queryByTestId('request-topup-modal')).toBeNull();
        });
    });

    // -----------------------------------------------------------------------
    describe('LimitIncreaseModal (via MyCardsPanel onTopup)', () => {
        it('is closed initially', () => {
            render(<CorporateDashboardHome />);
            expect(screen.queryByTestId('limit-increase-modal')).toBeNull();
        });

        it('opens when MyCardsPanel triggers onTopup', () => {
            render(<CorporateDashboardHome />);
            fireEvent.click(screen.getByTestId('topup-trigger'));
            expect(screen.getByTestId('limit-increase-modal')).toBeInTheDocument();
        });

        it('closes when its close button is clicked', () => {
            render(<CorporateDashboardHome />);
            fireEvent.click(screen.getByTestId('topup-trigger'));
            fireEvent.click(screen.getByTestId('close-limit'));
            expect(screen.queryByTestId('limit-increase-modal')).toBeNull();
        });
    });
});
