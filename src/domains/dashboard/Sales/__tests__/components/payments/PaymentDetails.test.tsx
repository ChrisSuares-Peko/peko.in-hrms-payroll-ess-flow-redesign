import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import PaymentDetails from '../../../components/payments/PaymentDetails';
import usePaymentDetails from '../../../hooks/usePaymentDetails';

vi.mock('../../../hooks/usePaymentDetails', () => ({ default: vi.fn() }));
vi.mock('../../../components/payments/paymentTracking/CustomerInformation', () => ({
    default: () => <div data-testid="customer-info" />,
}));
vi.mock('../../../components/payments/paymentTracking/LinkedInvoice', () => ({
    default: () => <div data-testid="linked-invoice" />,
}));
vi.mock('../../../components/payments/paymentTracking/PaymentReceiptPreview', () => ({
    default: () => <div data-testid="receipt-preview" />,
}));
vi.mock('../../../components/payments/paymentTracking/PaymentSummary', () => ({
    default: () => <div data-testid="payment-summary" />,
}));
vi.mock('../../../components/payments/paymentTracking/TransactionTimeline', () => ({
    default: () => <div data-testid="timeline" />,
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('PaymentDetails', () => {
    it('renders skeleton while loading', () => {
        (usePaymentDetails as any).mockReturnValue({ data: null, isLoading: true });

        const { container } = render(<PaymentDetails id="t-1" onBack={() => {}} />);

        expect(container.querySelector('.ant-skeleton')).not.toBeNull();
        expect(screen.queryByTestId('payment-summary')).not.toBeInTheDocument();
    });

    it('renders all detail sections once loaded', () => {
        (usePaymentDetails as any).mockReturnValue({
            data: { transactionId: 't-1' },
            isLoading: false,
        });

        render(<PaymentDetails id="t-1" onBack={() => {}} />);

        expect(screen.getByTestId('payment-summary')).toBeInTheDocument();
        expect(screen.getByTestId('linked-invoice')).toBeInTheDocument();
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
        expect(screen.getByTestId('customer-info')).toBeInTheDocument();
        expect(screen.getByTestId('receipt-preview')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /download receipt/i })).toBeInTheDocument();
    });

    it('triggers onBack when the back link is clicked', () => {
        (usePaymentDetails as any).mockReturnValue({ data: null, isLoading: false });
        const onBack = vi.fn();

        render(<PaymentDetails id="t-1" onBack={onBack} />);

        fireEvent.click(screen.getByText('Back'));
        expect(onBack).toHaveBeenCalled();
    });
});
