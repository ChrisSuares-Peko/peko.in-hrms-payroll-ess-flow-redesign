import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import PaymentSummary from '../../../../components/payments/paymentTracking/PaymentSummary';

vi.mock('../../../../components/shared/CopyableRow', () => ({
    default: ({ title, description }: any) => (
        <div>
            <span>{title}</span>
            <span>{description}</span>
        </div>
    ),
}));

describe('PaymentSummary', () => {
    it('renders all payment fields', () => {
        const data: any = {
            transactionId: 'T-1',
            customerName: 'Acme',
            invoiceRef: 'INV-101',
            amount: 500,
            paymentMethod: 'UPI',
            dateTime: '2026-01-01T00:00:00',
            transactionRef: 'DEC-1',
            status: 'SUCCESS',
        };
        render(<PaymentSummary data={data} />);

        expect(screen.getByText('Payment Summary')).toBeInTheDocument();
        expect(screen.getByText('Payment ID')).toBeInTheDocument();
        // Status appears both as field value and as a Tag — ensure at least one.
        expect(screen.getAllByText('SUCCESS').length).toBeGreaterThan(0);
        expect(screen.getByText('T-1')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('INV-101')).toBeInTheDocument();
        expect(screen.getByText('₹ 500.00')).toBeInTheDocument();
    });

    it('omits the status tag when no status is present', () => {
        const data: any = { transactionId: 'T-1' };
        render(<PaymentSummary data={data} />);

        // No Tag with status text should render.
        expect(screen.queryByText('SUCCESS')).not.toBeInTheDocument();
    });
});
