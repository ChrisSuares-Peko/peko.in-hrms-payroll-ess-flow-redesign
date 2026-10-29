import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import VendorInvoicesSection from '../../../../components/corporate/vendorInvoices/VendorInvoicesSection';

// ---------------------------------------------------------------------------
// Static data mock â€” dates within the last month so default date range keeps
// them visible.
// ---------------------------------------------------------------------------

vi.mock('../../../../utils/vendorInvoicesData', () => ({
    VENDOR_INVOICES: [
        {
            key: 'v1',
            date: '2026-06-12',
            invoice: 'INV-2026-001',
            vendor: 'AZB & Partners',
            due: '2026-06-30',
            amount: 12000,
            status: 'Approved',
        },
        {
            key: 'v2',
            date: '2026-06-20',
            invoice: 'INV-2026-002',
            vendor: 'BrightDesign Studio',
            due: '2026-07-05',
            amount: 4500,
            status: 'Pending',
        },
        {
            key: 'v3',
            date: '2026-07-02',
            invoice: 'INV-2026-003',
            vendor: 'CrestWave Solutions',
            due: '2026-07-15',
            amount: 8800,
            status: 'Rejected',
        },
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
                    {row.vendor} {row.invoice}
                </div>
            ))}
        </div>
    ),
}));

vi.mock('../../../../components/common/StatusTag', () => ({
    default: ({ status }: any) => <span data-testid="status-tag">{status}</span>,
}));

vi.mock('../../../../components/corporate/vendorInvoices/UploadInvoiceModal', () => ({
    default: ({ open, onClose }: any) =>
        open ? (
            <div data-testid="upload-invoice-modal">
                <button type="button" data-testid="close-upload-modal" onClick={onClose}>
                    Close
                </button>
            </div>
        ) : null,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('VendorInvoicesSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // -----------------------------------------------------------------------
    describe('header', () => {
        it('renders the Vendor invoices heading', () => {
            render(<VendorInvoicesSection />);
            expect(screen.getByRole('heading', { name: /vendor invoices/i })).toBeInTheDocument();
        });

        it('renders the description text', () => {
            render(<VendorInvoicesSection />);
            expect(
                screen.getByText(/upload vendor invoices for approval and payment/i)
            ).toBeInTheDocument();
        });

        it('renders the Upload invoice button', () => {
            render(<VendorInvoicesSection />);
            expect(screen.getByRole('button', { name: /upload invoice/i })).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    describe('filter bar', () => {
        it('renders the Date label', () => {
            render(<VendorInvoicesSection />);
            expect(screen.getByText('Date')).toBeInTheDocument();
        });

        it('renders the Search input', () => {
            render(<VendorInvoicesSection />);
            expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
        });

        it('renders the Clear button', () => {
            render(<VendorInvoicesSection />);
            expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    describe('table', () => {
        it('renders the GenericTable', () => {
            render(<VendorInvoicesSection />);
            expect(screen.getByTestId('generic-table')).toBeInTheDocument();
        });

        it('shows all 3 rows when default date range includes mock dates', () => {
            render(<VendorInvoicesSection />);
            expect(screen.getByTestId('table-row-v1')).toBeInTheDocument();
            expect(screen.getByTestId('table-row-v2')).toBeInTheDocument();
            expect(screen.getByTestId('table-row-v3')).toBeInTheDocument();
        });

        it('row count equals the number of unfiltered items', () => {
            render(<VendorInvoicesSection />);
            expect(screen.getByTestId('generic-table').dataset.rowCount).toBe('3');
        });
    });

    // -----------------------------------------------------------------------
    describe('search filter', () => {
        it('filters rows by vendor when search is typed', () => {
            render(<VendorInvoicesSection />);
            fireEvent.change(screen.getByPlaceholderText('Search'), {
                target: { value: 'AZB' },
            });
            expect(screen.getByTestId('table-row-v1')).toBeInTheDocument();
            expect(screen.queryByTestId('table-row-v2')).toBeNull();
            expect(screen.queryByTestId('table-row-v3')).toBeNull();
        });

        it('filters rows by invoice number', () => {
            render(<VendorInvoicesSection />);
            fireEvent.change(screen.getByPlaceholderText('Search'), {
                target: { value: 'INV-2026-002' },
            });
            expect(screen.queryByTestId('table-row-v1')).toBeNull();
            expect(screen.getByTestId('table-row-v2')).toBeInTheDocument();
            expect(screen.queryByTestId('table-row-v3')).toBeNull();
        });

        it('shows no rows when search matches nothing', () => {
            render(<VendorInvoicesSection />);
            fireEvent.change(screen.getByPlaceholderText('Search'), {
                target: { value: 'xyznonexistent' },
            });
            expect(screen.getByTestId('generic-table').dataset.rowCount).toBe('0');
        });

        it('restores all rows when Clear is clicked after searching', () => {
            render(<VendorInvoicesSection />);
            fireEvent.change(screen.getByPlaceholderText('Search'), {
                target: { value: 'AZB' },
            });
            expect(screen.getByTestId('generic-table').dataset.rowCount).toBe('1');

            fireEvent.click(screen.getByRole('button', { name: /clear/i }));
            expect(screen.getByTestId('generic-table').dataset.rowCount).toBe('3');
        });
    });

    // -----------------------------------------------------------------------
    describe('UploadInvoiceModal', () => {
        it('is closed initially', () => {
            render(<VendorInvoicesSection />);
            expect(screen.queryByTestId('upload-invoice-modal')).toBeNull();
        });

        it('opens when Upload invoice is clicked', () => {
            render(<VendorInvoicesSection />);
            fireEvent.click(screen.getByRole('button', { name: /upload invoice/i }));
            expect(screen.getByTestId('upload-invoice-modal')).toBeInTheDocument();
        });

        it('closes when the modal close button is clicked', () => {
            render(<VendorInvoicesSection />);
            fireEvent.click(screen.getByRole('button', { name: /upload invoice/i }));
            fireEvent.click(screen.getByTestId('close-upload-modal'));
            expect(screen.queryByTestId('upload-invoice-modal')).toBeNull();
        });
    });
});
