import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PaymentRequest from '../../../../components/invoiceDetails/upiCollect/PaymentRequest';

const pendingData = { amount: '1000', upiId: 'arshid@upi', expiryMinutes: 5 };

describe('PaymentRequest', () => {
    it('renders header, request details and countdown', () => {
        render(
            <PaymentRequest
                pendingData={pendingData}
                countdown={300}
                onCancel={vi.fn()}
                onSendReminder={vi.fn()}
                onSwitchToPaymentLink={vi.fn()}
            />
        );

        expect(screen.getByText('Payment request sent to customer')).toBeInTheDocument();
        expect(screen.getByText('Request Details')).toBeInTheDocument();
        expect(screen.getByText('arshid@upi')).toBeInTheDocument();
        expect(screen.getByText('Pending Customer Approval')).toBeInTheDocument();
    });

    it('fires the three action callbacks', () => {
        const onCancel = vi.fn();
        const onSendReminder = vi.fn();
        const onSwitchToPaymentLink = vi.fn();
        render(
            <PaymentRequest
                pendingData={pendingData}
                countdown={300}
                onCancel={onCancel}
                onSendReminder={onSendReminder}
                onSwitchToPaymentLink={onSwitchToPaymentLink}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /Cancel Request/i }));
        fireEvent.click(screen.getByRole('button', { name: /Send Reminder/i }));
        fireEvent.click(screen.getByRole('button', { name: /Switch to Payment Link/i }));

        expect(onCancel).toHaveBeenCalled();
        expect(onSendReminder).toHaveBeenCalled();
        expect(onSwitchToPaymentLink).toHaveBeenCalled();
    });
});
