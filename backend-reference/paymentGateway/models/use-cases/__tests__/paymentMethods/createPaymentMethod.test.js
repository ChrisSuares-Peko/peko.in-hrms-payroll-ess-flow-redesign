'use strict';
const { createPaymentMethod } = require('../../paymentMethods');
const PaymentMethods = require('../../../entities/paymentMethods');
const PaymentMethodServices = require('../../../entities/paymentMethodServices');

jest.mock('../../../entities/paymentMethods', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
}));

jest.mock('../../../entities/paymentMethodServices', () => ({
    bulkCreate: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => ({
    findOne: jest.fn(),
}));

describe('createPaymentMethod', () => {
    let mockTransaction;

    beforeEach(() => {
        jest.clearAllMocks();
        mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
        const sequelize = require('../../../../configs/database/index');
        sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
    });

    it('should return error if payment method already exists for partner', async () => {
        PaymentMethods.findOne.mockResolvedValue({ id: 1, partnerId: 'P1', paymentMethod: 'UPI' });

        const result = await createPaymentMethod({ partnerId: 'P1', paymentMethod: 'UPI', services: [] });

        expect(result).toEqual({ status: false, message: 'This payment method is already added for the partner.' });
        expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });

    it('should create payment method without services', async () => {
        PaymentMethods.findOne.mockResolvedValue(null);
        const mockCreated = { id: 1, partnerId: 'P1', paymentMethod: 'UPI', get: jest.fn().mockReturnValue({ id: 1 }) };
        PaymentMethods.create.mockResolvedValue(mockCreated);

        const result = await createPaymentMethod({ partnerId: 'P1', paymentMethod: 'UPI', services: [] });

        expect(PaymentMethods.create).toHaveBeenCalled();
        expect(PaymentMethodServices.bulkCreate).not.toHaveBeenCalled();
        expect(mockTransaction.commit).toHaveBeenCalled();
        expect(result.status).toBe(true);
    });

    it('should create payment method and bulk create services when services provided', async () => {
        PaymentMethods.findOne.mockResolvedValue(null);
        const mockCreated = { id: 1, get: jest.fn().mockReturnValue({ id: 1 }) };
        PaymentMethods.create.mockResolvedValue(mockCreated);
        PaymentMethodServices.bulkCreate.mockResolvedValue([]);

        const result = await createPaymentMethod({ partnerId: 'P1', paymentMethod: 'UPI', services: [10, 20] });

        expect(PaymentMethodServices.bulkCreate).toHaveBeenCalledWith(
            [
                { paymentMethodId: 1, serviceOperatorId: 10, isAvailable: true },
                { paymentMethodId: 1, serviceOperatorId: 20, isAvailable: true },
            ],
            { transaction: mockTransaction }
        );
        expect(mockTransaction.commit).toHaveBeenCalled();
        expect(result.status).toBe(true);
    });

    it('should rollback and return error on exception', async () => {
        PaymentMethods.findOne.mockResolvedValue(null);
        PaymentMethods.create.mockRejectedValue(new Error('DB Error'));

        const result = await createPaymentMethod({ partnerId: 'P1', paymentMethod: 'UPI', services: [] });

        expect(mockTransaction.rollback).toHaveBeenCalled();
        expect(result).toEqual({ status: false, message: 'Something went wrong while creating the payment method.' });
    });

    describe('payment gateway selection', () => {
        const createdRow = { get: jest.fn().mockReturnValue({ id: 1 }) };

        beforeEach(() => {
            PaymentMethods.findOne.mockResolvedValue(null);
            PaymentMethods.create.mockResolvedValue(createdRow);
        });

        it('stores the selected gateway on a payment gateway row', async () => {
            await createPaymentMethod({ partnerId: 'P1', paymentMethod: 'PAYMENT_GATEWAY', pgProvider: 'ccavenue_pg', services: [] });

            expect(PaymentMethods.create).toHaveBeenCalledWith(
                expect.objectContaining({ paymentMethod: 'PAYMENT_GATEWAY', pgProvider: 'ccavenue_pg' }),
                { transaction: mockTransaction }
            );
        });

        it('checks for an existing row of the same gateway only', async () => {
            await createPaymentMethod({ partnerId: 'P1', paymentMethod: 'PAYMENT_GATEWAY', pgProvider: 'cashfree_pg', services: [] });

            expect(PaymentMethods.findOne).toHaveBeenCalledWith({
                where: { partnerId: 'P1', paymentMethod: 'PAYMENT_GATEWAY', pgProvider: 'cashfree_pg' },
            });
            expect(PaymentMethods.create).toHaveBeenCalled();
        });

        it('blocks adding the same gateway twice for a partner', async () => {
            PaymentMethods.findOne.mockResolvedValue({ id: 2 });

            const result = await createPaymentMethod({
                partnerId: 'P1',
                paymentMethod: 'PAYMENT_GATEWAY',
                pgProvider: 'cashfree_pg',
                services: [],
            });

            expect(result).toEqual({ status: false, message: 'This payment method is already added for the partner.' });
            expect(PaymentMethods.create).not.toHaveBeenCalled();
        });

        it('rejects a payment gateway row without a gateway', async () => {
            const sequelize = require('../../../../configs/database/index');

            const result = await createPaymentMethod({ partnerId: 'P1', paymentMethod: 'PAYMENT_GATEWAY', services: [] });

            expect(result).toEqual({ status: false, message: 'Please select a valid payment gateway.' });
            expect(sequelize.transaction).not.toHaveBeenCalled();
        });

        it('never stores a gateway on a wallet row', async () => {
            await createPaymentMethod({ partnerId: 'P1', paymentMethod: 'WALLET', pgProvider: 'cashfree_pg', services: [] });

            expect(PaymentMethods.create).toHaveBeenCalledWith(
                expect.objectContaining({ paymentMethod: 'WALLET', pgProvider: null }),
                { transaction: mockTransaction }
            );
        });

        it('rejects an unsupported gateway before writing anything', async () => {
            const result = await createPaymentMethod({
                partnerId: 'P1',
                paymentMethod: 'PAYMENT_GATEWAY',
                pgProvider: 'unknown_pg',
                services: [],
            });

            expect(result).toEqual({ status: false, message: 'Please select a valid payment gateway.' });
            expect(PaymentMethods.create).not.toHaveBeenCalled();
        });
    });
});
