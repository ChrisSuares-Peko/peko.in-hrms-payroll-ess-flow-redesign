import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import PaymentLinkCreated from '../../../../components/collectPayment/paymentLink/PaymentLinkCreated';

vi.mock('../../../../components/shared/CenteredHeader', () => ({
    default: ({ title, description }: any) => (
        <div>
            <span>{title}</span>
            <span>{description}</span>
        </div>
    ),
}));
vi.mock('../../../../components/shared/CopyableField', () => ({
    default: ({ label, value }: any) => (
        <div>
            <span>{label}</span>
            <span>{value}</span>
        </div>
    ),
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
vi.mock('../../../../utils/helperFunctions', async () => {
    const actual: any = await vi.importActual('../../../../utils/helperFunctions');
    return { ...actual, shareViaWhatsApp: vi.fn() };
});

const baseValues: any = {
    amount: '500',
    customerName: 'Acme',
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('PaymentLinkCreated', () => {
    it('renders header, payment link, summary rows and action buttons', () => {
        render(
            <PaymentLinkCreated
                values={baseValues}
                paymentLink="https://peko.in/p/abc"
                expiresAt="2026-08-05T06:00:00.000Z"
                onCreateAnother={() => {}}
                title="Link Created"
                subtitle="Share with customer"
            />
        );

        expect(screen.getByText('Link Created')).toBeInTheDocument();
        expect(screen.getByText('https://peko.in/p/abc')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('₹ 500.00')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('Link Expires at')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /whatsapp/i })).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /create another payment link/i })
        ).toBeInTheDocument();
    });

    it('triggers onCreateAnother when the secondary button is clicked', () => {
        const onCreateAnother = vi.fn();
        render(
            <PaymentLinkCreated
                values={baseValues}
                paymentLink=""
                onCreateAnother={onCreateAnother}
                title="t"
                subtitle="s"
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /create another/i }));
        expect(onCreateAnother).toHaveBeenCalled();
    });

    it('triggers shareViaWhatsApp when the WhatsApp button is clicked', async () => {
        const helpers = await import('../../../../utils/helperFunctions');
        render(
            <PaymentLinkCreated
                values={baseValues}
                paymentLink="https://x"
                onCreateAnother={() => {}}
                title="t"
                subtitle="s"
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /whatsapp/i }));
        expect(helpers.shareViaWhatsApp).toHaveBeenCalled();
    });
});
