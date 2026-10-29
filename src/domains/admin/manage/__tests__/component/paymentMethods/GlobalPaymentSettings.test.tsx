import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import GlobalPaymentSettings from '../../../component/paymentMethods/GlobalPaymentSettings';
import { PaymentMethodsState } from '../../../types/paymentMethods';

const onToggle = vi.fn();
const onSave = vi.fn();
const onDiscard = vi.fn();
const onRetry = vi.fn();

const allOn: PaymentMethodsState = {
    isGatewayPaymentAvailable: true,
    isWalletPaymentAvailable: true,
    isCorporateCardPaymentAvailable: true,
    isCouponApplicable: true,
};

const renderSettings = (
    overrides: Partial<React.ComponentProps<typeof GlobalPaymentSettings>> = {}
) =>
    render(
        <GlobalPaymentSettings
            settings={allOn}
            isLoading={false}
            isDirty={false}
            isSaving={false}
            onToggle={onToggle}
            onSave={onSave}
            onDiscard={onDiscard}
            onRetry={onRetry}
            {...overrides}
        />
    );

describe('GlobalPaymentSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a placeholder while the settings load', () => {
        renderSettings({ settings: null, isLoading: true });

        expect(screen.queryByRole('switch')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
    });

    it('offers a retry when the settings could not be loaded', () => {
        renderSettings({ settings: null, isLoading: false });

        expect(screen.getByText('The global settings could not be loaded.')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(onRetry).toHaveBeenCalled();
    });

    it('shows a switch for each global setting', () => {
        renderSettings();

        expect(screen.getByRole('switch', { name: 'Payment gateway' })).toBeChecked();
        expect(screen.getByRole('switch', { name: 'Wallet payments' })).toBeChecked();
        expect(screen.getByRole('switch', { name: 'Corporate card payments' })).toBeChecked();
        expect(screen.getByRole('switch', { name: 'Coupons' })).toBeChecked();
    });

    it('reports a toggled setting', () => {
        renderSettings();

        fireEvent.click(screen.getByRole('switch', { name: 'Wallet payments' }));

        expect(onToggle).toHaveBeenCalledWith('isWalletPaymentAvailable', false);
    });

    it('keeps coupons off until the payment gateway is on', () => {
        renderSettings({
            settings: { ...allOn, isGatewayPaymentAvailable: false, isCouponApplicable: false },
        });

        expect(screen.getByRole('switch', { name: 'Coupons' })).toBeDisabled();
        expect(
            screen.getByText('Turn on the payment gateway to allow coupons.')
        ).toBeInTheDocument();
    });

    it('allows saving only after a change', () => {
        renderSettings();

        expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
        expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
        expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });

    it('saves or discards pending changes', () => {
        renderSettings({ isDirty: true });

        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
        fireEvent.click(screen.getByRole('button', { name: 'Discard' }));

        expect(onSave).toHaveBeenCalled();
        expect(onDiscard).toHaveBeenCalled();
    });

    it('locks the switches while saving', () => {
        renderSettings({ isDirty: true, isSaving: true });

        expect(screen.getByRole('switch', { name: 'Payment gateway' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Discard' })).toBeDisabled();
    });
});
