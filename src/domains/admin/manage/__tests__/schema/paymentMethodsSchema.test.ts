import { describe, expect, it } from 'vitest';

import paymentMethodsSchema from '../../schema/paymentMethodsSchema';

const valid = {
    partnerId: '1854',
    paymentMethod: 'PAYMENT_GATEWAY',
    pgProvider: 'cashfree_pg',
    services: ['11'],
    limitPerTransaction: '',
    limitPerDay: '',
    limitPerMonth: '',
};

const errorFor = async (values: Record<string, unknown>) => {
    try {
        await paymentMethodsSchema.validate(values, { abortEarly: true });
        return null;
    } catch (error) {
        return (error as Error).message;
    }
};

describe('paymentMethodsSchema', () => {
    it('accepts a payment method without limits', async () => {
        expect(await errorFor(valid)).toBeNull();
    });

    it('accepts the wallet without a gateway', async () => {
        expect(await errorFor({ ...valid, paymentMethod: 'WALLET', pgProvider: '' })).toBeNull();
    });

    it.each([
        ['a partner', { partnerId: '' }, 'Please select a partner'],
        ['a payment method', { paymentMethod: '' }, 'Please select a payment method'],
        ['a gateway for a payment gateway', { pgProvider: '' }, 'Please select a payment gateway'],
        ['a service', { services: [] }, 'Please select at least one service'],
    ])('requires %s', async (_label, overrides, message) => {
        expect(await errorFor({ ...valid, ...overrides })).toBe(message);
    });

    it('accepts limits that grow from transaction to day to month', async () => {
        expect(
            await errorFor({
                ...valid,
                limitPerTransaction: '1000',
                limitPerDay: '10000',
                limitPerMonth: '100000',
            })
        ).toBeNull();
    });

    it('accepts any limit left empty', async () => {
        expect(
            await errorFor({ ...valid, limitPerTransaction: '5000', limitPerMonth: '5000' })
        ).toBeNull();
    });

    it('rejects a limit that is not a whole number', async () => {
        expect(await errorFor({ ...valid, limitPerDay: '10.5' })).toBe(
            'Limit per day must be a whole number'
        );
    });

    it.each([
        [
            'a daily limit below the transaction limit',
            { limitPerTransaction: '5000', limitPerDay: '1000' },
            'Limit per day cannot be lower than the limit per transaction',
        ],
        [
            'a monthly limit below the daily limit',
            { limitPerDay: '5000', limitPerMonth: '1000' },
            'Limit per month cannot be lower than the limit per day',
        ],
        [
            'a monthly limit below the transaction limit',
            { limitPerTransaction: '5000', limitPerMonth: '1000' },
            'Limit per month cannot be lower than the limit per transaction',
        ],
    ])('rejects %s', async (_label, overrides, message) => {
        expect(await errorFor({ ...valid, ...overrides })).toBe(message);
    });
});
