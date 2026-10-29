import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import PhysicalCardTrackingSection from '../../../components/admin/PhysicalCardTrackingSection';
import { usePhysicalTrackingApi } from '../../../hooks/admin/usePhysicalTrackingApi';

vi.mock('../../../hooks/admin/usePhysicalTrackingApi', () => ({
    usePhysicalTrackingApi: vi.fn(),
}));

vi.mock('@src/hooks/useScreenSize', () => ({
    default: () => ({ md: true }),
}));

vi.mock('../../../components/common/CardThumb', () => ({
    default: () => <span data-testid="card-thumb" />,
}));

vi.mock('../../../components/common/StatusTag', () => ({
    default: ({ status }: any) => <span data-testid="status-tag">{status}</span>,
}));

// Renders every cell so the column set and each renderer can be asserted directly.
vi.mock('@components/atomic/GenericTable', () => ({
    default: ({ dataSource, columns, loading, locale }: any) => (
        <div
            data-testid="generic-table"
            data-loading={String(loading ?? false)}
            data-columns={(columns ?? []).map((c: any) => c.key).join(',')}
        >
            {(dataSource ?? []).length === 0 && (
                <div data-testid="table-empty">{locale?.emptyText ?? 'No data'}</div>
            )}
            {(dataSource ?? []).map((row: any) => (
                <div key={row.key} data-testid={`row-${row.key}`}>
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

const dispatch = (overrides = {}) => ({
    awbNumber: '35870411223',
    courierPartnerName: 'Bluedart',
    courierPartnerId: 1,
    dispatchedOn: '2026-08-08T18:11:10',
    dispatchedAtUtc: '2026-08-08T12:41:10.000Z',
    origin: 'Bengaluru, Karnataka, 560034',
    receivedAt: '2026-08-12T10:00:00.000Z',
    ...overrides,
});

const makeRow = (overrides = {}) => ({
    key: '77',
    cardIssuanceId: 77,
    orderedOn: '2026-08-01T04:30:00.000Z',
    holderId: '99',
    holder: 'John Doe',
    department: 'Engineering',
    maskedCardNumber: '608363******9870',
    last4: '9870',
    nameOnCard: 'JOHN DOE',
    shippingAddress: 'B-22, Bandra West, Mumbai 400050',
    referenceNumber: '31157821',
    status: 'Issued',
    dispatches: [dispatch()],
    dispatchCount: 1,
    ...overrides,
});

const setup = (
    { rows = [makeRow()], total = 1, isLoading = false } = {},
    props: Record<string, unknown> = {}
) => {
    (usePhysicalTrackingApi as Mock).mockReturnValue({
        rows,
        total,
        isLoading,
        refetch: vi.fn(),
    });
    return render(<PhysicalCardTrackingSection {...props} />);
};

const columnsOf = () => screen.getByTestId('generic-table').dataset.columns?.split(',') ?? [];

beforeEach(() => vi.clearAllMocks());

describe('PhysicalCardTrackingSection', () => {
    describe('header', () => {
        it('names the section and explains where the dispatch detail comes from', () => {
            setup();

            expect(
                screen.getByRole('heading', { name: /physical card tracking/i })
            ).toBeInTheDocument();
            expect(screen.getByText(/pushes dispatch details/i)).toBeInTheDocument();
        });

        it('offers only the statuses the API accepts as a filter', () => {
            setup();

            expect(screen.getByText('Select Status')).toBeInTheDocument();
        });
    });

    describe('columns', () => {
        it('shows the member column for an admin by default', () => {
            setup();

            expect(columnsOf()).toEqual([
                'orderedOn',
                'member',
                'card',
                'shippingAddress',
                'referenceNumber',
                'tracking',
                'status',
            ]);
        });

        it('drops the member column when the caller asks it to', () => {
            setup({}, { showMember: false });

            expect(columnsOf()).not.toContain('member');
            expect(columnsOf()).toEqual([
                'orderedOn',
                'card',
                'shippingAddress',
                'referenceNumber',
                'tracking',
                'status',
            ]);
        });

        it('keeps every other column when the member column is dropped', () => {
            setup({}, { showMember: false });

            expect(screen.getByTestId('cell-shippingAddress-77')).toHaveTextContent(
                'B-22, Bandra West, Mumbai 400050'
            );
            expect(screen.getByTestId('cell-referenceNumber-77')).toHaveTextContent('31157821');
        });
    });

    describe('cells', () => {
        it('renders the masked card number beside a card thumbnail', () => {
            setup();

            expect(screen.getByTestId('cell-card-77')).toHaveTextContent('**** **** **** 9870');
            expect(screen.getByTestId('card-thumb')).toBeInTheDocument();
        });

        // A physical card ordered but not yet produced has no number to show.
        it('says the card is not issued yet rather than printing a masked blank', () => {
            setup({ rows: [makeRow({ last4: null, status: 'Ordered' })] });

            expect(screen.getByTestId('cell-card-77')).toHaveTextContent('Not issued yet');
            expect(screen.getByTestId('cell-card-77')).not.toHaveTextContent('****');
        });

        it('tags the order status', () => {
            setup();

            expect(screen.getByTestId('cell-status-77')).toHaveTextContent('Issued');
        });

        // Anything outside StatusTag's union would render an untoned pill, so it falls back to plain text.
        it('falls back to plain text for a status it has no tag for', () => {
            setup({ rows: [makeRow({ status: 'Something new' })] });

            expect(screen.getByTestId('cell-status-77')).toHaveTextContent('Something new');
        });

        it('shows a dash for a column the issuer sent nothing for', () => {
            setup({ rows: [makeRow({ shippingAddress: null, referenceNumber: null })] });

            expect(screen.getByTestId('cell-shippingAddress-77')).toHaveTextContent('—');
            expect(screen.getByTestId('cell-referenceNumber-77')).toHaveTextContent('—');
        });
    });

    describe('tracking cell', () => {
        it('marks a dispatched card and names the courier and consignment', () => {
            setup();

            const cell = screen.getByTestId('cell-tracking-77');
            expect(cell).toHaveTextContent('Dispatched');
            expect(cell).toHaveTextContent('Bluedart · AWB 35870411223');
        });

        it('reads the shipped line from where and when it left', () => {
            setup();

            const cell = screen.getByTestId('cell-tracking-77');
            expect(cell.textContent).toMatch(/Shipped .*Bengaluru, Karnataka, 560034/);
        });

        // An order the issuer has said nothing about yet must not read as dispatched.
        it('shows only a dash, and no Dispatched tag, before the first movement', () => {
            setup({ rows: [makeRow({ status: 'Ordered', dispatches: [], dispatchCount: 0 })] });

            expect(screen.getByTestId('cell-tracking-77')).toHaveTextContent('—');
            expect(screen.getByTestId('cell-tracking-77')).not.toHaveTextContent('Dispatched');
        });

        it('lists a re-dispatch newest first', () => {
            setup({
                rows: [
                    makeRow({
                        dispatches: [
                            dispatch({ awbNumber: 'OLD111' }),
                            dispatch({ awbNumber: 'NEW999' }),
                        ],
                        dispatchCount: 2,
                    }),
                ],
            });

            const text = screen.getByTestId('cell-tracking-77').textContent ?? '';
            expect(text.indexOf('NEW999')).toBeLessThan(text.indexOf('OLD111'));
        });

        it('survives a movement missing its courier and consignment', () => {
            setup({
                rows: [
                    makeRow({
                        dispatches: [dispatch({ awbNumber: null, courierPartnerName: null })],
                    }),
                ],
            });

            expect(screen.getByTestId('cell-tracking-77')).toHaveTextContent('Dispatched');
        });
    });

    describe('paging', () => {
        it('reports the window on screen', () => {
            setup({ rows: [makeRow()], total: 24 });

            expect(screen.getByText('Showing 1–10 of 24 requests')).toBeInTheDocument();
        });

        it('says there are none rather than showing a zero-length window', () => {
            setup({ rows: [], total: 0 });

            expect(screen.getByText('No physical card requests')).toBeInTheDocument();
            expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
        });

        it('asks the API for the first page at page size ten', () => {
            setup({ rows: [makeRow()], total: 24 });

            expect(usePhysicalTrackingApi).toHaveBeenCalledWith(1, 10, undefined);
        });

        it('renders the caller empty state when one is supplied', () => {
            setup({ rows: [], total: 0 }, { emptyText: 'No physical cards ordered yet.' });

            expect(screen.getByTestId('table-empty')).toHaveTextContent(
                'No physical cards ordered yet.'
            );
        });
    });

    describe('loading', () => {
        it('hands the table its loading flag instead of an empty state', () => {
            setup({ rows: [], total: 0, isLoading: true });

            expect(screen.getByTestId('generic-table').dataset.loading).toBe('true');
        });
    });
});
