import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import useScreenSize from '@src/hooks/useScreenSize';

import WalletTab from '../../../components/wallet/WalletTab';
import { useAdminCardsApi } from '../../../hooks/admin/useAdminCardsApi';
import { useFundingAccountApi } from '../../../hooks/admin/useFundingAccountApi';
import { useWalletApi } from '../../../hooks/admin/useWalletApi';
import { useWalletTopUpsApi } from '../../../hooks/admin/useWalletTopUpsApi';

// ---------------------------------------------------------------------------
// Hook mocks
// ---------------------------------------------------------------------------

vi.mock('@src/hooks/useScreenSize', () => ({ default: vi.fn() }));

vi.mock('../../../hooks/admin/useWalletApi', () => ({
    useWalletApi: vi.fn(),
}));

vi.mock('../../../hooks/admin/useWalletTopUpsApi', () => ({
    useWalletTopUpsApi: vi.fn(),
}));

vi.mock('../../../hooks/admin/useAdminCardsApi', () => ({
    useAdminCardsApi: vi.fn(),
}));

vi.mock('../../../hooks/admin/useFundingAccountApi', () => ({
    useFundingAccountApi: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Component mocks
// ---------------------------------------------------------------------------

vi.mock('@components/atomic/GenericTable', () => ({
    default: ({ columns, dataSource, loading, summary, scroll }: any) => (
        <div
            data-testid="generic-table"
            data-loading={String(loading ?? false)}
            data-row-count={dataSource?.length ?? 0}
            data-has-summary={String(!!summary)}
            data-scroll-x={String(scroll?.x ?? '')}
        >
            {(dataSource ?? []).map((row: any) => (
                <div key={row.key} data-testid={`table-row-${row.key}`}>
                    {row.reference ?? row.holder ?? row.key}
                    {(columns ?? []).map((c: any) => (
                        <span key={c.key} data-testid={`cell-${c.key}-${row.key}`}>
                            {c.render ? c.render(row[c.dataIndex], row) : null}
                        </span>
                    ))}
                </div>
            ))}
        </div>
    ),
}));

vi.mock('../../../components/common/PageTabs', () => ({
    default: ({ tabs, activeKey, onChange }: any) => (
        <div data-testid="page-tabs">
            {(tabs ?? []).map((tab: any) => (
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

vi.mock('../../../components/wallet/TopUpModal', () => ({
    default: ({ open, onClose }: any) =>
        open ? (
            <div data-testid="topup-modal">
                <button type="button" data-testid="close-topup-modal" onClick={onClose}>
                    Close
                </button>
            </div>
        ) : null,
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockWallet = {
    balance: 250000,
    totalCardLimits: 500000,
    cardCount: 8,
    fundingAccount: {
        maskedAccountNumber: '1234',
        ifsc: 'HDFC0001234',
    },
};

const mockTopUp = (overrides = {}) => ({
    key: 'tu1',
    date: '12 Jan 2024',
    reference: 'REF-001',
    source: 'NEFT',
    status: 'Completed',
    amount: '+â‚¹1,00,000',
    ...overrides,
});

const mockCard = (overrides = {}) => ({
    key: 'c1',
    holder: 'Alice',
    last4: '1234',
    type: 'Virtual',
    status: 'Active',
    cardLimit: 50000,
    spent: 10000,
    remaining: 40000,
    ...overrides,
});

const defaultWalletReturn = { wallet: mockWallet, isLoading: false, refetch: vi.fn() };
const defaultTopUpsReturn = { topUps: [], isLoading: false, total: 0, refetch: vi.fn() };
const defaultCardsReturn = { cards: [], isLoading: false, total: 0, refetch: vi.fn() };
const defaultFundingReturn = { fundingAccount: null, isLoading: false };

/** Drives the one breakpoint WalletTab reads: xl is where all seven card-limit columns fit. */
const setWide = (wide: boolean) =>
    (useScreenSize as unknown as Mock).mockReturnValue(wide ? { xl: true } : {});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WalletTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useWalletApi as Mock).mockReturnValue(defaultWalletReturn);
        (useWalletTopUpsApi as Mock).mockReturnValue(defaultTopUpsReturn);
        (useAdminCardsApi as Mock).mockReturnValue(defaultCardsReturn);
        (useFundingAccountApi as Mock).mockReturnValue(defaultFundingReturn);
        setWide(true);
    });

    // -----------------------------------------------------------------------
    describe('header', () => {
        it('renders the Wallet heading', () => {
            render(<WalletTab />);
            expect(screen.getByRole('heading', { name: /wallet/i })).toBeInTheDocument();
        });

        it('renders the Top up wallet action button', () => {
            render(<WalletTab />);
            expect(screen.getByRole('button', { name: /top up wallet/i })).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    describe('wallet balance card', () => {
        it('shows the wallet balance when loaded', () => {
            render(<WalletTab />);
            // â‚¹2,50,000 in en-IN locale
            expect(screen.getByText(/2,50,000/)).toBeInTheDocument();
        });

        // The figure sits in the Card limits totals — the table footer row at xl, the strip below it. The
        // footer is a render prop the GenericTable stub records rather than invokes, so assert on the strip.
        it('shows total card limits in the Card limits totals', () => {
            setWide(false);
            render(<WalletTab />);
            fireEvent.click(screen.getByTestId('tab-card-limits'));
            expect(screen.getByText(/5,00,000/)).toBeInTheDocument();
        });

        it('shows the funding account when present', () => {
            render(<WalletTab />);
            expect(screen.getByText(/HDFC0001234/)).toBeInTheDocument();
        });

        it('does not render funding account section when absent', () => {
            (useWalletApi as Mock).mockReturnValue({
                wallet: { ...mockWallet, fundingAccount: null },
                isLoading: false,
                refetch: vi.fn(),
            });
            render(<WalletTab />);
            expect(screen.queryByText(/HDFC/)).toBeNull();
        });
    });

    // -----------------------------------------------------------------------
    describe('tabs', () => {
        it('renders Top-up history and Card limits tabs', () => {
            render(<WalletTab />);
            expect(screen.getByTestId('tab-topup-history')).toBeInTheDocument();
            expect(screen.getByTestId('tab-card-limits')).toBeInTheDocument();
        });

        it('has Top-up history tab active by default', () => {
            render(<WalletTab />);
            expect(screen.getByTestId('tab-topup-history').dataset.active).toBe('true');
            expect(screen.getByTestId('tab-card-limits').dataset.active).toBe('false');
        });

        it('switches to Card limits tab when clicked', () => {
            render(<WalletTab />);
            fireEvent.click(screen.getByTestId('tab-card-limits'));
            expect(screen.getByTestId('tab-card-limits').dataset.active).toBe('true');
        });
    });

    // -----------------------------------------------------------------------
    describe('Top-up history tab', () => {
        it('renders GenericTable on the top-up tab', () => {
            render(<WalletTab />);
            expect(screen.getByTestId('generic-table')).toBeInTheDocument();
        });

        it('passes top-up rows to the table', () => {
            (useWalletTopUpsApi as Mock).mockReturnValue({
                topUps: [mockTopUp({ key: 'tu1', reference: 'REF-001' })],
                isLoading: false,
                refetch: vi.fn(),
            });
            render(<WalletTab />);
            expect(screen.getByTestId('table-row-tu1')).toBeInTheDocument();
        });

        it('passes topUpsLoading to the table', () => {
            (useWalletTopUpsApi as Mock).mockReturnValue({
                topUps: [],
                isLoading: true,
                refetch: vi.fn(),
            });
            render(<WalletTab />);
            expect(screen.getByTestId('generic-table').dataset.loading).toBe('true');
        });
    });

    // -----------------------------------------------------------------------
    describe('Card limits tab', () => {
        it('shows card rows on the Card limits tab', () => {
            (useAdminCardsApi as Mock).mockReturnValue({
                cards: [mockCard({ key: 'c1', holder: 'Alice' })],
                isLoading: false,
                total: 1,
                refetch: vi.fn(),
            });
            render(<WalletTab />);
            fireEvent.click(screen.getByTestId('tab-card-limits'));
            expect(screen.getByTestId('table-row-c1')).toBeInTheDocument();
        });

        it('passes cardsLoading to the table on Card limits tab', () => {
            (useAdminCardsApi as Mock).mockReturnValue({
                cards: [],
                isLoading: true,
                total: 0,
                refetch: vi.fn(),
            });
            render(<WalletTab />);
            fireEvent.click(screen.getByTestId('tab-card-limits'));
            expect(screen.getByTestId('generic-table').dataset.loading).toBe('true');
        });
    });

    // -----------------------------------------------------------------------
    // The seven card-limit columns declare 1100px in total. Below xl, GenericTable leaves the ones that
    // do not fit out of the table, but a Table.Summary row always renders all seven cells — so the footer
    // came out wider than the body and broke the layout on a phone.
    describe('Card limits totals', () => {
        const openCardLimits = () => {
            render(<WalletTab />);
            fireEvent.click(screen.getByTestId('tab-card-limits'));
        };

        it('attaches the table summary row when every column fits', () => {
            setWide(true);
            openCardLimits();
            expect(screen.getByTestId('generic-table').dataset.hasSummary).toBe('true');
        });

        it('drops the summary row below xl, where the table is missing columns', () => {
            setWide(false);
            openCardLimits();
            expect(screen.getByTestId('generic-table').dataset.hasSummary).toBe('false');
        });

        it('shows the totals as a plain strip instead when the summary row is dropped', () => {
            setWide(false);
            openCardLimits();
            expect(screen.getByText('Total committed (caps)')).toBeInTheDocument();
            expect(screen.getByText('Wallet balance')).toBeInTheDocument();
        });

        it('does not show the strip when the summary row is already carrying the totals', () => {
            setWide(true);
            openCardLimits();
            expect(screen.queryByText('Total committed (caps)')).toBeNull();
        });

        it('lets the card-limits table scroll rather than squeeze the columns it kept', () => {
            setWide(false);
            openCardLimits();
            expect(screen.getByTestId('generic-table').dataset.scrollX).toBe('max-content');
        });

        it('lets the top-up history table scroll too', () => {
            setWide(false);
            render(<WalletTab />);
            expect(screen.getByTestId('generic-table').dataset.scrollX).toBe('max-content');
        });
    });

    // -----------------------------------------------------------------------
    describe('TopUpModal', () => {
        it('is closed initially', () => {
            render(<WalletTab />);
            expect(screen.queryByTestId('topup-modal')).toBeNull();
        });

        it('opens when Top up wallet is clicked', () => {
            render(<WalletTab />);
            fireEvent.click(screen.getByRole('button', { name: /top up wallet/i }));
            expect(screen.getByTestId('topup-modal')).toBeInTheDocument();
        });

        it('closes when its close button is clicked', () => {
            render(<WalletTab />);
            fireEvent.click(screen.getByRole('button', { name: /top up wallet/i }));
            fireEvent.click(screen.getByTestId('close-topup-modal'));
            expect(screen.queryByTestId('topup-modal')).toBeNull();
        });
    });
});

// The Card limits table renders the same card rows as the admin Cards section, so it has to read the same
// status. It showed a bare "Frozen" for a card awaiting termination while Cards showed the composite.
describe('WalletTab — card limits status', () => {
    const openCardLimits = (card: Record<string, unknown>) => {
        (useAdminCardsApi as Mock).mockReturnValue({
            cards: [{ ...mockCard(), ...card }],
            isLoading: false,
            total: 1,
            refetch: vi.fn(),
        });
        render(<WalletTab />);
        fireEvent.click(screen.getByTestId('tab-card-limits'));
    };

    it('shows the composite status for a frozen card awaiting termination', () => {
        openCardLimits({ key: 'c1', status: 'Frozen', terminationStatus: 'REQUESTED' });

        expect(screen.getByTestId('cell-status-c1')).toHaveTextContent(
            'Frozen (Termination Requested)'
        );
    });

    it('shows a plain Frozen when no termination is pending', () => {
        openCardLimits({ key: 'c1', status: 'Frozen', terminationStatus: null });

        expect(screen.getByTestId('cell-status-c1')).toHaveTextContent('Frozen');
        expect(screen.getByTestId('cell-status-c1')).not.toHaveTextContent('Termination Requested');
    });

    it('leaves an active card alone', () => {
        openCardLimits({ key: 'c1', status: 'Active', terminationStatus: null });

        expect(screen.getByTestId('cell-status-c1')).toHaveTextContent('Active');
    });
});
