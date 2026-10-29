/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import dayjs from 'dayjs';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import MyRequestsSection from '../../../components/corporate/MyRequestsSection';
import { useMyRequestsApi } from '../../../hooks/user/useMyRequestsApi';

// ---------------------------------------------------------------------------
// Hook mocks
// ---------------------------------------------------------------------------

vi.mock('../../../hooks/user/useMyRequestsApi', () => ({
    useMyRequestsApi: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Component / module mocks
// ---------------------------------------------------------------------------

vi.mock('@components/atomic/GenericTable', () => ({
    default: ({ dataSource, loading, columns, pagination }: any) => (
        <div
            data-testid="generic-table"
            data-loading={String(loading ?? false)}
            data-row-count={dataSource?.length ?? 0}
            data-page={pagination?.current ?? ''}
            data-page-size={pagination?.pageSize ?? ''}
            data-total={pagination?.total ?? ''}
            onClick={() => pagination?.onChange?.(2)}
        >
            {(dataSource ?? []).map((row: any) => (
                <div key={row.key} data-testid={`table-row-${row.key}`} data-status={row.status}>
                    {row.cardLast4}
                    {(columns ?? []).map((col: any) => (
                        <div key={col.key} data-testid={`cell-${col.key}-${row.key}`}>
                            {col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    ),
}));

// Replace antd Tabs with a simple button-based stub so tab switching is
// testable without fighting antd's DOM structure in jsdom.
vi.mock('antd', async () => {
    const actual = await vi.importActual<any>('antd');
    return {
        ...actual,
        Tabs: ({ activeKey, onChange, items }: any) => (
            <div data-testid="request-tabs">
                {(items ?? []).map((item: any) => (
                    <button
                        type="button"
                        key={item.key}
                        data-testid={`tab-${item.key}`}
                        data-active={String(activeKey === item.key)}
                        onClick={() => onChange?.(item.key)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        ),
    };
});

vi.mock('../../../components/common/CardThumb', () => ({
    default: () => <span data-testid="card-thumb" />,
}));

vi.mock('../../../components/common/StatusTag', () => ({
    default: ({ status, tooltip }: any) => (
        <span data-testid="status-tag" data-tooltip={tooltip ?? ''}>
            {status}
        </span>
    ),
}));

// ---------------------------------------------------------------------------
// Test data — dates must fall within the component's default last-month filter window. Computed relative
// to "now" (not hardcoded) so this doesn't silently start failing as real time moves past a fixed date.
// ---------------------------------------------------------------------------

const daysAgo = (n: number) => dayjs().subtract(n, 'day').format('YYYY-MM-DD');

const makeCardRow = (overrides = {}) => ({
    id: 1,
    date: daysAgo(10),
    cardLast4: '1234',
    status: 'APPROVED',
    payload: { cardType: 'Virtual', requestedLimit: 50000 },
    ...overrides,
});

const makeTopupRow = (overrides = {}) => ({
    id: 2,
    date: daysAgo(7),
    cardLast4: '5678',
    status: 'APPROVED',
    payload: { requestedAmount: 10000 },
    ...overrides,
});

const makePhysicalRow = (overrides = {}) => ({
    id: 3,
    date: daysAgo(2),
    cardLast4: '9012',
    status: 'PENDING',
    payload: {
        shipping: {
            addressLine1: '123 Main St',
            addressLine2: 'Apt 4B',
            city: 'Mumbai',
            state: 'MH',
            pinCode: '400001',
        },
    },
    ...overrides,
});

// ---------------------------------------------------------------------------
// Helper: configure the hook mock to return different rows per call
// (the component calls useMyRequestsApi 3 times with different arguments).
// ---------------------------------------------------------------------------

const setupHook = ({
    cardRows = [makeCardRow()],
    topupRows = [makeTopupRow()],
    physicalRows = [makePhysicalRow()],
    cardLoading = false,
    topupLoading = false,
    physicalLoading = false,
} = {}) => {
    (useMyRequestsApi as Mock).mockImplementation((requestType: string, cardType?: string) => {
        if (requestType === 'CARD_ISSUANCE' && cardType === 'Virtual') {
            return { rows: cardRows, isLoading: cardLoading, refetch: vi.fn() };
        }
        if (requestType === 'LIMIT_INCREASE') {
            return { rows: topupRows, isLoading: topupLoading, refetch: vi.fn() };
        }
        if (requestType === 'CARD_ISSUANCE' && cardType === 'Physical') {
            return { rows: physicalRows, isLoading: physicalLoading, refetch: vi.fn() };
        }
        return { rows: [], isLoading: false, refetch: vi.fn() };
    });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MyRequestsSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupHook();
    });

    // -----------------------------------------------------------------------
    describe('header', () => {
        it('renders the "My requests" heading', () => {
            render(<MyRequestsSection />);
            expect(screen.getByRole('heading', { name: /my requests/i })).toBeInTheDocument();
        });

        it('renders the subtitle text', () => {
            render(<MyRequestsSection />);
            expect(screen.getByText(/request a new card or a top-up/i)).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    describe('tabs', () => {
        it('renders all four tabs', () => {
            render(<MyRequestsSection />);
            expect(screen.getByTestId('tab-card-requests')).toBeInTheDocument();
            expect(screen.getByTestId('tab-limit-increase-requests')).toBeInTheDocument();
            expect(screen.getByTestId('tab-physical-card-requests')).toBeInTheDocument();
            expect(screen.getByTestId('tab-unfreeze-requests')).toBeInTheDocument();
        });

        // A missing COLUMNS_BY_TAB entry white-screens the page — GenericTable initialises its state with an
        // unguarded columns.map(), so `columns={undefined}` throws on render rather than degrading.
        it('renders the unfreeze-requests tab without throwing', () => {
            render(<MyRequestsSection />);
            expect(() =>
                fireEvent.click(screen.getByTestId('tab-unfreeze-requests'))
            ).not.toThrow();
        });

        it('has Card requests active by default', () => {
            render(<MyRequestsSection />);
            expect(screen.getByTestId('tab-card-requests').dataset.active).toBe('true');
            expect(screen.getByTestId('tab-limit-increase-requests').dataset.active).toBe('false');
            expect(screen.getByTestId('tab-physical-card-requests').dataset.active).toBe('false');
        });

        it('switches to Limit increase requests when that tab is clicked', () => {
            render(<MyRequestsSection />);
            fireEvent.click(screen.getByTestId('tab-limit-increase-requests'));
            expect(screen.getByTestId('tab-limit-increase-requests').dataset.active).toBe('true');
            expect(screen.getByTestId('tab-card-requests').dataset.active).toBe('false');
        });

        it('switches to Physical card requests when that tab is clicked', () => {
            render(<MyRequestsSection />);
            fireEvent.click(screen.getByTestId('tab-physical-card-requests'));
            expect(screen.getByTestId('tab-physical-card-requests').dataset.active).toBe('true');
        });
    });

    // -----------------------------------------------------------------------
    describe('table data per tab', () => {
        it('shows card-request row (key=1) on the Card requests tab', () => {
            render(<MyRequestsSection />);
            expect(screen.getByTestId('table-row-1')).toBeInTheDocument();
        });

        it('shows topup row (key=2) on the Limit increase requests tab', () => {
            render(<MyRequestsSection />);
            fireEvent.click(screen.getByTestId('tab-limit-increase-requests'));
            expect(screen.getByTestId('table-row-2')).toBeInTheDocument();
        });

        it('shows physical row (key=3) on the Physical card requests tab', () => {
            render(<MyRequestsSection />);
            fireEvent.click(screen.getByTestId('tab-physical-card-requests'));
            expect(screen.getByTestId('table-row-3')).toBeInTheDocument();
        });

        it('card row has status Approved (mapped from APPROVED)', () => {
            render(<MyRequestsSection />);
            expect(screen.getByTestId('table-row-1').dataset.status).toBe('Approved');
        });

        it('physical row has status Pending (mapped from PENDING)', () => {
            render(<MyRequestsSection />);
            fireEvent.click(screen.getByTestId('tab-physical-card-requests'));
            expect(screen.getByTestId('table-row-3').dataset.status).toBe('Pending');
        });

        it('shows empty table when the hook returns no rows', () => {
            setupHook({ cardRows: [] });
            render(<MyRequestsSection />);
            expect(screen.getByTestId('generic-table').dataset.rowCount).toBe('0');
        });
    });

    // -----------------------------------------------------------------------
    // ADO 28852: the rejection reason (decisionNote) must be visible to the corporate user, not just
    // stored/returned by the API — surfaced here as a tooltip on the Rejected status pill.
    describe('rejection reason visibility', () => {
        it('passes the decisionNote as a tooltip on a Rejected card request', () => {
            setupHook({
                cardRows: [
                    makeCardRow({ status: 'REJECTED', decisionNote: 'Limit exceeds policy cap' }),
                ],
            });
            render(<MyRequestsSection />);
            expect(screen.getByTestId('status-tag').dataset.tooltip).toBe(
                'Limit exceeds policy cap'
            );
        });

        it('does not pass a tooltip when the request is not Rejected, even if a note is present', () => {
            setupHook({
                cardRows: [makeCardRow({ status: 'APPROVED', decisionNote: 'Should not show' })],
            });
            render(<MyRequestsSection />);
            expect(screen.getByTestId('status-tag').dataset.tooltip).toBe('');
        });

        it('does not pass a tooltip for a Rejected request with no decisionNote', () => {
            setupHook({
                cardRows: [makeCardRow({ status: 'REJECTED', decisionNote: null })],
            });
            render(<MyRequestsSection />);
            expect(screen.getByTestId('status-tag').dataset.tooltip).toBe('');
        });

        it('shows the rejection reason on the Top-up requests tab too', () => {
            setupHook({
                topupRows: [
                    makeTopupRow({
                        status: 'REJECTED',
                        decisionNote: 'Insufficient wallet balance',
                    }),
                ],
            });
            render(<MyRequestsSection />);
            fireEvent.click(screen.getByTestId('tab-limit-increase-requests'));
            expect(screen.getByTestId('status-tag').dataset.tooltip).toBe(
                'Insufficient wallet balance'
            );
        });

        it('shows the rejection reason on the Physical card requests tab too', () => {
            setupHook({
                physicalRows: [
                    makePhysicalRow({ status: 'REJECTED', decisionNote: 'Address undeliverable' }),
                ],
            });
            render(<MyRequestsSection />);
            fireEvent.click(screen.getByTestId('tab-physical-card-requests'));
            expect(screen.getByTestId('status-tag').dataset.tooltip).toBe('Address undeliverable');
        });
    });

    // -----------------------------------------------------------------------
    describe('loading state', () => {
        it('passes loading=true to GenericTable when Card requests are loading', () => {
            setupHook({ cardLoading: true });
            render(<MyRequestsSection />);
            expect(screen.getByTestId('generic-table').dataset.loading).toBe('true');
        });

        it('passes loading=true to GenericTable when Limit increase requests are loading', () => {
            setupHook({ topupLoading: true });
            render(<MyRequestsSection />);
            fireEvent.click(screen.getByTestId('tab-limit-increase-requests'));
            expect(screen.getByTestId('generic-table').dataset.loading).toBe('true');
        });
    });

    // -----------------------------------------------------------------------
    describe('filter bar', () => {
        it('renders the Date label', () => {
            render(<MyRequestsSection />);
            expect(screen.getByText('Date')).toBeInTheDocument();
        });

        it('renders the Search input', () => {
            render(<MyRequestsSection />);
            expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
        });

        it('renders the Clear button', () => {
            render(<MyRequestsSection />);
            expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    describe('search filter', () => {
        it('filters rows by card last4', () => {
            setupHook({
                cardRows: [
                    makeCardRow({ id: 10, cardLast4: '1234' }),
                    makeCardRow({ id: 11, cardLast4: '9999' }),
                ],
            });
            render(<MyRequestsSection />);
            fireEvent.change(screen.getByPlaceholderText('Search'), {
                target: { value: '1234' },
            });
            expect(screen.getByTestId('table-row-10')).toBeInTheDocument();
            expect(screen.queryByTestId('table-row-11')).toBeNull();
        });

        it('filters rows by status', () => {
            setupHook({
                cardRows: [
                    makeCardRow({ id: 20, status: 'APPROVED' }),
                    makeCardRow({ id: 21, status: 'REJECTED' }),
                ],
            });
            render(<MyRequestsSection />);
            fireEvent.change(screen.getByPlaceholderText('Search'), {
                target: { value: 'Approved' },
            });
            expect(screen.getByTestId('table-row-20')).toBeInTheDocument();
            expect(screen.queryByTestId('table-row-21')).toBeNull();
        });

        it('shows no rows when search matches nothing', () => {
            render(<MyRequestsSection />);
            fireEvent.change(screen.getByPlaceholderText('Search'), {
                target: { value: 'zzznomatch' },
            });
            expect(screen.getByTestId('generic-table').dataset.rowCount).toBe('0');
        });

        it('restores rows after Clear is clicked', () => {
            render(<MyRequestsSection />);
            fireEvent.change(screen.getByPlaceholderText('Search'), {
                target: { value: 'zzznomatch' },
            });
            expect(screen.getByTestId('generic-table').dataset.rowCount).toBe('0');

            fireEvent.click(screen.getByRole('button', { name: /clear/i }));
            expect(screen.getByTestId('generic-table').dataset.rowCount).toBe('1');
        });
    });

    // -----------------------------------------------------------------------
    describe('initialTab prop', () => {
        it('starts on the Physical card requests tab when initialTab is set', () => {
            render(<MyRequestsSection initialTab="physical-card-requests" />);
            expect(screen.getByTestId('tab-physical-card-requests').dataset.active).toBe('true');
        });
    });

    // -----------------------------------------------------------------------
    // GenericTable hands the inner antd Table pagination={false} and renders its own pager, so the caller
    // must slice AND supply `total`. Getting either wrong is silent: the table prints every row it is given
    // under a pager that cannot move.
    describe('pagination', () => {
        const manyCardRows = (n: number) =>
            Array.from({ length: n }, (_, i) =>
                makeCardRow({ id: i + 1, cardLast4: String(1000 + i) })
            );

        const table = () => screen.getByTestId('generic-table');

        it('renders only one page of rows, not every row it fetched', () => {
            setupHook({ cardRows: manyCardRows(24) });
            render(<MyRequestsSection />);

            expect(table().dataset.rowCount).toBe('10');
        });

        it('tells the pager the full filtered count so the page numbers exist', () => {
            setupHook({ cardRows: manyCardRows(24) });
            render(<MyRequestsSection />);

            expect(table().dataset.total).toBe('24');
            expect(table().dataset.page).toBe('1');
            expect(table().dataset.pageSize).toBe('10');
        });

        it('advances to the next window when the pager changes page', () => {
            setupHook({ cardRows: manyCardRows(24) });
            render(<MyRequestsSection />);

            expect(screen.getByTestId('table-row-1')).toBeInTheDocument();

            fireEvent.click(table());

            expect(screen.getByTestId('generic-table').dataset.page).toBe('2');
            expect(screen.queryByTestId('table-row-1')).not.toBeInTheDocument();
            expect(screen.getByTestId('table-row-11')).toBeInTheDocument();
        });

        it('serves a short last page rather than padding it', () => {
            setupHook({ cardRows: manyCardRows(14) });
            render(<MyRequestsSection />);

            fireEvent.click(table());

            expect(screen.getByTestId('generic-table').dataset.rowCount).toBe('4');
        });

        // Counting the unfiltered fetch would leave pages pointing past the end of a filtered list.
        it('counts what the filters left, not what was fetched', () => {
            setupHook({ cardRows: manyCardRows(24) });
            render(<MyRequestsSection />);
            fireEvent.change(screen.getByPlaceholderText('Search'), {
                target: { value: '1005' },
            });

            expect(table().dataset.total).toBe('1');
            expect(table().dataset.rowCount).toBe('1');
        });

        // Otherwise a switch while on page 3 lands on an empty table for a tab with one row.
        it('returns to the first page when the tab changes', () => {
            setupHook({ cardRows: manyCardRows(24) });
            render(<MyRequestsSection />);
            fireEvent.click(table());
            expect(screen.getByTestId('generic-table').dataset.page).toBe('2');

            fireEvent.click(screen.getByTestId('tab-physical-card-requests'));

            expect(screen.getByTestId('generic-table').dataset.page).toBe('1');
        });

        it('returns to the first page when the search changes', () => {
            setupHook({ cardRows: manyCardRows(24) });
            render(<MyRequestsSection />);
            fireEvent.click(table());
            expect(screen.getByTestId('generic-table').dataset.page).toBe('2');

            fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: '10' } });

            expect(screen.getByTestId('generic-table').dataset.page).toBe('1');
        });
    });
});
