import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import PaymentLinkModal from '../../../../components/collectPayment/paymentLink/PaymentLinkModal.tsx';

vi.mock('../../../../components/collectPayment/paymentLink/SendPaymentLink', () => ({
    default: ({ onCancel, onSuccess }: any) => (
        <div>
            <button type="button" onClick={onCancel}>
                cancel-form
            </button>
            <button
                type="button"
                onClick={() => onSuccess({ amount: '100' }, 'https://link')}
            >
                trigger-success
            </button>
        </div>
    ),
}));
vi.mock('../../../../components/collectPayment/paymentLink/PaymentLinkCreated', () => ({
    default: ({ onCreateAnother }: any) => (
        <div>
            <span>created</span>
            <button type="button" onClick={onCreateAnother}>
                another
            </button>
        </div>
    ),
}));
vi.mock('../../../../components/shared/LeftHeader', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));

describe('PaymentLinkModal', () => {
    it('initially renders the SendPaymentLink form', () => {
        render(<PaymentLinkModal open onCancel={() => {}} />);

        expect(screen.getByText('Create Payment Link')).toBeInTheDocument();
        expect(screen.getByText('cancel-form')).toBeInTheDocument();
    });

    it('switches to PaymentLinkCreated after a successful submission', () => {
        render(<PaymentLinkModal open onCancel={() => {}} />);

        fireEvent.click(screen.getByText('trigger-success'));
        expect(screen.getByText('created')).toBeInTheDocument();
    });

    it('resets to the form when "Create another" is clicked', () => {
        render(<PaymentLinkModal open onCancel={() => {}} />);

        fireEvent.click(screen.getByText('trigger-success'));
        fireEvent.click(screen.getByText('another'));
        expect(screen.getByText('cancel-form')).toBeInTheDocument();
    });
});
