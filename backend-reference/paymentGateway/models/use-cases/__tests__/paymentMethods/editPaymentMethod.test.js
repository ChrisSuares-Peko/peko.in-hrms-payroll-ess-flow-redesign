'use strict';
const { editPaymentMethod } = require('../../paymentMethods');
const PaymentMethods = require('../../../entities/paymentMethods');
const PaymentMethodServices = require('../../../entities/paymentMethodServices');

jest.mock('../../../entities/paymentMethods', () => ({
    findByPk: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
}));

jest.mock('../../../entities/paymentMethodServices', () => ({
    findAll: jest.fn(),
    update: jest.fn(),
    bulkCreate: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => ({
    findOne: jest.fn(),
}));

describe('editPaymentMethod', () => {
    let mockTransaction;

    beforeEach(() => {
        jest.clearAllMocks();
        mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
        const sequelize = require('../../../../configs/database/index');
        sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
    });

    it('should return error if payment method not found', async () => {
        PaymentMethods.findByPk.mockResolvedValue(null);

        const result = await editPaymentMethod(1, { services: [], partnerId: 'P1', paymentMethod: 'UPI', limits: {} });

        expect(result).toEqual({ status: false, message: 'Payment method not found.' });
    });

    it('should return error if duplicate method exists for partner', async () => {
        PaymentMethods.findByPk.mockResolvedValue({ id: 1 });
        PaymentMethods.findOne.mockResolvedValue({ id: 2, partnerId: 'P1', paymentMethod: 'UPI' });

        const result = await editPaymentMethod(1, { services: [], partnerId: 'P1', paymentMethod: 'UPI', limits: {} });

        expect(result).toEqual({ status: false, message: 'This payment method is already added for the partner.' });
    });

    it('should update method and sync services successfully', async () => {
        PaymentMethods.findByPk.mockResolvedValue({ id: 1 });
        PaymentMethods.findOne.mockResolvedValue(null);
        PaymentMethods.update.mockResolvedValue([1]);
        PaymentMethodServices.findAll.mockResolvedValue([{ serviceOperatorId: 10 }, { serviceOperatorId: 20 }]);
        PaymentMethodServices.update.mockResolvedValue([1]);
        PaymentMethodServices.bulkCreate.mockResolvedValue([]);

        const result = await editPaymentMethod(1, { services: [10, 30], partnerId: 'P1', paymentMethod: 'UPI', limits: {} });

        expect(mockTransaction.commit).toHaveBeenCalled();
        expect(result).toEqual({ status: true, message: 'Payment method updated successfully.' });
    });

    it('should rollback and return error on exception', async () => {
        PaymentMethods.findByPk.mockResolvedValue({ id: 1 });
        PaymentMethods.findOne.mockResolvedValue(null);
        PaymentMethods.update.mockRejectedValue(new Error('DB Error'));

        const result = await editPaymentMethod(1, { services: [], partnerId: 'P1', paymentMethod: 'UPI', limits: {} });

        expect(mockTransaction.rollback).toHaveBeenCalled();
        expect(result).toEqual({ status: false, message: 'Something went wrong while updating the payment method.' });
    });

    describe('payment gateway selection', () => {
        beforeEach(() => {
            PaymentMethods.findByPk.mockResolvedValue({ id: 1 });
            PaymentMethods.findOne.mockResolvedValue(null);
            PaymentMethods.update.mockResolvedValue([1]);
            PaymentMethodServices.findAll.mockResolvedValue([]);
            PaymentMethodServices.update.mockResolvedValue([1]);
        });

        const edit = (changes) =>
            editPaymentMethod(1, { services: [], partnerId: 'P1', paymentMethod: 'PAYMENT_GATEWAY', limits: {}, ...changes });

        it('switches the row to the selected gateway', async () => {
            await edit({ pgProvider: 'ccavenue_pg' });

            expect(PaymentMethods.update).toHaveBeenCalledWith(
                expect.objectContaining({ pgProvider: 'ccavenue_pg' }),
                expect.objectContaining({ where: { id: 1 } })
            );
        });

        it('blocks switching to a gateway another row of the partner already uses', async () => {
            PaymentMethods.findOne.mockResolvedValue({ id: 2 });

            const result = await edit({ pgProvider: 'cashfree_pg' });

            expect(PaymentMethods.findOne).toHaveBeenCalledWith({
                where: { partnerId: 'P1', paymentMethod: 'PAYMENT_GATEWAY', pgProvider: 'cashfree_pg' },
            });
            expect(result).toEqual({ status: false, message: 'This payment method is already added for the partner.' });
            expect(PaymentMethods.update).not.toHaveBeenCalled();
        });

        it('clears the gateway when the row becomes a wallet row', async () => {
            await edit({ paymentMethod: 'WALLET', pgProvider: 'cashfree_pg' });

            expect(PaymentMethods.update).toHaveBeenCalledWith(
                expect.objectContaining({ paymentMethod: 'WALLET', pgProvider: null }),
                expect.anything()
            );
        });

        it('rejects a payment gateway row without a gateway', async () => {
            const result = await edit({});

            expect(result).toEqual({ status: false, message: 'Please select a valid payment gateway.' });
            expect(PaymentMethods.update).not.toHaveBeenCalled();
        });

        it('rejects an unsupported gateway before writing anything', async () => {
            const result = await edit({ pgProvider: 'unknown_pg' });

            expect(result).toEqual({ status: false, message: 'Please select a valid payment gateway.' });
            expect(PaymentMethods.update).not.toHaveBeenCalled();
        });
    });
});
