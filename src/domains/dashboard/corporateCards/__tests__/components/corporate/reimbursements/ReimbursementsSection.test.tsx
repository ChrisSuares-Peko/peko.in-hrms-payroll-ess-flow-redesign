import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import ReimbursementsSection from '../../../../components/corporate/reimbursements/ReimbursementsSection';

// ---------------------------------------------------------------------------
// Static data mock â€” use dates within the last month so the default date-range
// filter keeps them visible.
// ---------------------------------------------------------------------------

vi.mock('../../../../utils/reimbursementsData', () => ({
    REIMBURSEMENTS: [
        {
            key: 'r1',
            date: '2026-06-15',
            merchant: 'Swiggy',
            description: 'Team lunch',
            category: 'Meals',
            receipt: true,
            status: 'Approved',
            amount: 1200,
        },
        {
            key: 'r2',
            date: '2026-06-25',
            merchant: 'Uber',
            description: 'Client transport',
            category: 'Travel',
            receipt: false,
            status: 'Pending',
            amount: 450,
        },
        {
            key: 'r3',
            date: '2026-07-01',
            merchant: 'Amazon',
            description: 'Office supplies',
            category: 'Supplies',
            receipt: true,
            status: 'Rejected',
            amount: 3500,
        },
    ],
    REIMBURSEMENT_CATEGORIES: [
        { value: 'Meals', label: 'Meals' },
        { value: 'Travel', label: 'Travel' },
        { value: 'Supplies', label: 'Supplies' },
    ],
}));

// ---------------------------------------------------------------------------
// Component mocks
// ---------------------------------------------------------------------------

vi.mock('@components/atomic/GenericTable', () => ({
    default: ({ dataSource, loading }: any) => (
        <div
            data-testid="generic-table"
            data-loading={String(loading ?? false)}
            data-row-count={dataSource?.length ?? 0}
        >
            {(dataSource ?? []).map((row: any) => (
                <div key={row.key} data-testid={`table-row-${row.key}`}>
                    {row.merchant}
                </div>
            ))}
        </div>
    ),
}));

vi.mock('../../../../components/common/StatusTag', () => ({
    default: ({ status }: any) => <span data-testid="status-tag">{status}</span>,
}));

vi.mock('../../../../components/corporate/reimbursements/SubmitReimbursementModal', () => ({
    default: ({ open, onClose }: any) =>
        open ? (
            <div data-testid="submit-reimbursement-modal">
                <button type="button" data-testid="close-submit-modal" onClick={onClose}>
                    Close
                </button>
            </div>
        ) : null,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReimbursementsSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // -----------------------------------------------------------------------
    describe('header', () => {
        it('renders the Reimbursements heading', () => {
            render(<ReimbursementsSection />);
            expect(screen.getByRole('heading', { name: /reimbursements/i })).toBeInTheDocument();
        });

        it('renders the Submit expense button', () => {
            render(<ReimbursementsSection />);
            expect(screen.getByRole('button', { name: /submit expense/i })).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    describe('filter bar', () => {
        it('renders the Date label', () => {
            render(<ReimbursementsSection />);
            expect(screen.getByText('Date')).toBeInTheDocument();
        });

        it('renders the Search input', () => {
            render(<ReimbursementsSection />);
            expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
        });

        it('renders the Clear button', () => {
            render(<ReimbursementsSection />);
            expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    describe('table', () => {
        it('renders the GenericTable', () => {
            render(<ReimbursementsSection />);
            expect(screen.getByTestId('generic-table')).toBeInTheDocument();
        });

        it('shows all 3 rows when default date range includes mock dates', () => {
            render(<ReimbursementsSection />);
            expect(screen.getByTestId('table-row-r1')).toBeInTheDocument();
            expect(screen.getByTestId('table-row-r2')).toBeInTheDocument();
            expect(screen.getByTestId('table-row-r3')).toBeInTheDocument();
        });

        it('row count equals number of unfiltered items', () => {
            render(<ReimbursementsSection />);
            expect(screen.getByTestId('generic-table').dataset.rowCount).toBe('3');
        });
    });

    // -----------------------------------------------------------------------
    describe('search filter', () => {
        it('filters rows by merchant when search is typed', () => {
            render(<ReimbursementsSection />);
            fireEvent.change(screen.getByPlaceholderText('Search'), {
                target: { value: 'Swiggy' },
            });
            expect(screen.getByTestId('table-row-r1')).toBeInTheDocument();
            expect(screen.queryByTestId('table-row-r2')).toBeNull();
            expect(screen.queryByTestId('table-row-r3')).toBeNull();
        });

        it('filters rows by description', () => {
            render(<ReimbursementsSection />);
            fireEvent.change(screen.getByPlaceholderText('Search'), {
                target: { value: 'transport' },
            });
            expect(screen.queryByTestId('table-row-r1')).toBeNull();
            expect(screen.getByTestId('table-row-r2')).toBeInTheDocument();
            expect(screen.queryByTestId('table-row-r3')).toBeNull();
        });

        it('shows no rows when search matches nothing', () => {
            render(<ReimbursementsSection />);
            fireEvent.change(screen.getByPlaceholderText('Search'), {
                target: { value: 'xyznonexistent' },
            });
            expect(screen.getByTestId('generic-table').dataset.rowCount).toBe('0');
        });

        it('restores all rows when Clear is clicked after searching', () => {
            render(<ReimbursementsSection />);
            fireEvent.change(screen.getByPlaceholderText('Search'), {
                target: { value: 'Swiggy' },
            });
            expect(screen.getByTestId('generic-table').dataset.rowCount).toBe('1');

            fireEvent.click(screen.getByRole('button', { name: /clear/i }));
            expect(screen.getByTestId('generic-table').dataset.rowCount).toBe('3');
        });
    });

    // -----------------------------------------------------------------------
    describe('SubmitReimbursementModal', () => {
        it('is closed initially', () => {
            render(<ReimbursementsSection />);
            expect(screen.queryByTestId('submit-reimbursement-modal')).toBeNull();
        });

        it('opens when Submit expense is clicked', () => {
            render(<ReimbursementsSection />);
            fireEvent.click(screen.getByRole('button', { name: /submit expense/i }));
            expect(screen.getByTestId('submit-reimbursement-modal')).toBeInTheDocument();
        });

        it('closes when the modal close button is clicked', () => {
            render(<ReimbursementsSection />);
            fireEvent.click(screen.getByRole('button', { name: /submit expense/i }));
            fireEvent.click(screen.getByTestId('close-submit-modal'));
            expect(screen.queryByTestId('submit-reimbursement-modal')).toBeNull();
        });
    });
});
