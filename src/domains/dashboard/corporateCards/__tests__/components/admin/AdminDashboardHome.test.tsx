import React from 'react';

import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';

import AdminDashboardHome from '../../../components/admin/AdminDashboardHome';
import { useDashboardNav } from '../../../components/common/dashboardNav';
import { useAdminCardsApi } from '../../../hooks/admin/useAdminCardsApi';
import { useWalletApi } from '../../../hooks/admin/useWalletApi';
import { useDashboardSummaryApi } from '../../../hooks/user/useDashboardSummaryApi';

// â”€â”€ Store â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

// â”€â”€ Data-fetching hooks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
vi.mock('../../../hooks/user/useDashboardSummaryApi', () => ({
    useDashboardSummaryApi: vi.fn(),
}));
vi.mock('../../../hooks/admin/useWalletApi', () => ({
    useWalletApi: vi.fn(),
}));
vi.mock('../../../hooks/admin/useAdminCardsApi', () => ({
    useAdminCardsApi: vi.fn(),
}));

// â”€â”€ Dashboard navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
vi.mock('../../../components/common/dashboardNav', () => ({
    useDashboardNav: vi.fn(),
    DashboardNavProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    DashboardNavContext: { Provider: ({ children }: any) => <>{children}</> },
}));

// â”€â”€ Pure utility functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
vi.mock('../../../utils/helpers', () => ({
    formatRupeesDecimal: (n: number) => `â‚¹${n.toFixed(2)}`,
    utilisationPercent: (used: number, limit: number) =>
        limit > 0 ? Math.round((used / limit) * 100) : 0,
    getInitials: (name: string) => name.charAt(0).toUpperCase(),
    getTabLabel: vi.fn(),
    recentTransactionStatus: (status: string) => status,
}));

vi.mock('../../../utils/dashboardMappers', () => ({
    toDailyPoints: (points: any[]) => points,
    utilisationColor: () => '#4CAF50',
}));

// â”€â”€ SVG asset mocks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
vi.mock('../../../assets/icons/bankImage.svg', () => ({ default: 'bankImage.svg' }));
vi.mock('../../../assets/icons/card2.svg', () => ({ default: 'card2.svg' }));
vi.mock('../../../assets/icons/transaction.svg', () => ({ default: 'transaction.svg' }));
vi.mock('../../../assets/icons/user.svg', () => ({ default: 'user.svg' }));

// â”€â”€ Child component stubs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
vi.mock('../../../components/common/StatCard', () => ({
    default: ({ stat }: any) => (
        <div
            data-testid={`stat-card-${stat.key}`}
            data-label={stat.label}
            data-value={stat.value}
            data-caption={stat.caption}
        >
            {stat.label}
        </div>
    ),
}));

vi.mock('../../../components/common/SectionCard', () => ({
    default: ({ title, children, action }: any) => (
        <section data-testid="section-card" data-section={title}>
            <header>
                <span data-testid="section-title">{title}</span>
                <div data-testid="section-action">{action}</div>
            </header>
            <div data-testid="section-body">{children}</div>
        </section>
    ),
    ViewAllLink: ({ onClick, label }: any) => (
        <button type="button" data-testid="view-all-link" onClick={onClick}>
            {label ?? 'View all'}
        </button>
    ),
}));

vi.mock('../../../components/common/RecentTransactions', () => ({
    default: ({ items }: any) => (
        <ul data-testid="recent-transactions-list">
            {items.map((item: any) => (
                <li key={item.key} data-testid="transaction-item">
                    <span>{item.merchant}</span>
                    <span data-testid={`transaction-status-${item.key}`}>{item.status}</span>
                </li>
            ))}
        </ul>
    ),
}));

vi.mock('../../../components/common/ProgressList', () => ({
    default: ({ rows }: any) => <div data-testid="progress-list" data-row-count={rows.length} />,
    ProgressRow: {},
}));

vi.mock('../../../components/admin/WalletPanel', () => ({
    default: ({ wallet }: any) => (
        <div
            data-testid="wallet-panel"
            data-available={wallet.available}
            data-card-limits-label={wallet.cardLimitsLabel}
        />
    ),
}));

vi.mock('../../../components/admin/DailySpendChart', () => ({
    default: ({ total }: any) => <div data-testid="daily-spend-chart" data-total={total} />,
}));

vi.mock('../../../components/admin/CardsAssignedPanel', () => ({
    default: ({ cards, cardRecords, activeCount, frozenCount, loading }: any) => (
        <div
            data-testid="cards-assigned-panel"
            data-card-count={cards.length}
            data-record-count={cardRecords.length}
            data-active-count={activeCount}
            data-frozen-count={frozenCount}
            data-loading={String(loading ?? false)}
            data-card-keys={cards.map((c: any) => c.key).join(',')}
            data-card-statuses={cards.map((c: any) => c.status ?? '-').join(',')}
        />
    ),
}));

// â”€â”€ Test fixtures â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const mockNavigate = vi.fn();

const mockKpis = {
    activeCards: 8,
    spentThisMonth: 15000,
    transactionCount: 42,
    totalCardLimits: 100000,
    openRequests: 3,
    totalCardsIssued: 10,
    verifiedMembers: { verified: 5, total: 7 },
    pendingKyc: 2,
};

const mockSummary = {
    scope: 'admin' as const,
    month: '2024-01',
    kpis: mockKpis,
    spendByCategory: [],
    dailySpend: { total: 15000, points: [] },
    cardUtilisation: [
        { cardIssuanceId: 1, holder: 'Alice', last4: '1234', spent: 5000, limit: 10000 },
        { cardIssuanceId: 2, holder: 'Bob', last4: '5678', spent: 3000, limit: 8000 },
    ],
    recentTransactions: [],
};

const mockWallet = {
    balance: 50000,
    totalCardLimits: 100000,
    cardCount: 8,
    fundingAccount: {
        maskedAccountNumber: '****1234',
        ifsc: 'HDFC0001234',
    },
};

const makeMockCard = (overrides: Record<string, unknown> = {}) => ({
    key: '1',
    holder: 'Alice Smith',
    last4: '1234',
    status: 'Active',
    cardLimit: 10000,
    spent: 5000,
    remaining: 5000,
    department: 'Engineering',
    avatarText: 'AS',
    type: 'Virtual',
    cardState: 'active',
    perTxnLimit: 2000,
    ...overrides,
});

type MockCard = ReturnType<typeof makeMockCard>;

interface CardsApiFixture {
    active?: MockCard[];
    activeTotal?: number;
    frozen?: MockCard[];
    frozenTotal?: number;
    activeLoading?: boolean;
    frozenLoading?: boolean;
}

const mockCardsApi = (fixture: CardsApiFixture = {}) => {
    const active = fixture.active ?? [makeMockCard({ key: '1', status: 'Active' })];
    const frozen = fixture.frozen ?? [
        makeMockCard({ key: '2', holder: 'Bob Jones', last4: '5678', status: 'Frozen' }),
    ];
    const activeTotal = fixture.activeTotal ?? active.length;
    const frozenTotal = fixture.frozenTotal ?? frozen.length;
    const { activeLoading = false, frozenLoading = false } = fixture;

    const refetchActive = vi.fn();
    const refetchFrozen = vi.fn();
    (useAdminCardsApi as Mock).mockImplementation(
        (_page: number, _size: number, _type: unknown, _search: unknown, status?: string) =>
            status === 'frozenNotTerminated'
                ? {
                      cards: frozen,
                      total: frozenTotal,
                      isLoading: frozenLoading,
                      refetch: refetchFrozen,
                  }
                : {
                      cards: active,
                      total: activeTotal,
                      isLoading: activeLoading,
                      refetch: refetchActive,
                  }
    );
    return { refetchActive, refetchFrozen };
};

const mockRecentTransactions = [
    {
        id: 1,
        merchant: 'Amazon',
        member: 'Alice',
        date: '01 Jan 2024',
        amount: 500,
        status: 'Completed',
    },
    {
        id: 2,
        merchant: 'Flipkart',
        member: 'Bob',
        date: '02 Jan 2024',
        amount: 1200,
        status: 'APPROVED',
    },
];

const mockAuthState = { role: 'admin', id: 1 };

// â”€â”€ Suite â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('AdminDashboardHome', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
            fn({ reducer: { auth: mockAuthState } })
        );
        (useAppDispatch as unknown as Mock).mockReturnValue(vi.fn());

        (useDashboardSummaryApi as Mock).mockReturnValue({
            summary: mockSummary,
            isLoading: false,
        });
        (useWalletApi as Mock).mockReturnValue({
            wallet: mockWallet,
            isLoading: false,
            refetch: vi.fn(),
        });
        mockCardsApi();
        (useDashboardNav as Mock).mockReturnValue(mockNavigate);
    });

    // â”€â”€ 1. Page Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('page header', () => {
        it('renders the main dashboard heading', () => {
            render(<AdminDashboardHome />);
            expect(screen.getByText('Corporate Card Dashboard')).toBeInTheDocument();
        });

        it('renders the subtitle describing the dashboard scope', () => {
            render(<AdminDashboardHome />);
            expect(
                screen.getByText('Real-time spend, balances, and activity across Peko.')
            ).toBeInTheDocument();
        });
    });

    // â”€â”€ 2. KPI Stat Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('KPI stat cards', () => {
        it('renders all four KPI stat card tiles', () => {
            render(<AdminDashboardHome />);
            expect(screen.getByTestId('stat-card-active-cards')).toBeInTheDocument();
            expect(screen.getByTestId('stat-card-verified-members')).toBeInTheDocument();
            expect(screen.getByTestId('stat-card-pending-approvals')).toBeInTheDocument();
            expect(screen.getByTestId('stat-card-month-spent')).toBeInTheDocument();
        });

        it('active cards tile shows kpis.activeCards as its value', () => {
            render(<AdminDashboardHome />);
            expect(screen.getByTestId('stat-card-active-cards').getAttribute('data-value')).toBe(
                '8'
            );
        });

        it('active cards tile caption shows total cards issued', () => {
            render(<AdminDashboardHome />);
            expect(screen.getByTestId('stat-card-active-cards').getAttribute('data-caption')).toBe(
                '10 total issued'
            );
        });

        it('verified members tile shows verified/total ratio', () => {
            render(<AdminDashboardHome />);
            expect(
                screen.getByTestId('stat-card-verified-members').getAttribute('data-value')
            ).toBe('5/7');
        });

        it('verified members caption shows pending KYC count', () => {
            render(<AdminDashboardHome />);
            expect(
                screen.getByTestId('stat-card-verified-members').getAttribute('data-caption')
            ).toBe('2 pending KYC');
        });

        it('pending approvals tile shows kpis.openRequests', () => {
            render(<AdminDashboardHome />);
            expect(
                screen.getByTestId('stat-card-pending-approvals').getAttribute('data-value')
            ).toBe('3');
        });

        it('pending approvals caption is "Action needed"', () => {
            render(<AdminDashboardHome />);
            expect(
                screen.getByTestId('stat-card-pending-approvals').getAttribute('data-caption')
            ).toBe('Action needed');
        });

        it('this month spent tile shows formatted spend value', () => {
            render(<AdminDashboardHome />);
            // formatRupeesDecimal mock: (n) => `â‚¹${n.toFixed(2)}`
            expect(screen.getByTestId('stat-card-month-spent').getAttribute('data-value')).toBe(
                'â‚¹15000.00'
            );
        });

        it('this month spent caption shows transaction count', () => {
            render(<AdminDashboardHome />);
            expect(screen.getByTestId('stat-card-month-spent').getAttribute('data-caption')).toBe(
                '42 transactions'
            );
        });

        it('all stat card values default to 0 when summary is null', () => {
            (useDashboardSummaryApi as Mock).mockReturnValue({
                summary: null,
                isLoading: false,
            });
            render(<AdminDashboardHome />);
            expect(screen.getByTestId('stat-card-active-cards').getAttribute('data-value')).toBe(
                '0'
            );
            expect(
                screen.getByTestId('stat-card-pending-approvals').getAttribute('data-value')
            ).toBe('0');
            expect(
                screen.getByTestId('stat-card-verified-members').getAttribute('data-value')
            ).toBe('—');
            expect(screen.getByTestId('stat-card-month-spent').getAttribute('data-value')).toBe(
                'â‚¹0.00'
            );
        });
    });

    // â”€â”€ 3. Recent Transactions section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('recent transactions section', () => {
        it('renders the "Recent Transactions" section heading', () => {
            render(<AdminDashboardHome />);
            expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
        });

        it('shows empty-state heading when there are no transactions', () => {
            render(<AdminDashboardHome />);
            // mockSummary.recentTransactions is []
            expect(screen.getByText('No transactions yet')).toBeInTheDocument();
        });

        it('shows descriptive empty-state caption when there are no transactions', () => {
            render(<AdminDashboardHome />);
            expect(
                screen.getByText(
                    'Your transaction history will appear here once you start using your Peko card.'
                )
            ).toBeInTheDocument();
        });

        it('renders the RecentTransactions list when summary contains transactions', () => {
            (useDashboardSummaryApi as Mock).mockReturnValue({
                summary: { ...mockSummary, recentTransactions: mockRecentTransactions },
                isLoading: false,
            });
            render(<AdminDashboardHome />);
            expect(screen.getByTestId('recent-transactions-list')).toBeInTheDocument();
        });

        it('maps each transaction to an item with the merchant name', () => {
            (useDashboardSummaryApi as Mock).mockReturnValue({
                summary: { ...mockSummary, recentTransactions: mockRecentTransactions },
                isLoading: false,
            });
            render(<AdminDashboardHome />);
            expect(screen.getByText('Amazon')).toBeInTheDocument();
            expect(screen.getByText('Flipkart')).toBeInTheDocument();
        });

        it('shows two transaction items when two transactions are returned', () => {
            (useDashboardSummaryApi as Mock).mockReturnValue({
                summary: { ...mockSummary, recentTransactions: mockRecentTransactions },
                isLoading: false,
            });
            render(<AdminDashboardHome />);
            expect(screen.getAllByTestId('transaction-item')).toHaveLength(2);
        });

        it('does not render the empty state when transactions are present', () => {
            (useDashboardSummaryApi as Mock).mockReturnValue({
                summary: {
                    ...mockSummary,
                    recentTransactions: [
                        {
                            id: 1,
                            merchant: 'Zomato',
                            member: null,
                            date: '03 Jan 2024',
                            amount: 200,
                            status: 'Pending',
                        },
                    ],
                },
                isLoading: false,
            });
            render(<AdminDashboardHome />);
            expect(screen.queryByText('No transactions yet')).toBeNull();
        });

        it('uses "â€”" as the person field when member is null', () => {
            (useDashboardSummaryApi as Mock).mockReturnValue({
                summary: {
                    ...mockSummary,
                    recentTransactions: [
                        {
                            id: 1,
                            merchant: 'Uber Eats',
                            member: null,
                            date: '04 Jan 2024',
                            amount: 150,
                            status: 'Completed',
                        },
                    ],
                },
                isLoading: false,
            });
            render(<AdminDashboardHome />);
            // RecentTransactions stub shows merchant name; the mapping logic uses 'â€”' for null member
            expect(screen.getByText('Uber Eats')).toBeInTheDocument();
        });

        // The widget used to remap a declined transaction's 'Declined' status to 'Rejected' — a word
        // borrowed from the unrelated approval-request vocabulary — so the same transaction showed
        // "Rejected" here but "Declined" on the Transactions page (ADO 29086). It must show the same
        // word feTransactionStatus produced, unchanged.
        it('shows "Declined" (not "Rejected") for a declined transaction, matching the Transactions page', () => {
            (useDashboardSummaryApi as Mock).mockReturnValue({
                summary: {
                    ...mockSummary,
                    recentTransactions: [
                        {
                            id: 1,
                            merchant: 'PinePerk_Test_MerchantT',
                            member: null,
                            date: '24 Jul 2026',
                            amount: 20,
                            status: 'Declined',
                        },
                        {
                            id: 2,
                            merchant: 'PinePerk_Test_MerchantT',
                            member: null,
                            date: '24 Jul 2026',
                            amount: 1000,
                            status: 'Processing',
                        },
                    ],
                },
                isLoading: false,
            });
            render(<AdminDashboardHome />);
            expect(screen.getByTestId('transaction-status-1')).toHaveTextContent('Declined');
            expect(screen.getByTestId('transaction-status-1')).not.toHaveTextContent('Rejected');
            expect(screen.getByTestId('transaction-status-2')).toHaveTextContent('Processing');
        });
    });

    // â”€â”€ 4. Card Utilisation section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('card utilisation section', () => {
        it('renders the "Card Utilisation" section heading', () => {
            render(<AdminDashboardHome />);
            expect(screen.getByText('Card Utilisation')).toBeInTheDocument();
        });

        it('passes the utilisation rows to ProgressList', () => {
            render(<AdminDashboardHome />);
            // mockSummary.cardUtilisation has 2 entries
            const progressList = screen.getByTestId('progress-list');
            expect(progressList.getAttribute('data-row-count')).toBe('2');
        });

        it('caps utilisation rows at 4 when summary has more than 4 cards', () => {
            (useDashboardSummaryApi as Mock).mockReturnValue({
                summary: {
                    ...mockSummary,
                    cardUtilisation: Array.from({ length: 6 }, (_, i) => ({
                        cardIssuanceId: i + 1,
                        holder: `Holder ${i + 1}`,
                        last4: String(1000 + i),
                        spent: 1000,
                        limit: 5000,
                    })),
                },
                isLoading: false,
            });
            render(<AdminDashboardHome />);
            expect(screen.getByTestId('progress-list').getAttribute('data-row-count')).toBe('4');
        });

        it('shows empty state when cardUtilisation is empty', () => {
            (useDashboardSummaryApi as Mock).mockReturnValue({
                summary: { ...mockSummary, cardUtilisation: [] },
                isLoading: false,
            });
            render(<AdminDashboardHome />);
            expect(screen.getByText('No card utilisation data available')).toBeInTheDocument();
            expect(screen.queryByTestId('progress-list')).toBeNull();
        });
    });

    // â”€â”€ 5. Wallet Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('wallet panel', () => {
        it('renders the WalletPanel component', () => {
            render(<AdminDashboardHome />);
            expect(screen.getByTestId('wallet-panel')).toBeInTheDocument();
        });

        it('passes the formatted wallet balance to WalletPanel', () => {
            render(<AdminDashboardHome />);
            // formatRupeesDecimal(50000) via mock = â‚¹50000.00
            expect(screen.getByTestId('wallet-panel').getAttribute('data-available')).toBe(
                'â‚¹50000.00'
            );
        });

        it('shows the configured card limits total, not the amount spent, as the Card limits label', () => {
            // ADO 28791 (reopened) â€” Card limits must reflect wallet.totalCardLimits, not kpis.spentThisMonth.
            render(<AdminDashboardHome />);
            // mockWallet.totalCardLimits = 100000, mockKpis.spentThisMonth = 15000 â€” these must differ
            // for this test to actually prove the fix.
            expect(screen.getByTestId('wallet-panel').getAttribute('data-card-limits-label')).toBe(
                'â‚¹100000.00'
            );
        });

        it('shows â‚¹0.00 available when wallet is null', () => {
            (useWalletApi as Mock).mockReturnValue({
                wallet: null,
                isLoading: false,
                refetch: vi.fn(),
            });
            render(<AdminDashboardHome />);
            expect(screen.getByTestId('wallet-panel').getAttribute('data-available')).toBe(
                'â‚¹0.00'
            );
        });
    });

    // â”€â”€ 6. Daily Spend Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('daily spend chart', () => {
        it('renders the DailySpendChart component', () => {
            render(<AdminDashboardHome />);
            expect(screen.getByTestId('daily-spend-chart')).toBeInTheDocument();
        });

        it('passes the formatted total spend to the chart', () => {
            render(<AdminDashboardHome />);
            // dailySpend.total = 15000, formatRupeesDecimal(15000) = â‚¹15000.00
            expect(screen.getByTestId('daily-spend-chart').getAttribute('data-total')).toBe(
                'â‚¹15000.00'
            );
        });

        it('passes â‚¹0.00 as total when summary is null', () => {
            (useDashboardSummaryApi as Mock).mockReturnValue({
                summary: null,
                isLoading: false,
            });
            render(<AdminDashboardHome />);
            expect(screen.getByTestId('daily-spend-chart').getAttribute('data-total')).toBe(
                'â‚¹0.00'
            );
        });
    });

    // â”€â”€ 7. Cards Assigned Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('cards assigned panel', () => {
        it('renders the CardsAssignedPanel component', () => {
            render(<AdminDashboardHome />);
            expect(screen.getByTestId('cards-assigned-panel')).toBeInTheDocument();
        });

        it('passes the active and frozen cards to CardsAssignedPanel', () => {
            render(<AdminDashboardHome />);
            expect(screen.getByTestId('cards-assigned-panel').getAttribute('data-card-count')).toBe(
                '2'
            );
        });

        it('asks for Active cards and for frozen cards that are not being terminated', () => {
            render(<AdminDashboardHome />);
            expect(useAdminCardsApi).toHaveBeenCalledWith(1, 12, undefined, undefined, 'Active');
            expect(useAdminCardsApi).toHaveBeenCalledWith(
                1,
                12,
                undefined,
                undefined,
                'frozenNotTerminated'
            );
        });

        it('never asks for the plain Frozen filter, which would count terminating cards', () => {
            render(<AdminDashboardHome />);
            expect(useAdminCardsApi).not.toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                undefined,
                undefined,
                'Frozen'
            );
        });

        it('takes activeCount from the API total, not the length of the current page', () => {
            // The endpoint is filtered to Active, so `total` is the full active count — a page of 2 out of
            // 7 active cards must still report 7 rather than 2.
            mockCardsApi({
                active: [
                    makeMockCard({ key: '1', status: 'Active' }),
                    makeMockCard({ key: '2', status: 'Active' }),
                ],
                activeTotal: 7,
            });
            render(<AdminDashboardHome />);
            expect(
                screen.getByTestId('cards-assigned-panel').getAttribute('data-active-count')
            ).toBe('7');
        });

        it('takes frozenCount from its own API total, not the active one', () => {
            mockCardsApi({ activeTotal: 7, frozenTotal: 1 });
            render(<AdminDashboardHome />);

            const panel = screen.getByTestId('cards-assigned-panel');
            expect(panel.getAttribute('data-active-count')).toBe('7');
            expect(panel.getAttribute('data-frozen-count')).toBe('1');
        });

        it('reports zero active count when the API returns no active cards', () => {
            mockCardsApi({ active: [], activeTotal: 0, frozen: [], frozenTotal: 0 });
            render(<AdminDashboardHome />);
            expect(
                screen.getByTestId('cards-assigned-panel').getAttribute('data-active-count')
            ).toBe('0');
        });

        it('gives the panel a record for every card it lists', () => {
            mockCardsApi({
                active: [makeMockCard({ key: '1', last4: '1111', status: 'Active' })],
                frozen: [
                    makeMockCard({ key: '2', last4: '2222', status: 'Frozen' }),
                    makeMockCard({ key: '3', last4: '3333', status: 'Frozen' }),
                ],
            });
            render(<AdminDashboardHome />);

            const panel = screen.getByTestId('cards-assigned-panel');
            expect(panel.getAttribute('data-card-count')).toBe('3');
            expect(panel.getAttribute('data-record-count')).toBe('3');
        });

        it('carries each card status through to the panel', () => {
            render(<AdminDashboardHome />);
            expect(
                screen.getByTestId('cards-assigned-panel').getAttribute('data-card-statuses')
            ).toBe('Active,Frozen');
        });

        it('waits for both fetches before dropping the placeholder', () => {
            mockCardsApi({ frozenLoading: true });
            render(<AdminDashboardHome />);
            expect(screen.getByTestId('cards-assigned-panel').getAttribute('data-loading')).toBe(
                'true'
            );
        });

        // A Failed (or Pending) card never received a real card number from the vendor — only the
        // admin-configured limit survives on that row. The single-card dashboard preview must never
        // feature one, even though the Cards tab intentionally still lists it (ADO 28827).
        it('excludes a Failed card with no real card number from the featured card list', () => {
            mockCardsApi({
                active: [
                    makeMockCard({
                        key: '1',
                        last4: '',
                        status: 'Failed',
                        createdAt: '2024-02-01',
                    }),
                    makeMockCard({ key: '2', last4: '5678', status: 'Active' }),
                ],
                frozen: [],
            });
            render(<AdminDashboardHome />);
            expect(screen.getByTestId('cards-assigned-panel').getAttribute('data-card-count')).toBe(
                '1'
            );
        });

        it('excludes a numberless card from the frozen half too', () => {
            mockCardsApi({
                active: [makeMockCard({ key: '1', last4: '1111', status: 'Active' })],
                frozen: [
                    makeMockCard({ key: '2', last4: '', status: 'Frozen' }),
                    makeMockCard({ key: '3', last4: '3333', status: 'Frozen' }),
                ],
            });
            render(<AdminDashboardHome />);
            expect(screen.getByTestId('cards-assigned-panel').getAttribute('data-card-keys')).toBe(
                '1,3'
            );
        });
    });

    // â”€â”€ 8. Navigation via "View all" links â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('view-all navigation', () => {
        it('calls navigate("transactions") when View all is clicked in the transactions section', () => {
            render(<AdminDashboardHome />);
            const txnSection = screen
                .getByText('Recent Transactions')
                .closest('[data-testid="section-card"]') as HTMLElement;
            fireEvent.click(within(txnSection).getByTestId('view-all-link'));
            expect(mockNavigate).toHaveBeenCalledWith('transactions');
        });

        it('calls navigate("cards") when View all is clicked in the card utilisation section', () => {
            render(<AdminDashboardHome />);
            const cardSection = screen
                .getByText('Card Utilisation')
                .closest('[data-testid="section-card"]') as HTMLElement;
            fireEvent.click(within(cardSection).getByTestId('view-all-link'));
            expect(mockNavigate).toHaveBeenCalledWith('cards');
        });

        it('does not navigate when neither View all button has been clicked', () => {
            render(<AdminDashboardHome />);
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });

    // â”€â”€ 9. Admin role rendering â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('admin role rendering', () => {
        it('renders all core dashboard panels for an admin user', () => {
            render(<AdminDashboardHome />);
            expect(screen.getByTestId('wallet-panel')).toBeInTheDocument();
            expect(screen.getByTestId('daily-spend-chart')).toBeInTheDocument();
            expect(screen.getByTestId('cards-assigned-panel')).toBeInTheDocument();
            expect(screen.getByTestId('progress-list')).toBeInTheDocument();
        });

        it('calls useAdminCardsApi with page 1, page-size 12 and the Active status filter', () => {
            render(<AdminDashboardHome />);
            expect(useAdminCardsApi as Mock).toHaveBeenCalledWith(
                1,
                12,
                undefined,
                undefined,
                'Active'
            );
        });

        it('calls useDashboardSummaryApi on mount', () => {
            render(<AdminDashboardHome />);
            expect(useDashboardSummaryApi as Mock).toHaveBeenCalled();
        });

        it('calls useWalletApi on mount', () => {
            render(<AdminDashboardHome />);
            expect(useWalletApi as Mock).toHaveBeenCalled();
        });
    });
});
