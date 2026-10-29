import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DisableGatewayModal from '../../../component/paymentMethods/DisableGatewayModal';
import { PaymentMethod } from '../../../types/paymentMethods';

const gatewayRow = (overrides: Partial<PaymentMethod> = {}): PaymentMethod => ({
    id: 1,
    partnerId: 1854,
    name: 'Mswipe BOS',
    paymentMethod: 'PAYMENT_GATEWAY',
    pgProvider: 'cashfree_pg',
    pgProviderName: 'Cashfree',
    isActive: true,
    hasOtherActiveGateway: false,
    createdAt: '2026-10-27T10:00:00.000Z',
    updatedAt: '2026-10-27T10:00:00.000Z',
    limits: { limitPerTransaction: 0, limitPerDay: 0, limitPerMonth: 0 },
    serviceList: [11, 12, 13],
    ...overrides,
});

const summaryValue = (label: string) => screen.getByText(label).nextElementSibling?.textContent;

describe('DisableGatewayModal', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderModal = (paymentMethod?: PaymentMethod, isLoading = false) =>
        render(
            <DisableGatewayModal
                paymentMethod={paymentMethod}
                isLoading={isLoading}
                onConfirm={onConfirm}
                onCancel={onCancel}
            />
        );

    it('stays closed without a payment method to disable', () => {
        renderModal();

        expect(screen.queryByText('Disable the last payment gateway?')).not.toBeInTheDocument();
    });

    it('explains the impact and names the partner, gateway and services affected', () => {
        renderModal(gatewayRow());

        expect(screen.getByText('Disable the last payment gateway?')).toBeInTheDocument();
        expect(
            screen.getByText(/This partner has no other active payment gateway\./)
        ).toBeInTheDocument();
        expect(summaryValue('Partner')).toBe('Mswipe BOS');
        expect(summaryValue('Payment gateway')).toBe('Cashfree');
        expect(summaryValue('Services affected')).toBe('3');
    });

    it('names the default partner rows as Default', () => {
        renderModal(gatewayRow({ partnerId: null, name: null }));

        expect(summaryValue('Partner')).toBe('Default');
    });

    it('disables the gateway only when confirmed', () => {
        renderModal(gatewayRow());

        fireEvent.click(screen.getByRole('button', { name: 'Disable gateway' }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('keeps the gateway on when cancelled', () => {
        renderModal(gatewayRow());

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('cannot be cancelled while the gateway is being disabled', () => {
        renderModal(gatewayRow(), true);

        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
        expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    });
});
