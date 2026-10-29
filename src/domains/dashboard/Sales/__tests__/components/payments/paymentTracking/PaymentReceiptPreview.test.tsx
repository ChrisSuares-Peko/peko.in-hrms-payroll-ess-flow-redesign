import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import PaymentReceiptPreview from '../../../../components/payments/paymentTracking/PaymentReceiptPreview';

vi.mock('../../../../components/shared/ReceiptRow', () => ({
    default: ({ label, value }: any) => (
        <div>
            <span>{label}</span>
            <span>{value}</span>
        </div>
    ),
}));

describe('PaymentReceiptPreview', () => {
    it('renders header, receipt rows and amount paid', () => {
        const data: any = {
            transactionId: 'T-1',
            customerName: 'Acme',
            invoiceRef: 'INV-101',
            dateTime: '2026-01-01T10:00:00',
            amount: 500,
            status: 'SUCCESS',
            customerGst: 'GST123',
        };
        render(<PaymentReceiptPreview data={data} />);

        expect(screen.getByText('Payment Receipt Preview')).toBeInTheDocument();
        expect(screen.getByText('Payment Receipt')).toBeInTheDocument();
        expect(screen.getByText('PEKO')).toBeInTheDocument();
        expect(screen.getByText('GST: GST123')).toBeInTheDocument();
        expect(screen.getByText('T-1')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('INV-101')).toBeInTheDocument();
        expect(screen.getByText('₹ 500.00')).toBeInTheDocument();
    });

    it('renders dashes when data is null', () => {
        render(<PaymentReceiptPreview data={null} />);

        expect(screen.getByText('Payment Receipt Preview')).toBeInTheDocument();
        expect(screen.getAllByText('-').length).toBeGreaterThan(0);
    });
});
