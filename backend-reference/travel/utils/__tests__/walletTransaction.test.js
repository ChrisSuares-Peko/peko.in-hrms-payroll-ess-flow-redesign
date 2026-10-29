const { Op } = require('sequelize');

jest.mock('../../models/use-cases/order', () => ({ findOneOrder: jest.fn() }));
jest.mock('../../models/use-cases/transaction', () => ({ findOneTransaction: jest.fn() }));
jest.mock('../../models/use-cases/pekoCredits', () => ({ findOneCoupon: jest.fn() }));
jest.mock('../../models/entities/order', () => ({ create: jest.fn(), update: jest.fn(), findOne: jest.fn(), count: jest.fn() }));
jest.mock('../../models/entities/wallet', () => ({ findOne: jest.fn(), update: jest.fn() }));
jest.mock('../../models/entities/transaction', () => ({ findOne: jest.fn(), create: jest.fn(), update: jest.fn() }));
jest.mock('../../models/entities/userCoupons', () => ({ update: jest.fn() }));

const sequelizeConfig = require('../../configs/database/index');
const orders = require('../../models/use-cases/order');
const { findOneTransaction } = require('../../models/use-cases/transaction');
const { findOneCoupon } = require('../../models/use-cases/pekoCredits');
const order = require('../../models/entities/order');
const wallet = require('../../models/entities/wallet');
const walletTransaction = require('../../models/entities/transaction');
const UserCoupons = require('../../models/entities/userCoupons');
const {
    createWalletTransaction,
    updateWalletTransaction,
    refundWalletTransaction,
    getPartialRefundDetails,
} = require('../walletTransaction');

const t = { LOCK: { UPDATE: 'UPDATE' }, commit: jest.fn(), rollback: jest.fn() };

const debit = (overrides = {}) => ({
    providerId: 'P1',
    corporateTxnId: 'TXN1',
    credentialId: 7,
    serviceOperatorId: 3,
    corporateCashback: 0,
    transactionCategory: 'Travel',
    amount: 1000,
    commissionType: 'FLAT',
    cashbackType: 'FLAT',
    providerCommission: 0,
    surcharge: 20,
    ...overrides,
});

const paymentRow = (overrides = {}) => ({
    id: 11,
    corporateTxnId: 'TXN1',
    credentialId: 7,
    orderId: 5,
    debitAmount: 1020,
    creditAmount: 0,
    corporateCashback: 0,
    systemCashback: 0,
    remarks: 'Payment Successful',
    createdAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
});

beforeEach(() => {
    jest.clearAllMocks();
    sequelizeConfig.transaction.mockImplementation(async (arg) => (typeof arg === 'function' ? arg(t) : t));
    orders.findOneOrder.mockResolvedValue(null);
    wallet.findOne.mockResolvedValue({ balance: '5000.0000' });
    order.create.mockResolvedValue({ id: 5, paymentMode: 'WALLET' });
    order.count.mockResolvedValue(0);
    walletTransaction.create.mockResolvedValue({ id: 11 });
    UserCoupons.update.mockResolvedValue([1]);
});

describe('createWalletTransaction — amount guard', () => {
    it.each([
        ['a negative amount', { amount: -500 }],
        ['a zero amount', { amount: 0 }],
        ['a non-numeric amount', { amount: '12abc' }],
        ['a missing amount', { amount: undefined }],
        ['an infinite amount', { amount: Infinity }],
        ['a negative surcharge', { surcharge: -20 }],
        ['a non-numeric surcharge', { surcharge: 'abc' }],
    ])('refuses %s before touching the wallet', async (_label, overrides) => {
        const result = await createWalletTransaction(debit(overrides));

        expect(result).toEqual({ error: 'INVALID AMOUNT' });
        expect(orders.findOneOrder).not.toHaveBeenCalled();
        expect(wallet.findOne).not.toHaveBeenCalled();
        expect(wallet.update).not.toHaveBeenCalled();
    });

    it('treats a missing surcharge as zero', async () => {
        await createWalletTransaction(debit({ surcharge: undefined }));

        expect(wallet.update).toHaveBeenCalledWith({ balance: '4000.0000' }, expect.anything());
    });

    it('refuses a debit whose resulting balance is not a number', async () => {
        const result = await createWalletTransaction(debit({ corporateCashback: undefined }));

        expect(result).toEqual({ error: 'INVALID AMOUNT' });
        expect(wallet.update).not.toHaveBeenCalled();
    });
});

describe('createWalletTransaction — debit', () => {
    it('debits amount plus surcharge and records the sub-user, batch and report fields', async () => {
        const result = await createWalletTransaction(debit({
            subCorporateUserId: 99,
            batchId: 'B1',
            reportData: { optional: 'BUS' },
        }));

        expect(wallet.update).toHaveBeenCalledWith({ balance: '3980.0000' }, expect.objectContaining({ transaction: t }));
        expect(order.create).toHaveBeenCalledWith(
            expect.objectContaining({ amountInINR: '1020.00', subCorporateUserId: 99, batchId: 'B1', optional: 'BUS', status: 'PENDING' }),
            { transaction: t }
        );
        expect(result).toEqual(expect.objectContaining({ orderId: 5, transactionId: 11, paymentMode: 'WALLET' }));
    });

    it('refuses a debit larger than the balance', async () => {
        wallet.findOne.mockResolvedValue({ balance: '100.0000' });

        const result = await createWalletTransaction(debit());

        expect(result).toEqual({ error: 'INSUFFICIENT WALLET BALANCE' });
        expect(wallet.update).not.toHaveBeenCalled();
    });

    it('refuses a reused transaction id', async () => {
        orders.findOneOrder.mockResolvedValue({ id: 1 });

        const result = await createWalletTransaction(debit());

        expect(result).toEqual({ error: 'DUPLICATE TRANSACTION ID' });
        expect(wallet.update).not.toHaveBeenCalled();
    });
});

describe('createWalletTransaction — coupons', () => {
    const couponDebit = (overrides = {}) => debit({ couponCode: 'BUS10', corporateUserId: 70, partnerId: '3', ...overrides });
    const pekoCredit = (couponData = {}) => ({
        id: 41,
        couponData: { id: 9, code: 'BUS10', discountType: 'PERCENTAGE', discount: '10', minimumPurchase: '0', maximumDiscount: '50', ...couponData },
    });
    const serviceCoupon = (couponData = {}) => ({
        couponData: { id: 15, couponCode: 'BUS10', discountType: 'FLAT', discount: '100', minimumPurchase: '0', usageCount: 2, ...couponData },
    });

    it('debits the discounted amount, claims the credit coupon and records it on the order', async () => {
        findOneCoupon.mockResolvedValue(pekoCredit());

        const result = await createWalletTransaction(couponDebit());

        expect(findOneCoupon).toHaveBeenCalledWith({ couponCode: 'BUS10', corporateUserId: 70, serviceId: 3, partnerId: '3' });
        expect(UserCoupons.update).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'CLAIMED' }),
            { where: { id: 41, status: 'UNCLAIMED' }, transaction: t }
        );
        expect(wallet.update).toHaveBeenCalledWith({ balance: '4030.0000' }, expect.anything());
        expect(order.create).toHaveBeenCalledWith(
            expect.objectContaining({ amountInINR: '1020.00', userCouponId: 41, couponCodeId: null }),
            { transaction: t }
        );
        expect(walletTransaction.create).toHaveBeenCalledWith(expect.objectContaining({ debitAmount: '970.00' }), { transaction: t });
        expect(result).toEqual(expect.objectContaining({ couponId: 41, couponDiscount: 50 }));
    });

    it('counts service coupon usage inside the wallet lock and records the coupon on the order', async () => {
        findOneCoupon.mockResolvedValue(serviceCoupon());
        order.count.mockResolvedValue(1);

        const result = await createWalletTransaction(couponDebit());

        expect(order.count).toHaveBeenCalledWith({ where: { couponCodeId: 15, credentialId: 7 }, transaction: t });
        expect(UserCoupons.update).not.toHaveBeenCalled();
        expect(order.create).toHaveBeenCalledWith(expect.objectContaining({ userCouponId: null, couponCodeId: 15 }), { transaction: t });
        expect(result).toEqual(expect.objectContaining({ couponId: null, couponDiscount: 100 }));
    });

    it('refuses a service coupon that has reached its usage limit', async () => {
        findOneCoupon.mockResolvedValue(serviceCoupon());
        order.count.mockResolvedValue(2);

        const result = await createWalletTransaction(couponDebit());

        expect(result).toEqual({ error: 'COUPON_USAGE_LIMIT_EXCEEDED' });
        expect(wallet.update).not.toHaveBeenCalled();
    });

    it('refuses a credit coupon that another payment claimed first', async () => {
        findOneCoupon.mockResolvedValue(pekoCredit());
        UserCoupons.update.mockResolvedValue([0]);

        const result = await createWalletTransaction(couponDebit());

        expect(result).toEqual({ error: 'COUPON ALREADY CLAIMED' });
        expect(wallet.update).not.toHaveBeenCalled();
    });

    it('refuses an unknown coupon before touching the wallet', async () => {
        findOneCoupon.mockResolvedValue(null);

        const result = await createWalletTransaction(couponDebit());

        expect(result).toEqual({ error: 'INVALID COUPON CODE' });
        expect(wallet.findOne).not.toHaveBeenCalled();
    });

    it('refuses a coupon below its minimum purchase', async () => {
        findOneCoupon.mockResolvedValue(pekoCredit({ minimumPurchase: '5000' }));

        const result = await createWalletTransaction(couponDebit());

        expect(result).toEqual({ error: 'COUPON MINIMUM PURCHASE NOT MET' });
        expect(wallet.findOne).not.toHaveBeenCalled();
    });

    it('refuses a coupon that would cover the whole payment', async () => {
        findOneCoupon.mockResolvedValue(serviceCoupon({ discount: '5000' }));

        const result = await createWalletTransaction(couponDebit());

        expect(result).toEqual({ error: 'INVALID COUPON CODE' });
        expect(wallet.findOne).not.toHaveBeenCalled();
    });

    it('debits the full amount and records no coupon when none is given', async () => {
        const result = await createWalletTransaction(debit());

        expect(findOneCoupon).not.toHaveBeenCalled();
        expect(order.create).toHaveBeenCalledWith(expect.objectContaining({ userCouponId: null, couponCodeId: null }), { transaction: t });
        expect(result).toEqual(expect.objectContaining({ couponId: null, couponDiscount: 0 }));
    });
});

describe('updateWalletTransaction', () => {
    it('never rewrites the refund ledger rows', async () => {
        await updateWalletTransaction({ corporateTxnId: 'TXN1', status: 'SUCCESS', message: 'Payment Successful', providerId: 'P1' });

        expect(walletTransaction.update).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'SUCCESS' }),
            expect.objectContaining({
                where: { corporateTxnId: { [Op.eq]: 'TXN1' }, remarks: { [Op.notLike]: 'REFUND%' } },
            })
        );
    });

    it('stores the payment mode response when one is passed', async () => {
        await updateWalletTransaction({ corporateTxnId: 'TXN1', status: 'SUCCESS', paymentModeResponse: '{"pgAmount":900}' });

        expect(order.update).toHaveBeenCalledWith(
            expect.objectContaining({ paymentModeResponse: '{"pgAmount":900}' }),
            expect.anything()
        );
    });
});

describe('refundWalletTransaction', () => {
    it('credits the debit back once and marks the order', async () => {
        walletTransaction.findOne
            .mockResolvedValueOnce(paymentRow())
            .mockResolvedValueOnce({ remarks: 'Payment Successful' });

        const result = await refundWalletTransaction({ corporateTxnId: 'TXN1', status: 'FAILED', message: 'Booking failed' });

        expect(result).toEqual({ corporateBalance: 6020 });
        expect(wallet.update).toHaveBeenCalledTimes(1);
        expect(wallet.update).toHaveBeenCalledWith({ balance: 6020 }, expect.objectContaining({ transaction: t }));
        expect(walletTransaction.create).toHaveBeenCalledWith(
            expect.objectContaining({ remarks: 'REFUND', debitAmount: -1020 }),
            { transaction: t }
        );
        expect(order.update).toHaveBeenCalledWith({ status: 'FAILED', message: 'Booking failed' }, expect.anything());
        expect(t.commit).toHaveBeenCalled();
    });

    it('credits only the partial wallet refund for a card-paid order, never the card amount again', async () => {
        walletTransaction.findOne
            .mockResolvedValueOnce(paymentRow({ debitAmount: 0 }))
            .mockResolvedValueOnce({ remarks: 'Payment Successful' });
        order.findOne.mockResolvedValue({ paymentModeResponse: JSON.stringify({ pgAmount: 1020 }) });

        const result = await refundWalletTransaction({
            corporateTxnId: 'TXN1',
            registeredById: 1,
            status: 'CANCELLED',
            partialRefund: { status: true, walletRefund: 700 },
        });

        expect(result).toEqual({ corporateBalance: 5700 });
        expect(wallet.update).toHaveBeenCalledTimes(1);
        expect(walletTransaction.create).toHaveBeenCalledTimes(1);
    });

    it('skips a refund that another request completed while this one waited for the wallet lock', async () => {
        walletTransaction.findOne
            .mockResolvedValueOnce(paymentRow())
            .mockResolvedValueOnce({ remarks: 'REFUNDED' });

        const result = await refundWalletTransaction({ corporateTxnId: 'TXN1' });

        expect(result).toBe('ALREADY REFUNDED');
        expect(walletTransaction.findOne).toHaveBeenLastCalledWith(
            expect.objectContaining({ where: { id: 11 }, lock: 'UPDATE', transaction: t })
        );
        expect(wallet.update).not.toHaveBeenCalled();
        expect(t.rollback).toHaveBeenCalled();
    });

    it('skips an order that is already refunded', async () => {
        walletTransaction.findOne.mockResolvedValueOnce(paymentRow({ remarks: 'REFUNDED' }));

        const result = await refundWalletTransaction({ corporateTxnId: 'TXN1' });

        expect(result).toBe('ALREADY REFUNDED');
        expect(wallet.findOne).not.toHaveBeenCalled();
    });

    it('treats a payment row without remarks as refundable', async () => {
        walletTransaction.findOne
            .mockResolvedValueOnce(paymentRow({ remarks: null }))
            .mockResolvedValueOnce({ remarks: null });

        const result = await refundWalletTransaction({ corporateTxnId: 'TXN1' });

        expect(result).toEqual({ corporateBalance: 6020 });
    });

    it('releases the coupon and stores the order response when given', async () => {
        walletTransaction.findOne
            .mockResolvedValueOnce(paymentRow())
            .mockResolvedValueOnce({ remarks: 'PENDING' });

        await refundWalletTransaction({ corporateTxnId: 'TXN1', couponId: 4, orderResponse: '{"error":"x"}' });

        expect(UserCoupons.update).toHaveBeenCalledWith(
            { status: 'UNCLAIMED', claimedAt: null, usedCouponData: null },
            { where: { id: 4 }, transaction: t }
        );
        expect(order.update).toHaveBeenCalledWith(
            expect.objectContaining({ orderResponse: '{"error":"x"}' }),
            expect.anything()
        );
    });

    it('returns NO TRANSACTIONS FOUND for an unknown transaction', async () => {
        walletTransaction.findOne.mockResolvedValueOnce(null);

        await expect(refundWalletTransaction({ corporateTxnId: 'NOPE' })).resolves.toBe('NO TRANSACTIONS FOUND');
    });
});

describe('getPartialRefundDetails', () => {
    it('splits a refund between wallet and card in proportion to how the order was paid', async () => {
        findOneTransaction.mockResolvedValue({ debitAmount: '400', order: { amountInINR: '1000' } });

        const result = await getPartialRefundDetails({ corporateTxnId: 'TXN1', refundAmount: 500 });

        expect(result).toEqual(expect.objectContaining({ walletRefund: 200, bankCardRefund: 300, refundPercentage: 50 }));
    });

    it('does not divide by a zero order amount', async () => {
        findOneTransaction.mockResolvedValue({ debitAmount: '0', order: { amountInINR: '0' } });

        const result = await getPartialRefundDetails({ corporateTxnId: 'TXN1', refundAmount: 500 });

        expect(Number.isNaN(result.walletRefund)).toBe(false);
        expect(Number.isNaN(result.refundPercentage)).toBe(false);
    });
});
