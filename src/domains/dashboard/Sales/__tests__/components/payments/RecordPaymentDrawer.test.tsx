import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import RecordPaymentDrawer from '../../../components/payments/RecordPaymentDrawer';

vi.mock('../../../components/shared/LeftHeader', () => ({
    default: ({ title, description }: any) => (
        <div>
            <span>{title}</span>
            <span>{description}</span>
        </div>
    ),
}));

const baseInvoice: any = {
    id: 'i-1',
    prefix: 'INV-',
    documentNumber: '101',
    name: 'Acme',
    documentDate: '2026-01-01',
    dueDate: '2026-01-15',
    amountDue: '500',
    status: 'Pending',
};

describe('RecordPaymentDrawer', () => {
    it('renders header, footer count and invoice rows', () => {
        render(
            <RecordPaymentDrawer
                open
                onClose={() => {}}
                onSelectInvoice={() => {}}
                invoices={[baseInvoice]}
                isLoading={false}
                totalRecords={1}
                page={1}
                itemsPerPage={10}
                onPageChange={vi.fn()}
            />
        );

        expect(screen.getByText('Select Invoice')).toBeInTheDocument();
        expect(screen.getByText(/Showing.*1.*of.*1/i)).toBeInTheDocument();
        expect(screen.getByText('INV-101')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('renders the loading spinner while isLoading is true', () => {
        render(
            <RecordPaymentDrawer
                open
                onClose={() => {}}
                onSelectInvoice={() => {}}
                invoices={[]}
                isLoading
                totalRecords={0}
                page={1}
                itemsPerPage={10}
                onPageChange={vi.fn()}
            />
        );

        // Drawer portals to document.body — query the document root.
        expect(document.body.querySelector('.ant-spin')).not.toBeNull();
        // And the empty / row content is suppressed.
        expect(screen.queryByText('No invoices found')).not.toBeInTheDocument();
    });

    it('renders empty state when no invoices', () => {
        render(
            <RecordPaymentDrawer
                open
                onClose={() => {}}
                onSelectInvoice={() => {}}
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

    it('triggers onSelectInvoice when a row is clicked', () => {
        const onSelectInvoice = vi.fn();
        render(
            <RecordPaymentDrawer
                open
                onClose={() => {}}
                onSelectInvoice={onSelectInvoice}
                invoices={[baseInvoice]}
                isLoading={false}
                totalRecords={1}
                page={1}
                itemsPerPage={10}
                onPageChange={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText('INV-101'));
        expect(onSelectInvoice).toHaveBeenCalledWith(baseInvoice);
    });
});
