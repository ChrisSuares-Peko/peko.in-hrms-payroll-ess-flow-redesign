import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import PaymentSuccess from '../../../../components/collectPayment/upiCollect/PaymentSuccess';

vi.mock('../../../../components/shared/CenteredHeader', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));
vi.mock('../../../../components/shared/SummaryCard', () => ({
    default: ({ title, rows }: any) => (
        <div>
            <span>{title}</span>
            {rows.map((r: any) => (
                <div key={r.label}>
                    <span>{r.label}</span>
                    <span>{r.value}</span>
                </div>
            ))}
        </div>
    ),
}));

describe('PaymentSuccess', () => {
    it('renders amount, reference and triggers onClose', () => {
        const onClose = vi.fn();
        render(
            <PaymentSuccess
                successData={{ amount: '500', referenceId: 'TXN-1', dateTime: 'Jan 1' }}
                onClose={onClose}
            />
        );

        expect(screen.getByText('Payment Successful')).toBeInTheDocument();
        expect(screen.getByText('₹500')).toBeInTheDocument();
        expect(screen.getByText('TXN-1')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /view transactions/i }));
        expect(onClose).toHaveBeenCalled();
    });
});
