'use strict';
const {
    getAllPaymentMethodsValidation,
    updatePaymentMethodStatusValidation,
    createPaymentMethodValidation,
    editPaymentMethodValidation,
    updatePgMethodsValidation,
} = require('../queryValidation');

const run = (validator, req) => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    validator(req, res, next);
    return { res, next, req };
};

describe('getAllPaymentMethodsValidation payment gateway filter', () => {
    it('accepts a listed gateway', () => {
        const { next, req } = run(getAllPaymentMethodsValidation, { query: { pgProvider: 'cashfree_pg' } });

        expect(next).toHaveBeenCalled();
        expect(req.query.pgProvider).toBe('cashfree_pg');
    });

    it('treats an empty gateway as no filter', () => {
        const { next, req } = run(getAllPaymentMethodsValidation, { query: { pgProvider: '' } });

        expect(next).toHaveBeenCalled();
        expect(req.query.pgProvider).toBeUndefined();
    });

    it('rejects a gateway that is not listed', () => {
        const { res, next } = run(getAllPaymentMethodsValidation, { query: { pgProvider: 'unknown_pg' } });

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Invalid payment gateway selected.' })
        );
    });
});

describe('updatePaymentMethodStatusValidation', () => {
    it('passes a boolean status for a numeric payment method id', () => {
        const { next, req } = run(updatePaymentMethodStatusValidation, {
            params: { id: '1', paymentMethodId: '42' },
            body: { isActive: false, extra: 'x' },
        });

        expect(next).toHaveBeenCalled();
        expect(req.params.paymentMethodId).toBe(42);
        expect(req.body).toEqual({ isActive: false });
    });

    it.each([
        ['a missing status', {}, 'Please select a status.'],
        ['a non-boolean status', { isActive: 'false' }, 'Invalid status selected.'],
    ])('rejects %s', (_label, body, message) => {
        const { res, next } = run(updatePaymentMethodStatusValidation, {
            params: { paymentMethodId: '42' },
            body,
        });

        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message }));
    });

    it('rejects a payment method id that is not a number', () => {
        const { res, next } = run(updatePaymentMethodStatusValidation, {
            params: { paymentMethodId: 'abc' },
            body: { isActive: true },
        });

        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Invalid payment method selected.' })
        );
    });
});

describe('getAllPaymentMethodsValidation payment method filter', () => {
    it('accepts the wallet', () => {
        const { next, req } = run(getAllPaymentMethodsValidation, { query: { paymentMethod: 'WALLET' } });

        expect(next).toHaveBeenCalled();
        expect(req.query.paymentMethod).toBe('WALLET');
    });

    it('rejects an unknown payment method', () => {
        const { res, next } = run(getAllPaymentMethodsValidation, { query: { paymentMethod: 'CASH' } });

        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Invalid payment method selected.' })
        );
    });
});

describe('getAllPaymentMethodsValidation status filter', () => {
    it.each([
        ['true', true],
        ['false', false],
    ])('reads status %s as %s', (isActive, expected) => {
        const { next, req } = run(getAllPaymentMethodsValidation, { query: { isActive } });

        expect(next).toHaveBeenCalled();
        expect(req.query.isActive).toBe(expected);
    });

    it('treats an empty status as no filter', () => {
        const { next, req } = run(getAllPaymentMethodsValidation, { query: { isActive: '' } });

        expect(next).toHaveBeenCalled();
        expect(req.query.isActive).toBeUndefined();
    });

    it('rejects a status that is not a boolean', () => {
        const { res, next } = run(getAllPaymentMethodsValidation, { query: { isActive: 'maybe' } });

        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid status selected.' }));
    });
});

const gatewayBody = (overrides = {}) => ({
    partnerId: 1854,
    paymentMethod: 'PAYMENT_GATEWAY',
    pgProvider: 'cashfree_pg',
    services: ['4', '5'],
    ...overrides,
});

describe('createPaymentMethodValidation', () => {
    it('passes a valid payment method with numbers for services and blank limits as no limit', () => {
        const { next, req } = run(createPaymentMethodValidation, {
            body: gatewayBody({ limitPerTransaction: '1000', limitPerDay: '', extra: 'x' }),
        });

        expect(next).toHaveBeenCalled();
        expect(req.body).toEqual({
            partnerId: 1854,
            paymentMethod: 'PAYMENT_GATEWAY',
            pgProvider: 'cashfree_pg',
            services: [4, 5],
            limitPerTransaction: 1000,
            limitPerDay: 0,
            limitPerMonth: 0,
        });
    });

    it('accepts the default partner', () => {
        const { next } = run(createPaymentMethodValidation, {
            body: gatewayBody({ partnerId: null, paymentMethod: 'WALLET', pgProvider: null }),
        });

        expect(next).toHaveBeenCalled();
    });

    it.each([
        ['a missing partner', { partnerId: undefined }, 'Please select a partner.'],
        ['an unknown payment method', { paymentMethod: 'CASH' }, 'Invalid payment method selected.'],
        ['no services', { services: [] }, 'Please select at least one service.'],
        ['a repeated service', { services: [4, 4] }, 'Each service can be selected only once.'],
        ['an invalid service', { services: ['abc'] }, 'Invalid service selected.'],
        ['a negative limit', { limitPerDay: -1 }, 'Limit per day cannot be negative.'],
        ['a fractional limit', { limitPerTransaction: 10.5 }, 'Limit per transaction must be a whole number.'],
        ['a limit that is too large', { limitPerTransaction: 1000000 }, 'Limit per transaction cannot exceed 999999.'],
        [
            'a daily limit below the transaction limit',
            { limitPerTransaction: 5000, limitPerDay: 1000 },
            'Limit per day cannot be lower than the limit per transaction.',
        ],
        [
            'a monthly limit below the daily limit',
            { limitPerDay: 5000, limitPerMonth: 1000 },
            'Limit per month cannot be lower than the limit per day.',
        ],
        [
            'a monthly limit below the transaction limit',
            { limitPerTransaction: 5000, limitPerMonth: 1000 },
            'Limit per month cannot be lower than the limit per transaction.',
        ],
    ])('rejects %s', (_label, overrides, message) => {
        const { res, next } = run(createPaymentMethodValidation, { body: gatewayBody(overrides) });

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message }));
    });

    it('allows any limit to be left as no limit', () => {
        const { next } = run(createPaymentMethodValidation, {
            body: gatewayBody({ limitPerTransaction: 5000, limitPerDay: 0, limitPerMonth: 0 }),
        });

        expect(next).toHaveBeenCalled();
    });
});

describe('editPaymentMethodValidation', () => {
    it('passes a valid edit and fills missing limits with no limit', () => {
        const { next, req } = run(editPaymentMethodValidation, {
            params: { id: '1', paymentMethodId: '31' },
            body: gatewayBody({ rowIdToUpdate: 31, limits: { limitPerTransaction: '2000' } }),
        });

        expect(next).toHaveBeenCalled();
        expect(req.params.paymentMethodId).toBe(31);
        expect(req.body).toEqual({
            partnerId: 1854,
            paymentMethod: 'PAYMENT_GATEWAY',
            pgProvider: 'cashfree_pg',
            services: [4, 5],
            limits: { limitPerTransaction: 2000, limitPerDay: 0, limitPerMonth: 0 },
        });
    });

    it('rejects inconsistent limits', () => {
        const { res, next } = run(editPaymentMethodValidation, {
            params: { paymentMethodId: '31' },
            body: gatewayBody({ limits: { limitPerTransaction: 5000, limitPerDay: 1000 } }),
        });

        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Limit per day cannot be lower than the limit per transaction.' })
        );
    });

    it('rejects a payment method id that is not a number', () => {
        const { res, next } = run(editPaymentMethodValidation, {
            params: { paymentMethodId: 'abc' },
            body: gatewayBody(),
        });

        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Invalid payment method selected.' })
        );
    });
});

describe('updatePgMethodsValidation', () => {
    const settings = { isGatewayPaymentAvailable: true, isWalletPaymentAvailable: false, isCouponApplicable: true };

    it('keeps only the three global settings', () => {
        const { next, req } = run(updatePgMethodsValidation, {
            body: { ...settings, gatewayLimit: { limitPerTransaction: 1 } },
        });

        expect(next).toHaveBeenCalled();
        expect(req.body).toEqual(settings);
    });

    it.each([
        ['a missing setting', { isGatewayPaymentAvailable: true, isWalletPaymentAvailable: true }],
        ['a setting sent as text', { ...settings, isWalletPaymentAvailable: 'false' }],
    ])('rejects %s', (_label, body) => {
        const { res, next } = run(updatePgMethodsValidation, { body });

        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Invalid payment settings. Please refresh the page and try again.',
            })
        );
    });

    it('rejects coupons without the payment gateway', () => {
        const { res, next } = run(updatePgMethodsValidation, {
            body: { ...settings, isGatewayPaymentAvailable: false },
        });

        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Coupons need the payment gateway to be on.' })
        );
    });
});
