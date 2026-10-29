import { describe, expect, it } from 'vitest';

import {
    applyGlobalSettingToggle,
    getMethodFilterValue,
    getPartnerLabel,
    getPaymentMethodName,
    toLimitAmount,
    toMethodFilters,
} from '../../utils/paymentMethods';

describe('payment method utils', () => {
    it.each([
        [1000, 1000],
        ['2500', 2500],
        ['', 0],
        [null, 0],
        [undefined, 0],
        [-10, 0],
        ['abc', 0],
    ])('reads limit %p as %p', (value, amount) => {
        expect(toLimitAmount(value)).toBe(amount);
    });

    it.each([
        [{ name: 'Mswipe BOS', partnerId: 1854 }, 'Mswipe BOS'],
        [{ name: null, partnerId: null }, 'Default'],
        [{ name: null, partnerId: 1854 }, 'Unknown partner'],
    ])('labels partner %o as %s', (record, label) => {
        expect(getPartnerLabel(record)).toBe(label);
    });

    it.each([
        [{ paymentMethod: 'WALLET' as const, pgProviderName: null }, 'Wallet'],
        [{ paymentMethod: 'CORPORATE_CARD' as const, pgProviderName: null }, 'Corporate card'],
        [{ paymentMethod: 'PAYMENT_GATEWAY' as const, pgProviderName: 'Cashfree' }, 'Cashfree'],
        [{ paymentMethod: 'PAYMENT_GATEWAY' as const, pgProviderName: null }, 'Payment gateway'],
    ])('names payment method %o as %s', (record, name) => {
        expect(getPaymentMethodName(record)).toBe(name);
    });

    it.each([
        [undefined, { paymentMethod: '', pgProvider: '' }],
        ['WALLET', { paymentMethod: 'WALLET', pgProvider: '' }],
        ['CORPORATE_CARD', { paymentMethod: 'CORPORATE_CARD', pgProvider: '' }],
        ['cashfree_pg', { paymentMethod: '', pgProvider: 'cashfree_pg' }],
    ])('turns the method filter %p into list filters', (value, expected) => {
        expect(toMethodFilters(value)).toEqual(expected);
        expect(getMethodFilterValue(expected as any)).toBe(value ?? '');
    });

    it('turns coupons off with the payment gateway', () => {
        expect(
            applyGlobalSettingToggle(
                {
                    isGatewayPaymentAvailable: true,
                    isWalletPaymentAvailable: true,
                    isCouponApplicable: true,
                },
                'isGatewayPaymentAvailable',
                false
            )
        ).toEqual({
            isGatewayPaymentAvailable: false,
            isWalletPaymentAvailable: true,
            isCouponApplicable: false,
        });
    });
});
