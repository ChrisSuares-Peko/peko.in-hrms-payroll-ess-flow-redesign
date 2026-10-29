import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PaymentTimelineAndDetails from '../../../components/invoiceDetails/PaymentTimelineAndDetails';

const invoice = {
    id: 1,
    invoiceNumber: 'INV-1',
    name: 'Arshid',
    status: 'PENDING',
    currency: 'INR',
    totalAmount: '100',
    amountDue: '50',
    invoiceDate: '2024-01-01',
    dueDate: '2024-01-10',
    notes: '',
} as any;

describe('PaymentTimelineAndDetails', () => {
    it('renders a loading placeholder and no detail rows when isLoading is true', () => {
        render(<PaymentTimelineAndDetails invoiceData={null} isLoading />);

        expect(screen.queryByText('Customer Name')).not.toBeInTheDocument();
        expect(screen.queryByText('Status')).not.toBeInTheDocument();
    });

    it('renders invoice detail rows when invoiceData is provided', () => {
        render(<PaymentTimelineAndDetails invoiceData={invoice} isLoading={false} />);

        expect(screen.getByText('Invoice Number')).toBeInTheDocument();
        expect(screen.getByText('INV-1')).toBeInTheDocument();
        expect(screen.getByText('Customer Name')).toBeInTheDocument();
        expect(screen.getByText('Arshid')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('labels the number row as "Quotation Number" for quotations', () => {
        render(
            <PaymentTimelineAndDetails
                invoiceData={{ ...invoice, documentType: 'QUOTATION' } as any}
                isLoading={false}
            />
        );

        expect(screen.getByText('Quotation Number')).toBeInTheDocument();
    });
});
