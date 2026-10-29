import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PaymentLinkCreated from '../../../components/shared/PaymentLinkCreated';
import { shareViaWhatsApp } from '../../../utils/helperFunctions';

vi.mock('../../../utils/helperFunctions', async () => {
    const actual: any = await vi.importActual('../../../utils/helperFunctions');
    return { ...actual, shareViaWhatsApp: vi.fn() };
});

describe('PaymentLinkCreated', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders title, subtitle, payment link and summary rows', () => {
        render(
            <PaymentLinkCreated
                title="Done!"
                subtitle="Share below"
                paymentLink="https://pay/abc"
                expiresAt="2026-08-05T06:00:00.000Z"
                values={{
                    amount: '100',
                    customerName: 'Arshid',
                    customerPhone: '999',
                }}
                onCreateAnother={vi.fn()}
            />
        );

        expect(screen.getByText('Done!')).toBeInTheDocument();
        expect(screen.getByText('Share below')).toBeInTheDocument();
        expect(screen.getByDisplayValue('https://pay/abc')).toBeInTheDocument();
        expect(screen.getByText('Link Expires at')).toBeInTheDocument();
        expect(screen.getByText('Arshid')).toBeInTheDocument();
    });

    it('calls shareViaWhatsApp with a message containing the link', () => {
        render(
            <PaymentLinkCreated
                title="t"
                subtitle="s"
                paymentLink="https://pay/abc"
                values={{
                    amount: '100',
                    customerName: 'Arshid',
                    customerPhone: '',
                }}
                onCreateAnother={vi.fn()}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /WhatsApp/i }));
        expect(shareViaWhatsApp).toHaveBeenCalledWith(expect.stringContaining('https://pay/abc'));
    });

    it('fires onCreateAnother when the second button is clicked', () => {
        const onCreateAnother = vi.fn();
        render(
            <PaymentLinkCreated
                title="t"
                subtitle="s"
                paymentLink="https://pay/abc"
                values={{ amount: '100', customerName: 'x', customerPhone: '' }}
                onCreateAnother={onCreateAnother}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /Create another payment link/i }));
        expect(onCreateAnother).toHaveBeenCalledTimes(1);
    });
});
