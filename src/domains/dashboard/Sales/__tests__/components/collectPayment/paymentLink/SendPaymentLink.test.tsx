import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import SendPaymentLink from '../../../../components/collectPayment/paymentLink/SendPaymentLink';
import useSendPaymentLink from '../../../../hooks/collectPayment/useSendPaymentLink';

vi.mock('../../../../hooks/collectPayment/useSendPaymentLink', () => ({ default: vi.fn() }));
vi.mock('../../../../forms/collectPayment/SendPaymentLinkForm', () => ({
    default: () => <div data-testid="send-link-form" />,
}));

const generatePaymentLink = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (useSendPaymentLink as any).mockReturnValue({
        generatePaymentLink,
        isLoading: false,
    });
});

describe('SendPaymentLink', () => {
    it('renders the form, Cancel and Generate buttons', () => {
        render(
            <SendPaymentLink
                onCancel={() => {}}
                onSuccess={() => {}}
                initialValues={{ amount: '100' }}
            />
        );

        expect(screen.getByTestId('send-link-form')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /generate payment link/i })
        ).toBeInTheDocument();
    });

    it('triggers onCancel when Cancel is clicked', () => {
        const onCancel = vi.fn();
        render(
            <SendPaymentLink
                onCancel={onCancel}
                onSuccess={() => {}}
                initialValues={{ amount: '100' }}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
        expect(onCancel).toHaveBeenCalled();
    });

    it('shows loading state on the Generate button when hook returns isLoading', () => {
        (useSendPaymentLink as any).mockReturnValue({
            generatePaymentLink,
            isLoading: true,
        });

        render(<SendPaymentLink onCancel={() => {}} onSuccess={() => {}} />);

        const btn = screen.getByRole('button', { name: /generate payment link/i });
        expect(btn.className).toContain('ant-btn-loading');
    });
});
