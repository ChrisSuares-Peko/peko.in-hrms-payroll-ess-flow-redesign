import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import LinkedInvoice from '../../../../components/payments/paymentTracking/LinkedInvoice';

const navigate = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => navigate,
}));
vi.mock('@src/routes/paths', () => ({
    paths: {
        sales: { index: 'sales', invoices: 'invoices', invoicedetails: 'invoice/:id' },
    },
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('LinkedInvoice', () => {
    it('shows "Fully Paid" label when invoiceStatus is PAID', () => {
        render(
            <LinkedInvoice
                data={
                    {
                        customerName: 'Acme',
                        invoiceRef: 'INV-101',
                        amount: 500,
                        invoiceStatus: 'PAID',
                        invoiceId: 'i-1',
                    } as any
                }
            />
        );

        expect(screen.getByText('Fully Paid')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('INV-101')).toBeInTheDocument();
        expect(screen.getByText('₹ 500.00')).toBeInTheDocument();
    });

    it('shows the raw status label when not paid', () => {
        render(
            <LinkedInvoice
                data={
                    {
                        customerName: 'Acme',
                        invoiceRef: 'INV-101',
                        amount: 500,
                        invoiceStatus: 'PENDING',
                        invoiceId: 'i-1',
                    } as any
                }
            />
        );

        expect(screen.getByText('PENDING')).toBeInTheDocument();
    });

    it('navigates to invoice detail when View Invoice clicked', () => {
        render(
            <LinkedInvoice
                data={
                    {
                        customerName: 'Acme',
                        invoiceRef: 'INV-101',
                        amount: 500,
                        invoiceStatus: 'PAID',
                        invoiceId: 'i-1',
                    } as any
                }
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /view invoice/i }));
        expect(navigate).toHaveBeenCalledWith('/sales/invoices/invoice/i-1');
    });

    it('disables View Invoice when invoiceId missing', () => {
        render(<LinkedInvoice data={{ customerName: 'A', invoiceRef: '' } as any} />);

        expect(screen.getByRole('button', { name: /view invoice/i })).toBeDisabled();
    });
});
