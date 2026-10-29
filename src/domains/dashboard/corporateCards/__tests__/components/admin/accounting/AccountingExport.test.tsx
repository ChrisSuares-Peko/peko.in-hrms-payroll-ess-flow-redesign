import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import AccountingExport from '../../../../components/admin/accounting/AccountingExport';

// â”€â”€â”€ Asset mocks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
vi.mock('../../../../assets/icons/arrow.svg', () => ({ default: 'arrow.svg' }));
vi.mock('../../../../assets/icons/export.svg', () => ({ default: 'export.svg' }));
vi.mock('../../../../assets/quickbooks.png', () => ({ default: 'quickbooks.png' }));

// â”€â”€â”€ GenericTable mock â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Renders each data row as a simple div with a controlled checkbox so we can
// exercise rowSelection callbacks and verify the export-count badge.
vi.mock('@components/atomic/GenericTable', () => ({
    default: ({ dataSource, rowSelection }: any) => (
        <div data-testid="generic-table">
            {(dataSource ?? []).map((row: any) => (
                <div key={row.key} data-testid="table-row">
                    <input
                        type="checkbox"
                        data-testid={`row-checkbox-${row.key}`}
                        checked={rowSelection?.selectedRowKeys?.includes(row.key) ?? false}
                        onChange={() => {
                            const current: string[] = rowSelection?.selectedRowKeys ?? [];
                            const next = current.includes(row.key)
                                ? current.filter((k: string) => k !== row.key)
                                : [...current, row.key];
                            rowSelection?.onChange?.(next);
                        }}
                    />
                </div>
            ))}
        </div>
    ),
}));

// â”€â”€â”€ PageTabs mock â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Renders plain <button type="button"> elements so we can click tabs and assert aria-pressed.
vi.mock('../../../../components/common/PageTabs', () => ({
    default: ({ tabs, activeKey, onChange }: any) => (
        <div data-testid="page-tabs">
            {(tabs ?? []).map((tab: any) => (
                <button
                    key={tab.key}
                    type="button"
                    data-testid={`tab-${tab.key}`}
                    aria-pressed={tab.key === activeKey ? 'true' : 'false'}
                    onClick={() => onChange(tab.key)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    ),
}));

// â”€â”€â”€ antd DatePicker partial mock â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Replace the complex RangePicker with a plain text input to avoid jsdom issues
// with calendar popups while still exercising state wiring.
vi.mock('antd', async importOriginal => {
    const mod = await importOriginal<typeof import('antd')>();

    const MockRangePicker = ({ onChange }: any) => (
        <input
            data-testid="range-picker"
            type="text"
            placeholder="Select date range"
            onChange={e => onChange?.(e.target.value)}
        />
    );

    const MockDatePicker: any = () => null;
    MockDatePicker.RangePicker = MockRangePicker;

    return { ...mod, DatePicker: MockDatePicker };
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('AccountingExport', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // â”€â”€ Page header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('page header', () => {
        it('renders "Accounting Export" heading', () => {
            render(<AccountingExport />);
            expect(screen.getByRole('heading', { name: 'Accounting Export' })).toBeInTheDocument();
        });

        it('renders the subtitle', () => {
            render(<AccountingExport />);
            expect(
                screen.getByText('Map and push transactions to QuickBooks Online.')
            ).toBeInTheDocument();
        });

        it('renders "Download history" button', () => {
            render(<AccountingExport />);
            expect(screen.getByRole('button', { name: /download history/i })).toBeInTheDocument();
        });
    });

    // â”€â”€ QuickBooks connection card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('QuickBooks connection card', () => {
        it('renders "QuickBooks Online" label', () => {
            render(<AccountingExport />);
            expect(screen.getByText('QuickBooks Online')).toBeInTheDocument();
        });

        it('shows "Connected" status tag', () => {
            render(<AccountingExport />);
            expect(screen.getByText('Connected')).toBeInTheDocument();
        });

        it('shows last-synced description', () => {
            render(<AccountingExport />);
            expect(screen.getByText(/last synced/i)).toBeInTheDocument();
        });

        it('renders "Sync chart" button', () => {
            render(<AccountingExport />);
            expect(screen.getByRole('button', { name: /sync chart/i })).toBeInTheDocument();
        });

        it('shows export count of 0 when no rows are selected', () => {
            render(<AccountingExport />);
            expect(screen.getByText(/Export selected \(0\)/)).toBeInTheDocument();
        });
    });

    // â”€â”€ Tab navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('tab navigation', () => {
        it('renders all four tabs', () => {
            render(<AccountingExport />);
            expect(screen.getByTestId('tab-card-transactions')).toBeInTheDocument();
            expect(screen.getByTestId('tab-reimbursements')).toBeInTheDocument();
            expect(screen.getByTestId('tab-vendor-invoices')).toBeInTheDocument();
            expect(screen.getByTestId('tab-wallet-topups')).toBeInTheDocument();
        });

        it('has correct labels for each tab', () => {
            render(<AccountingExport />);
            expect(screen.getByTestId('tab-card-transactions')).toHaveTextContent(
                'Card transactions'
            );
            expect(screen.getByTestId('tab-reimbursements')).toHaveTextContent('Reimbursements');
            expect(screen.getByTestId('tab-vendor-invoices')).toHaveTextContent('Vendor Invoices');
            expect(screen.getByTestId('tab-wallet-topups')).toHaveTextContent('Wallet top-ups');
        });

        it('defaults to the card-transactions tab as active', () => {
            render(<AccountingExport />);
            expect(screen.getByTestId('tab-card-transactions')).toHaveAttribute(
                'aria-pressed',
                'true'
            );
            expect(screen.getByTestId('tab-reimbursements')).toHaveAttribute(
                'aria-pressed',
                'false'
            );
            expect(screen.getByTestId('tab-vendor-invoices')).toHaveAttribute(
                'aria-pressed',
                'false'
            );
            expect(screen.getByTestId('tab-wallet-topups')).toHaveAttribute(
                'aria-pressed',
                'false'
            );
        });

        it('switches to reimbursements tab on click', () => {
            render(<AccountingExport />);
            fireEvent.click(screen.getByTestId('tab-reimbursements'));
            expect(screen.getByTestId('tab-reimbursements')).toHaveAttribute(
                'aria-pressed',
                'true'
            );
            expect(screen.getByTestId('tab-card-transactions')).toHaveAttribute(
                'aria-pressed',
                'false'
            );
        });

        it('switches to vendor-invoices tab on click', () => {
            render(<AccountingExport />);
            fireEvent.click(screen.getByTestId('tab-vendor-invoices'));
            expect(screen.getByTestId('tab-vendor-invoices')).toHaveAttribute(
                'aria-pressed',
                'true'
            );
            expect(screen.getByTestId('tab-card-transactions')).toHaveAttribute(
                'aria-pressed',
                'false'
            );
        });

        it('switches to wallet-topups tab on click', () => {
            render(<AccountingExport />);
            fireEvent.click(screen.getByTestId('tab-wallet-topups'));
            expect(screen.getByTestId('tab-wallet-topups')).toHaveAttribute('aria-pressed', 'true');
            expect(screen.getByTestId('tab-card-transactions')).toHaveAttribute(
                'aria-pressed',
                'false'
            );
        });
    });

    // â”€â”€ Warning alert â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('warning alert', () => {
        it('shows a pending-settlement alert on card-transactions tab', () => {
            render(<AccountingExport />);
            expect(screen.getByText(/pending settlement/i)).toBeInTheDocument();
        });

        it('shows a pending-approval alert on reimbursements tab', () => {
            render(<AccountingExport />);
            fireEvent.click(screen.getByTestId('tab-reimbursements'));
            expect(screen.getByText(/awaiting your approval/i)).toBeInTheDocument();
        });

        it('shows an invoice-awaiting-approval alert on vendor-invoices tab', () => {
            render(<AccountingExport />);
            fireEvent.click(screen.getByTestId('tab-vendor-invoices'));
            expect(screen.getByText(/1 invoice awaiting approval/i)).toBeInTheDocument();
        });

        it('does NOT show any alert on wallet-topups tab (empty alert string)', () => {
            render(<AccountingExport />);
            fireEvent.click(screen.getByTestId('tab-wallet-topups'));
            expect(screen.queryByRole('alert')).toBeNull();
        });
    });

    // â”€â”€ Card fees info banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('card fees info banner', () => {
        it('shows the card fees banner on card-transactions tab', () => {
            render(<AccountingExport />);
            expect(screen.getByText(/card fees/i)).toBeInTheDocument();
        });

        it('references the 5090 account code in the card fees banner', () => {
            render(<AccountingExport />);
            expect(screen.getByText(/5090/i)).toBeInTheDocument();
        });

        it('does NOT show card fees banner on reimbursements tab', () => {
            render(<AccountingExport />);
            fireEvent.click(screen.getByTestId('tab-reimbursements'));
            expect(screen.queryByText(/card fees/i)).toBeNull();
        });

        it('does NOT show card fees banner on vendor-invoices tab', () => {
            render(<AccountingExport />);
            fireEvent.click(screen.getByTestId('tab-vendor-invoices'));
            expect(screen.queryByText(/card fees/i)).toBeNull();
        });

        it('does NOT show card fees banner on wallet-topups tab', () => {
            render(<AccountingExport />);
            fireEvent.click(screen.getByTestId('tab-wallet-topups'));
            expect(screen.queryByText(/card fees/i)).toBeNull();
        });
    });

    // â”€â”€ Filter bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('filter bar', () => {
        it('renders the date range picker', () => {
            render(<AccountingExport />);
            expect(screen.getByTestId('range-picker')).toBeInTheDocument();
        });

        it('renders the "Date" label above the range picker', () => {
            render(<AccountingExport />);
            expect(screen.getByText('Date')).toBeInTheDocument();
        });

        it('renders the search input', () => {
            render(<AccountingExport />);
            expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
        });

        it('renders Clear button', () => {
            render(<AccountingExport />);
            expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
        });

        it('shows "Merchant" as search label on card-transactions tab', () => {
            render(<AccountingExport />);
            const merchantLabels = screen.getAllByText('Merchant');
            expect(merchantLabels.length).toBeGreaterThanOrEqual(1);
        });

        it('shows "Cardholder" filter label on card-transactions tab', () => {
            render(<AccountingExport />);
            expect(screen.getByText('Cardholder')).toBeInTheDocument();
        });

        it('shows "Status" filter label on card-transactions tab', () => {
            render(<AccountingExport />);
            const statusLabels = screen.getAllByText('Status');
            expect(statusLabels.length).toBeGreaterThanOrEqual(1);
        });

        it('shows "Vendor / Invoice" as search label on vendor-invoices tab', () => {
            render(<AccountingExport />);
            fireEvent.click(screen.getByTestId('tab-vendor-invoices'));
            expect(screen.getByText('Vendor / Invoice')).toBeInTheDocument();
        });

        it('shows "Reference / Source" as search label on wallet-topups tab', () => {
            render(<AccountingExport />);
            fireEvent.click(screen.getByTestId('tab-wallet-topups'));
            expect(screen.getByText('Reference / Source')).toBeInTheDocument();
        });

        it('typing in the search input updates its value', () => {
            render(<AccountingExport />);
            const searchInput = screen.getByPlaceholderText('Search');
            fireEvent.change(searchInput, { target: { value: 'Stark' } });
            expect(searchInput).toHaveValue('Stark');
        });

        it('clicking Clear resets the search input to empty', () => {
            render(<AccountingExport />);
            const searchInput = screen.getByPlaceholderText('Search');
            fireEvent.change(searchInput, { target: { value: 'Wayne' } });
            expect(searchInput).toHaveValue('Wayne');

            fireEvent.click(screen.getByRole('button', { name: /clear/i }));
            expect(searchInput).toHaveValue('');
        });

        it('search input persists its value when switching tabs', () => {
            render(<AccountingExport />);
            const searchInput = screen.getByPlaceholderText('Search');
            fireEvent.change(searchInput, { target: { value: 'Oscorp' } });
            expect(searchInput).toHaveValue('Oscorp');

            fireEvent.click(screen.getByTestId('tab-reimbursements'));
            expect(searchInput).toHaveValue('Oscorp');
        });
    });

    // â”€â”€ Table data rendering â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('data table rendering', () => {
        it('renders the GenericTable on the default tab', () => {
            render(<AccountingExport />);
            expect(screen.getByTestId('generic-table')).toBeInTheDocument();
        });

        it('renders 4 rows for card-transactions (CARD_TXN_ROWS has 4 entries)', () => {
            render(<AccountingExport />);
            expect(screen.getAllByTestId('table-row')).toHaveLength(4);
        });

        it('renders 4 rows for reimbursements tab (REIMBURSEMENT_EXPORT_ROWS has 4 entries)', () => {
            render(<AccountingExport />);
            fireEvent.click(screen.getByTestId('tab-reimbursements'));
            expect(screen.getAllByTestId('table-row')).toHaveLength(4);
        });

        it('renders 4 rows for vendor-invoices tab (VENDOR_INVOICE_EXPORT_ROWS has 4 entries)', () => {
            render(<AccountingExport />);
            fireEvent.click(screen.getByTestId('tab-vendor-invoices'));
            expect(screen.getAllByTestId('table-row')).toHaveLength(4);
        });

        it('renders 4 rows for wallet-topups tab (WALLET_TOPUP_ROWS has 4 entries)', () => {
            render(<AccountingExport />);
            fireEvent.click(screen.getByTestId('tab-wallet-topups'));
            expect(screen.getAllByTestId('table-row')).toHaveLength(4);
        });
    });

    // â”€â”€ Row selection and export count â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('row selection and export count', () => {
        it('starts with no rows checked and export count of 0', () => {
            render(<AccountingExport />);
            expect(screen.getByText(/Export selected \(0\)/)).toBeInTheDocument();
            screen.getAllByRole('checkbox').forEach(cb => expect(cb).not.toBeChecked());
        });

        it('increments export count to 1 when one row is selected', () => {
            render(<AccountingExport />);
            fireEvent.click(screen.getByTestId('row-checkbox-1'));
            expect(screen.getByText(/Export selected \(1\)/)).toBeInTheDocument();
            expect(screen.getByTestId('row-checkbox-1')).toBeChecked();
        });

        it('increments export count for each additional row selected', () => {
            render(<AccountingExport />);
            fireEvent.click(screen.getByTestId('row-checkbox-1'));
            fireEvent.click(screen.getByTestId('row-checkbox-2'));
            expect(screen.getByText(/Export selected \(2\)/)).toBeInTheDocument();
        });

        it('decrements export count when a selected row is deselected', () => {
            render(<AccountingExport />);
            fireEvent.click(screen.getByTestId('row-checkbox-1'));
            expect(screen.getByText(/Export selected \(1\)/)).toBeInTheDocument();

            fireEvent.click(screen.getByTestId('row-checkbox-1'));
            expect(screen.getByText(/Export selected \(0\)/)).toBeInTheDocument();
            expect(screen.getByTestId('row-checkbox-1')).not.toBeChecked();
        });

        it('resets selected rows and export count to 0 when switching tabs', () => {
            render(<AccountingExport />);
            fireEvent.click(screen.getByTestId('row-checkbox-1'));
            fireEvent.click(screen.getByTestId('row-checkbox-2'));
            expect(screen.getByText(/Export selected \(2\)/)).toBeInTheDocument();

            fireEvent.click(screen.getByTestId('tab-reimbursements'));
            expect(screen.getByText(/Export selected \(0\)/)).toBeInTheDocument();
        });

        it('can select rows independently on each tab after switching', () => {
            render(<AccountingExport />);

            // Select on card-transactions
            fireEvent.click(screen.getByTestId('row-checkbox-1'));
            expect(screen.getByText(/Export selected \(1\)/)).toBeInTheDocument();

            // Switch tab â€” count resets
            fireEvent.click(screen.getByTestId('tab-reimbursements'));
            expect(screen.getByText(/Export selected \(0\)/)).toBeInTheDocument();

            // Select on reimbursements
            fireEvent.click(screen.getByTestId('row-checkbox-3'));
            expect(screen.getByText(/Export selected \(1\)/)).toBeInTheDocument();
        });
    });
});
