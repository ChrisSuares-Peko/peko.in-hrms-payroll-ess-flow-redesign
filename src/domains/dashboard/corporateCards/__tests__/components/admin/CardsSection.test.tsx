import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import CardsSection from '../../../components/admin/CardsSection';
import { useAdminCardsApi } from '../../../hooks/admin/useAdminCardsApi';
import { useWalletApi } from '../../../hooks/admin/useWalletApi';
import { useCardQuotaApi } from '../../../hooks/user/useCardQuotaApi';
import { CardRecord } from '../../../utils/types';

// ---------------------------------------------------------------------------
// Hook mocks
// ---------------------------------------------------------------------------

vi.mock('../../../hooks/admin/useAdminCardsApi', () => ({
    useAdminCardsApi: vi.fn(),
}));

// The "X cards issued" headline reads wallet.cardCount (a dedicated, filter-independent count scoped
// to actually-ISSUED cards), not the paginated cards-list `total` (ADO 29054).
vi.mock('../../../hooks/user/useCardQuotaApi', () => ({
    useCardQuotaApi: vi.fn(),
}));
vi.mock('../../../hooks/admin/useWalletApi', () => ({
    useWalletApi: vi.fn(() => ({ wallet: { cardCount: 11 }, isLoading: false, refetch: vi.fn() })),
}));

// Cardholder filter options come from the cardholders API, as dropdown-ready options.
vi.mock('../../../hooks/admin/useCardholderOptions', () => ({
    useCardholderOptions: vi.fn(() => [
        { label: 'Alice Adams', value: '101' },
        { label: 'Bob Baker', value: '102' },
    ]),
}));

vi.mock('@src/hooks/useDebounce', () => ({
    default: (value: unknown) => value,
}));

// ---------------------------------------------------------------------------
// Heavy component mocks
// ---------------------------------------------------------------------------

vi.mock('@components/atomic/GenericTable', () => ({
    default: ({ columns, dataSource, loading }: any) => {
        if (loading) return <div data-testid="table-loading">Loading</div>;
        return (
            <div data-testid="generic-table">
                {(dataSource ?? []).map((row: any) => {
                    const actionsCol = columns?.find((c: any) => c.key === 'actions');
                    const perTxnLimitCol = columns?.find((c: any) => c.key === 'perTxnLimit');
                    return (
                        <div key={row.key} data-testid="table-row">
                            <span data-testid={`last4-${row.key}`}>**** **** **** {row.last4}</span>
                            <span data-testid={`holder-${row.key}`}>{row.holder}</span>
                            <span data-testid={`type-${row.key}`}>{row.type}</span>
                            <span data-testid={`perTxnLimit-${row.key}`}>
                                {perTxnLimitCol?.render?.(row.perTxnLimit, row)}
                            </span>
                            {actionsCol?.render?.(row.key, row)}
                        </div>
                    );
                })}
            </div>
        );
    },
}));

vi.mock('../../../components/admin/ManageCardModal', () => ({
    default: ({ card, onClose }: any) =>
        card ? (
            <div data-testid="manage-card-modal" data-last4={card.last4}>
                <button type="button" onClick={onClose}>
                    Close manage
                </button>
            </div>
        ) : null,
}));

vi.mock('../../../components/admin/BulkCardActionModal', () => ({
    default: ({ open, mode, onClose }: any) =>
        open ? (
            <div data-testid="bulk-card-modal" data-mode={mode}>
                <button type="button" onClick={onClose}>
                    Close bulk
                </button>
            </div>
        ) : null,
    BulkCardMode: {},
}));

vi.mock('../../../components/admin/IssueCardDrawer', () => ({
    default: ({ open, onClose }: any) =>
        open ? (
            <div data-testid="issue-card-drawer">
                <button type="button" onClick={onClose}>
                    Close drawer
                </button>
            </div>
        ) : null,
}));

vi.mock('../../../components/admin/RequestPhysicalCardModal', () => ({
    default: ({ open, onClose, holderName }: any) =>
        open ? (
            <div data-testid="request-physical-modal" data-holder={holderName}>
                <button type="button" onClick={onClose}>
                    Close request
                </button>
            </div>
        ) : null,
}));

// Fetches on mount through the auth slice, which this suite has no Provider for; its own behaviour is
// covered in PhysicalCardTrackingSection.test.tsx.
vi.mock('../../../components/admin/PhysicalCardTrackingSection', () => ({
    default: ({ showMember }: any) => (
        <div data-testid="physical-card-tracking" data-show-member={String(showMember)} />
    ),
}));

vi.mock('../../../components/admin/AuditTrailModal', () => ({
    default: ({ open, onClose, last4 }: any) =>
        open ? (
            <div data-testid="audit-trail-modal" data-last4={last4}>
                <button type="button" onClick={onClose}>
                    Close audit
                </button>
            </div>
        ) : null,
}));

vi.mock('../../../components/common/CardThumb', () => ({
    default: () => <div data-testid="card-thumb" />,
}));

vi.mock('../../../components/common/PageTabs', () => ({
    default: ({ tabs, activeKey, onChange }: any) => (
        <div data-testid="page-tabs">
            {tabs.map((tab: any) => (
                <button
                    type="button"
                    key={tab.key}
                    data-testid={`tab-${tab.key}`}
                    data-active={String(activeKey === tab.key)}
                    onClick={() => onChange(tab.key)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    ),
}));

vi.mock('../../../components/common/StatusTag', () => ({
    default: ({ status }: any) => <span data-testid="status-tag">{status}</span>,
}));

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

const mockRefetch = vi.fn();

const makeCard = (overrides: Partial<CardRecord> = {}): CardRecord => ({
    key: 'card-1',
    last4: '1294',
    holder: 'Anto Rebe',
    department: 'Sales',
    avatarText: 'AR',
    type: 'Virtual',
    status: 'Active',
    cardLimit: 15000,
    perTxnLimit: 15000,
    spent: 9200,
    remaining: 5800,
    ...overrides,
});

const defaultApiReturn = {
    cards: [],
    total: 0,
    isLoading: false,
    refetch: mockRefetch,
};

const quotaReturn = (overrides: Record<string, number> = {}) => ({
    quota: {
        used: 0,
        included: 1,
        purchased: 0,
        allowed: 1,
        remaining: 1,
        requiresPayment: false,
        unitPrice: 19,
        purchasable: true,
        ...overrides,
    },
    isLoading: false,
    refetchQuota: vi.fn(),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CardsSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAdminCardsApi as Mock).mockReturnValue(defaultApiReturn);
        (useWalletApi as Mock).mockReturnValue({
            wallet: { cardCount: 11 },
            isLoading: false,
            refetch: vi.fn(),
        });
        (useCardQuotaApi as Mock).mockReturnValue(quotaReturn());
    });

    // -----------------------------------------------------------------------
    describe('physical card allowance', () => {
        it('shows the allowance when the plan includes physical cards', () => {
            (useCardQuotaApi as Mock).mockReturnValue(
                quotaReturn({ included: 5, allowed: 5, used: 2, remaining: 3 })
            );
            render(<CardsSection />);

            expect(screen.getByText('Physical cards on your plan')).toBeInTheDocument();
            expect(screen.getByText('2 of 5 used')).toBeInTheDocument();
            expect(screen.getByText(/5 included in your plan/)).toBeInTheDocument();
        });

        it('stays hidden when the plan includes none, even after extra cards were bought', () => {
            (useCardQuotaApi as Mock).mockReturnValue(
                quotaReturn({ included: 0, purchased: 2, allowed: 2, used: 2, remaining: 0 })
            );
            render(<CardsSection />);

            expect(screen.queryByText('Physical cards on your plan')).not.toBeInTheDocument();
        });

        it('stays hidden while the allowance is still unknown', () => {
            (useCardQuotaApi as Mock).mockReturnValue({
                quota: null,
                isLoading: true,
                refetchQuota: vi.fn(),
            });
            render(<CardsSection />);

            expect(screen.queryByText('Physical cards on your plan')).not.toBeInTheDocument();
        });

        it('counts purchased extras into the allowance it reports', () => {
            (useCardQuotaApi as Mock).mockReturnValue(
                quotaReturn({ included: 5, purchased: 1, allowed: 6, used: 6, remaining: 0 })
            );
            render(<CardsSection />);

            expect(screen.getByText('6 of 6 used')).toBeInTheDocument();
            expect(screen.getByText(/5 included in your plan · 1 purchased/)).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    describe('header section', () => {
        it('renders the Cards heading', () => {
            render(<CardsSection />);
            expect(screen.getByRole('heading', { name: /cards/i })).toBeInTheDocument();
        });

        it('shows the wallet-reported issued card count in the subtitle', () => {
            (useWalletApi as Mock).mockReturnValue({
                wallet: { cardCount: 7 },
                isLoading: false,
                refetch: vi.fn(),
            });
            render(<CardsSection />);
            expect(screen.getByText(/7 cards issued/i)).toBeInTheDocument();
        });

        // ADO 29054 — the headline previously read the paginated cards-list `total`, which (under the
        // default 'All' status filter) includes Pending/Failed cards, so a failed card request was
        // miscounted as "issued". wallet.cardCount is scoped to actually-ISSUED cards regardless of
        // whatever the table's own Status filter/total currently is.
        it('does not count Pending/Failed cards toward "cards issued" (uses wallet.cardCount, not the filtered total)', () => {
            (useAdminCardsApi as Mock).mockReturnValue({ ...defaultApiReturn, total: 13 });
            (useWalletApi as Mock).mockReturnValue({
                wallet: { cardCount: 11 },
                isLoading: false,
                refetch: vi.fn(),
            });
            render(<CardsSection />);
            expect(screen.getByText(/11 cards issued/i)).toBeInTheDocument();
            expect(screen.queryByText(/13 cards issued/i)).toBeNull();
        });

        it('shows 0 cards issued while the wallet summary is still loading', () => {
            (useWalletApi as Mock).mockReturnValue({
                wallet: null,
                isLoading: true,
                refetch: vi.fn(),
            });
            render(<CardsSection />);
            expect(screen.getByText(/0 cards issued/i)).toBeInTheDocument();
        });

        // The subtitle used to print a hardcoded CARDS_WALLET_BALANCE (₹60,000) demo constant, so every
        // corporate saw the same fake balance next to their real card count. It must read the live wallet.
        it('shows the live wallet balance in the subtitle', () => {
            (useWalletApi as Mock).mockReturnValue({
                wallet: { cardCount: 11, balance: 24500 },
                isLoading: false,
                refetch: vi.fn(),
            });
            render(<CardsSection />);
            expect(screen.getByText(/wallet balance \(currently ₹24,500/i)).toBeInTheDocument();
            expect(screen.queryByText(/₹60,000/)).toBeNull();
        });

        it('falls back to ₹0 in the subtitle while the wallet is still loading', () => {
            (useWalletApi as Mock).mockReturnValue({
                wallet: null,
                isLoading: true,
                refetch: vi.fn(),
            });
            render(<CardsSection />);
            expect(screen.getByText(/wallet balance \(currently ₹0/i)).toBeInTheDocument();
        });

        it('renders the Issue card button', () => {
            render(<CardsSection />);
            expect(screen.getByRole('button', { name: /issue card/i })).toBeInTheDocument();
        });

        it('renders the Bulk freeze button', () => {
            render(<CardsSection />);
            expect(screen.getByRole('button', { name: /bulk freeze/i })).toBeInTheDocument();
        });

        it('renders the Bulk unfreeze button', () => {
            render(<CardsSection />);
            expect(screen.getByRole('button', { name: /bulk unfreeze/i })).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    describe('filter bar', () => {
        it('renders the Cardholder filter label', () => {
            render(<CardsSection />);
            expect(screen.getByText('Cardholder')).toBeInTheDocument();
        });

        it('renders the Status filter label', () => {
            render(<CardsSection />);
            expect(screen.getByText('Status')).toBeInTheDocument();
        });

        it('renders the Search filter label', () => {
            render(<CardsSection />);
            expect(screen.getByText('Search')).toBeInTheDocument();
        });

        it('renders the search input with correct placeholder', () => {
            render(<CardsSection />);
            expect(screen.getByPlaceholderText('Search for cards')).toBeInTheDocument();
        });

        it('renders the Clear filters button', () => {
            render(<CardsSection />);
            expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
        });

        it('clears the search field when Clear is clicked', () => {
            render(<CardsSection />);
            const searchInput = screen.getByPlaceholderText('Search for cards');
            fireEvent.change(searchInput, { target: { value: 'Anto' } });
            expect((searchInput as HTMLInputElement).value).toBe('Anto');

            fireEvent.click(screen.getByRole('button', { name: /clear/i }));
            expect((searchInput as HTMLInputElement).value).toBe('');
        });

        // ADO 29056 — the table renders cards with status 'Failed' (issuance failed at the vendor), but
        // the Status filter's option list never included it, so there was no way to filter down to them.
        // antd's Select placeholder is a rendered <span>, not an HTML `placeholder` attribute — the
        // Cardholder filter is the first combobox on the page, Status the second.
        it('offers a Failed option in the Status filter dropdown', () => {
            render(<CardsSection />);
            const statusSelect = screen.getAllByRole('combobox')[1];
            fireEvent.mouseDown(statusSelect);
            expect(screen.getByText('Failed')).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    describe('type tabs', () => {
        it('renders All cards, Virtual, and Physical tabs', () => {
            render(<CardsSection />);
            expect(screen.getByTestId('tab-all')).toHaveTextContent('All cards');
            expect(screen.getByTestId('tab-virtual')).toHaveTextContent('Virtual');
            expect(screen.getByTestId('tab-physical')).toHaveTextContent('Physical');
        });

        it('the All cards tab is active by default', () => {
            render(<CardsSection />);
            expect(screen.getByTestId('tab-all').dataset.active).toBe('true');
            expect(screen.getByTestId('tab-virtual').dataset.active).toBe('false');
            expect(screen.getByTestId('tab-physical').dataset.active).toBe('false');
        });

        it('switches active tab when a tab is clicked', () => {
            render(<CardsSection />);
            fireEvent.click(screen.getByTestId('tab-virtual'));
            expect(screen.getByTestId('tab-virtual').dataset.active).toBe('true');
            expect(screen.getByTestId('tab-all').dataset.active).toBe('false');
        });
    });

    // -----------------------------------------------------------------------
    describe('table states', () => {
        it('shows the loading indicator when isLoading is true', () => {
            (useAdminCardsApi as Mock).mockReturnValue({ ...defaultApiReturn, isLoading: true });
            render(<CardsSection />);
            expect(screen.getByTestId('table-loading')).toBeInTheDocument();
        });

        it('does not show loading indicator when data has loaded', () => {
            render(<CardsSection />);
            expect(screen.queryByTestId('table-loading')).toBeNull();
        });

        it('renders no rows when the cards list is empty', () => {
            render(<CardsSection />);
            expect(screen.queryAllByTestId('table-row')).toHaveLength(0);
        });

        it('renders one row per card returned from the API', () => {
            const cards = [
                makeCard({ key: 'c1', last4: '1294' }),
                makeCard({ key: 'c2', last4: '4821', holder: 'John Doe' }),
            ];
            (useAdminCardsApi as Mock).mockReturnValue({ ...defaultApiReturn, cards, total: 2 });
            render(<CardsSection />);
            expect(screen.getAllByTestId('table-row')).toHaveLength(2);
        });

        it('shows the masked card number for each row', () => {
            const card = makeCard({ key: 'c1', last4: '9999' });
            (useAdminCardsApi as Mock).mockReturnValue({
                ...defaultApiReturn,
                cards: [card],
                total: 1,
            });
            render(<CardsSection />);
            expect(screen.getByTestId('last4-c1')).toHaveTextContent('**** **** **** 9999');
        });

        it('shows the cardholder name for each row', () => {
            const card = makeCard({ key: 'c1', holder: 'Priya Sharma' });
            (useAdminCardsApi as Mock).mockReturnValue({
                ...defaultApiReturn,
                cards: [card],
                total: 1,
            });
            render(<CardsSection />);
            expect(screen.getByTestId('holder-c1')).toHaveTextContent('Priya Sharma');
        });

        it('shows the card type (Virtual) for each row', () => {
            const card = makeCard({ key: 'c1', type: 'Virtual' });
            (useAdminCardsApi as Mock).mockReturnValue({
                ...defaultApiReturn,
                cards: [card],
                total: 1,
            });
            render(<CardsSection />);
            expect(screen.getByTestId('type-c1')).toHaveTextContent('Virtual');
        });

        it('shows the card type (Physical) for each row', () => {
            const card = makeCard({ key: 'c1', type: 'Physical' });
            (useAdminCardsApi as Mock).mockReturnValue({
                ...defaultApiReturn,
                cards: [card],
                total: 1,
            });
            render(<CardsSection />);
            expect(screen.getByTestId('type-c1')).toHaveTextContent('Physical');
        });

        // ADO 29061 — an unset per-transaction limit was displayed as ₹0.00, misleading admins into
        // thinking every transaction was blocked rather than the field being unconfigured.
        it('shows "—" for an unset per-transaction limit instead of ₹0.00', () => {
            const card = makeCard({ key: 'c1', perTxnLimit: null });
            (useAdminCardsApi as Mock).mockReturnValue({
                ...defaultApiReturn,
                cards: [card],
                total: 1,
            });
            render(<CardsSection />);
            expect(screen.getByTestId('perTxnLimit-c1')).toHaveTextContent('—');
        });

        it('shows the formatted amount when a per-transaction limit is actually configured', () => {
            const card = makeCard({ key: 'c1', perTxnLimit: 500 });
            (useAdminCardsApi as Mock).mockReturnValue({
                ...defaultApiReturn,
                cards: [card],
                total: 1,
            });
            render(<CardsSection />);
            expect(screen.getByTestId('perTxnLimit-c1')).toHaveTextContent('₹500.00');
        });

        it('renders all card rows returned by the API (cardholder filtering is server-side)', () => {
            const cards = [
                makeCard({ key: 'c1', holder: 'Alice Adams' }),
                makeCard({ key: 'c2', holder: 'Bob Baker', last4: '4321' }),
            ];
            (useAdminCardsApi as Mock).mockReturnValue({ ...defaultApiReturn, cards, total: 2 });

            render(<CardsSection />);
            expect(screen.getAllByTestId('table-row')).toHaveLength(2);
        });
    });

    // -----------------------------------------------------------------------
    describe('modal and drawer interactions', () => {
        it('IssueCardDrawer is closed initially', () => {
            render(<CardsSection />);
            expect(screen.queryByTestId('issue-card-drawer')).toBeNull();
        });

        it('opens IssueCardDrawer when Issue card button is clicked', () => {
            render(<CardsSection />);
            fireEvent.click(screen.getByRole('button', { name: /issue card/i }));
            expect(screen.getByTestId('issue-card-drawer')).toBeInTheDocument();
        });

        it('closes IssueCardDrawer when its close button is clicked', () => {
            render(<CardsSection />);
            fireEvent.click(screen.getByRole('button', { name: /issue card/i }));
            expect(screen.getByTestId('issue-card-drawer')).toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: /close drawer/i }));
            expect(screen.queryByTestId('issue-card-drawer')).toBeNull();
        });

        it('BulkCardActionModal is closed initially', () => {
            render(<CardsSection />);
            expect(screen.queryByTestId('bulk-card-modal')).toBeNull();
        });

        it('opens BulkCardActionModal with freeze mode when Bulk freeze is clicked', () => {
            render(<CardsSection />);
            fireEvent.click(screen.getByRole('button', { name: /bulk freeze/i }));
            const modal = screen.getByTestId('bulk-card-modal');
            expect(modal).toBeInTheDocument();
            expect(modal.dataset.mode).toBe('freeze');
        });

        it('opens BulkCardActionModal with unfreeze mode when Bulk unfreeze is clicked', () => {
            render(<CardsSection />);
            fireEvent.click(screen.getByRole('button', { name: /bulk unfreeze/i }));
            const modal = screen.getByTestId('bulk-card-modal');
            expect(modal).toBeInTheDocument();
            expect(modal.dataset.mode).toBe('unfreeze');
        });

        it('closes BulkCardActionModal when its close button is clicked', () => {
            render(<CardsSection />);
            fireEvent.click(screen.getByRole('button', { name: /bulk freeze/i }));
            expect(screen.getByTestId('bulk-card-modal')).toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: /close bulk/i }));
            expect(screen.queryByTestId('bulk-card-modal')).toBeNull();
        });

        it('ManageCardModal is closed initially', () => {
            const card = makeCard({ key: 'c1' });
            (useAdminCardsApi as Mock).mockReturnValue({
                ...defaultApiReturn,
                cards: [card],
                total: 1,
            });
            render(<CardsSection />);
            expect(screen.queryByTestId('manage-card-modal')).toBeNull();
        });

        it('opens ManageCardModal when the Manage card action button is clicked', async () => {
            const card = makeCard({ key: 'c1', last4: '1294' });
            (useAdminCardsApi as Mock).mockReturnValue({
                ...defaultApiReturn,
                cards: [card],
                total: 1,
            });
            render(<CardsSection />);

            fireEvent.click(screen.getByRole('button', { name: 'Manage card' }));
            await waitFor(() => {
                const modal = screen.getByTestId('manage-card-modal');
                expect(modal).toBeInTheDocument();
                expect(modal.dataset.last4).toBe('1294');
            });
        });

        it('closes ManageCardModal when its close button is clicked', async () => {
            const card = makeCard({ key: 'c1' });
            (useAdminCardsApi as Mock).mockReturnValue({
                ...defaultApiReturn,
                cards: [card],
                total: 1,
            });
            render(<CardsSection />);

            fireEvent.click(screen.getByRole('button', { name: 'Manage card' }));
            await waitFor(() =>
                expect(screen.getByTestId('manage-card-modal')).toBeInTheDocument()
            );

            fireEvent.click(screen.getByRole('button', { name: /close manage/i }));
            await waitFor(() => expect(screen.queryByTestId('manage-card-modal')).toBeNull());
        });

        // A 'Failed' card never got issued at the vendor, so freeze/limits/terminate would all act on a
        // card that does not exist. The row keeps its Audit trail action — that is what explains the
        // failure — but must not offer Manage card.
        it('does not render the Manage card action for a Failed card', () => {
            const card = makeCard({ key: 'c1', status: 'Failed' });
            (useAdminCardsApi as Mock).mockReturnValue({
                ...defaultApiReturn,
                cards: [card],
                total: 1,
            });
            render(<CardsSection />);
            expect(screen.queryByRole('button', { name: 'Manage card' })).toBeNull();
        });

        it('still renders the Audit trail action for a Failed card', () => {
            const card = makeCard({ key: 'c1', status: 'Failed' });
            (useAdminCardsApi as Mock).mockReturnValue({
                ...defaultApiReturn,
                cards: [card],
                total: 1,
            });
            render(<CardsSection />);
            expect(screen.getByRole('button', { name: 'Audit trail' })).toBeInTheDocument();
        });

        it.each(['Active', 'Frozen', 'Pending'] as const)(
            'renders the Manage card action for a %s card',
            status => {
                const card = makeCard({ key: 'c1', status });
                (useAdminCardsApi as Mock).mockReturnValue({
                    ...defaultApiReturn,
                    cards: [card],
                    total: 1,
                });
                render(<CardsSection />);
                expect(screen.getByRole('button', { name: 'Manage card' })).toBeInTheDocument();
            }
        );

        it('AuditTrailModal is closed initially', () => {
            const card = makeCard({ key: 'c1' });
            (useAdminCardsApi as Mock).mockReturnValue({
                ...defaultApiReturn,
                cards: [card],
                total: 1,
            });
            render(<CardsSection />);
            expect(screen.queryByTestId('audit-trail-modal')).toBeNull();
        });

        it('opens AuditTrailModal with the correct last4 when Audit trail is clicked', async () => {
            const card = makeCard({ key: 'c1', last4: '7733' });
            (useAdminCardsApi as Mock).mockReturnValue({
                ...defaultApiReturn,
                cards: [card],
                total: 1,
            });
            render(<CardsSection />);

            fireEvent.click(screen.getByRole('button', { name: 'Audit trail' }));
            await waitFor(() => {
                const modal = screen.getByTestId('audit-trail-modal');
                expect(modal).toBeInTheDocument();
                expect(modal.dataset.last4).toBe('7733');
            });
        });

        it('closes AuditTrailModal when its close button is clicked', async () => {
            const card = makeCard({ key: 'c1' });
            (useAdminCardsApi as Mock).mockReturnValue({
                ...defaultApiReturn,
                cards: [card],
                total: 1,
            });
            render(<CardsSection />);

            fireEvent.click(screen.getByRole('button', { name: 'Audit trail' }));
            await waitFor(() =>
                expect(screen.getByTestId('audit-trail-modal')).toBeInTheDocument()
            );

            fireEvent.click(screen.getByRole('button', { name: /close audit/i }));
            await waitFor(() => expect(screen.queryByTestId('audit-trail-modal')).toBeNull());
        });
    });

    // -----------------------------------------------------------------------
    describe('useAdminCardsApi call parameters', () => {
        it('calls useAdminCardsApi with page 1 and pageSize 10 on mount', () => {
            render(<CardsSection />);
            expect(useAdminCardsApi as Mock).toHaveBeenCalledWith(
                1,
                10,
                undefined,
                undefined,
                undefined,
                undefined
            );
        });

        it('passes the Virtual type when Virtual tab is selected', () => {
            render(<CardsSection />);
            fireEvent.click(screen.getByTestId('tab-virtual'));
            expect(useAdminCardsApi as Mock).toHaveBeenCalledWith(
                1,
                10,
                'virtual',
                undefined,
                undefined,
                undefined
            );
        });

        it('passes undefined type when All cards tab is selected', () => {
            render(<CardsSection />);
            // click Virtual first, then back to all
            fireEvent.click(screen.getByTestId('tab-virtual'));
            fireEvent.click(screen.getByTestId('tab-all'));
            const { calls } = (useAdminCardsApi as Mock).mock;
            const lastCall = calls[calls.length - 1];
            expect(lastCall[2]).toBeUndefined();
        });
    });
});
