import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import PaymentRequest from '../../../../components/collectPayment/upiCollect/PaymentRequest';

vi.mock('../../../../components/shared/CenteredHeader', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));
vi.mock('../../../../components/shared/SummaryCard', () => ({
    default: ({ title, rows }: any) => (
        <div>
            <span>{title}</span>
            {rows.map((r: any, i: number) => (
                <div key={i}>
                    <span>{r.label}</span>
                    <span>{typeof r.value === 'string' ? r.value : ''}</span>
                </div>
            ))}
        </div>
    ),
}));

describe('PaymentRequest', () => {
    const pendingData = { amount: '500', upiId: 'a@upi', expiryMinutes: 5 };

    it('renders the request data and countdown', () => {
        render(
            <PaymentRequest
                pendingData={pendingData}
                countdown={120}
                onCancel={() => {}}
                onSendReminder={() => {}}
                onSwitchToPaymentLink={() => {}}
            />
        );

        expect(screen.getByText(/Payment request sent/i)).toBeInTheDocument();
        expect(screen.getByText('₹500')).toBeInTheDocument();
        expect(screen.getByText('a@upi')).toBeInTheDocument();
    });

    it('triggers each action callback', () => {
        const onCancel = vi.fn();
        const onSendReminder = vi.fn();
        const onSwitchToPaymentLink = vi.fn();
        render(
            <PaymentRequest
                pendingData={pendingData}
                countdown={120}
                onCancel={onCancel}
                onSendReminder={onSendReminder}
                onSwitchToPaymentLink={onSwitchToPaymentLink}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /cancel request/i }));
        fireEvent.click(screen.getByRole('button', { name: /send reminder/i }));
        fireEvent.click(screen.getByRole('button', { name: /switch to payment link/i }));

        expect(onCancel).toHaveBeenCalled();
        expect(onSendReminder).toHaveBeenCalled();
        expect(onSwitchToPaymentLink).toHaveBeenCalled();
    });
});
