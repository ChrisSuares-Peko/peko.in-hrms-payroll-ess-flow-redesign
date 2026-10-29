import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SelectInvoiceDrawer from '../../../components/collectPayment/SelectInvoiceDrawer';

const invoices: any[] = [
    {
        id: '1',
        invoiceNumber: 'INV-1',
        name: 'Arshid',
        status: 'PENDING',
        amountDue: '500',
        invoiceDate: '2024-01-01',
        dueDate: '2024-01-10',
    },
];

describe('SelectInvoiceDrawer', () => {
    it('renders skeleton when loading', () => {
        render(
            <SelectInvoiceDrawer
                open
                onClose={vi.fn()}
                onSelectInvoice={vi.fn()}
                invoices={[]}
                isLoading
                totalRecords={0}
                page={1}
                itemsPerPage={10}
                onPageChange={vi.fn()}
            />
        );
        expect(document.body.querySelectorAll('.ant-skeleton').length).toBeGreaterThan(0);
    });

    it('renders empty state when no invoices', () => {
        render(
            <SelectInvoiceDrawer
                open
                onClose={vi.fn()}
                onSelectInvoice={vi.fn()}
                invoices={[]}
                isLoading={false}
                totalRecords={0}
                page={1}
                itemsPerPage={10}
                onPageChange={vi.fn()}
            />
        );
        expect(screen.getByText('No invoices found')).toBeInTheDocument();
    });

    it('renders invoice rows and fires onSelectInvoice', () => {
        const onSelectInvoice = vi.fn();
        render(
            <SelectInvoiceDrawer
                open
                onClose={vi.fn()}
                onSelectInvoice={onSelectInvoice}
                invoices={invoices}
                isLoading={false}
                totalRecords={1}
                page={1}
                itemsPerPage={10}
                onPageChange={vi.fn()}
            />
        );

        expect(screen.getByText('INV-1')).toBeInTheDocument();
        expect(screen.getByText('Arshid')).toBeInTheDocument();
        expect(screen.getByText(/Showing 1 pending invoices/)).toBeInTheDocument();

        fireEvent.click(screen.getByText('INV-1'));
        expect(onSelectInvoice).toHaveBeenCalledWith(invoices[0]);
    });
});
