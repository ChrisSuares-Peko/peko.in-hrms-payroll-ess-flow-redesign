import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useGlobalPaymentSettings from '../../hooks/paymentMethods/useGlobalPaymentSettings';
import { PaymentMethodsState } from '../../types/paymentMethods';

const updatePaymentMethods = vi.fn();

vi.mock('../../hooks/paymentMethods/useUpdatePaymentMethods', () => ({
    default: () => ({ updatePaymentMethods, isLoading: false }),
}));

const serverSettings: PaymentMethodsState = {
    isGatewayPaymentAvailable: true,
    isWalletPaymentAvailable: true,
    isCouponApplicable: true,
};

const renderSettings = (initial: PaymentMethodsState | null = serverSettings) =>
    renderHook(({ settings }) => useGlobalPaymentSettings(settings), {
        initialProps: { settings: initial },
    });

describe('useGlobalPaymentSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('waits for the server settings', () => {
        const { result, rerender } = renderSettings(null);

        expect(result.current.settings).toBeNull();
        expect(result.current.isDirty).toBe(false);

        rerender({ settings: serverSettings });

        expect(result.current.settings).toEqual(serverSettings);
    });

    it('marks the settings as changed after a toggle', () => {
        const { result } = renderSettings();

        act(() => result.current.toggleSetting('isWalletPaymentAvailable', false));

        expect(result.current.settings?.isWalletPaymentAvailable).toBe(false);
        expect(result.current.isDirty).toBe(true);
    });

    it('turns coupons off with the payment gateway', () => {
        const { result } = renderSettings();

        act(() => result.current.toggleSetting('isGatewayPaymentAvailable', false));

        expect(result.current.settings).toMatchObject({
            isGatewayPaymentAvailable: false,
            isCouponApplicable: false,
        });
    });

    it('keeps coupons off while the payment gateway is off', () => {
        const { result } = renderSettings({
            ...serverSettings,
            isGatewayPaymentAvailable: false,
            isCouponApplicable: false,
        });

        act(() => result.current.toggleSetting('isCouponApplicable', true));

        expect(result.current.settings?.isCouponApplicable).toBe(false);
        expect(result.current.isDirty).toBe(false);
    });

    it('is unchanged again once a toggle is undone', () => {
        const { result } = renderSettings();

        act(() => result.current.toggleSetting('isWalletPaymentAvailable', false));
        act(() => result.current.toggleSetting('isWalletPaymentAvailable', true));

        expect(result.current.isDirty).toBe(false);
    });

    it('discards the changes', () => {
        const { result } = renderSettings();

        act(() => result.current.toggleSetting('isWalletPaymentAvailable', false));
        act(() => result.current.discardChanges());

        expect(result.current.settings).toEqual(serverSettings);
        expect(result.current.isDirty).toBe(false);
    });

    it('treats the saved settings as the new baseline', async () => {
        updatePaymentMethods.mockResolvedValue(true);
        const { result } = renderSettings();

        act(() => result.current.toggleSetting('isWalletPaymentAvailable', false));
        await act(async () => {
            await result.current.saveChanges();
        });

        expect(updatePaymentMethods).toHaveBeenCalledWith({
            ...serverSettings,
            isWalletPaymentAvailable: false,
        });
        expect(result.current.isDirty).toBe(false);
    });

    it('keeps the changes pending when saving fails', async () => {
        updatePaymentMethods.mockResolvedValue(false);
        const { result } = renderSettings();

        act(() => result.current.toggleSetting('isWalletPaymentAvailable', false));
        await act(async () => {
            await result.current.saveChanges();
        });

        expect(result.current.isDirty).toBe(true);
    });

    it('keeps unsaved changes when the list reloads', () => {
        const { result, rerender } = renderSettings();

        act(() => result.current.toggleSetting('isWalletPaymentAvailable', false));
        rerender({ settings: { ...serverSettings } });

        expect(result.current.settings?.isWalletPaymentAvailable).toBe(false);
        expect(result.current.isDirty).toBe(true);
    });
});
