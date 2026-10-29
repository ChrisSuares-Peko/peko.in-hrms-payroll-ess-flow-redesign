import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import SendUPICollectModal from '../../../../components/collectPayment/upiCollect/SendUPICollectModal';
import useUpiCollect from '../../../../hooks/collectPayment/useUpiCollect';

vi.mock('../../../../hooks/collectPayment/useUpiCollect', () => ({ default: vi.fn() }));
vi.mock('../../../../components/collectPayment/upiCollect/UPICollectForm', () => ({
    default: ({ onSubmit, onCancel }: any) => (
        <div>
            <button type="button" onClick={() => onSubmit({ amount: '100' })}>
                send-upi
            </button>
            <button type="button" onClick={onCancel}>
                cancel-form
            </button>
        </div>
    ),
}));
vi.mock('../../../../components/collectPayment/upiCollect/PaymentRequest', () => ({
    default: () => <div data-testid="pending" />,
}));
vi.mock('../../../../components/collectPayment/upiCollect/PaymentSuccess', () => ({
    default: () => <div data-testid="success" />,
}));
vi.mock('../../../../components/collectPayment/upiCollect/PaymentFailed', () => ({
    default: () => <div data-testid="failed" />,
}));

beforeEach(() => {
    vi.clearAllMocks();
    (useUpiCollect as any).mockReturnValue({
        sendUpiRequest: vi
            .fn()
            .mockResolvedValue({ amount: '100', upiId: 'a@upi', expiryMinutes: 1 }),
        cancelRequest: vi.fn(),
        sendReminder: vi.fn(),
        retryPayment: vi.fn(),
        // pollPaymentStatus left pending so we observe the pending step.
        pollPaymentStatus: vi.fn(() => new Promise(() => {})),
    });
});

describe('SendUPICollectModal', () => {
    it('starts on the form step', () => {
        render(
            <SendUPICollectModal open onCancel={() => {}} onSuccess={() => {}} />
        );

        expect(screen.getByText('send-upi')).toBeInTheDocument();
    });

    it('moves to pending step after successful form submit', async () => {
        render(
            <SendUPICollectModal open onCancel={() => {}} onSuccess={() => {}} />
        );

        fireEvent.click(screen.getByText('send-upi'));
        await screen.findByTestId('pending');
    });
});
