'use strict';
const { updatePaymentMethodStatus, findAllPaymentMethodForCorporate } = require('../../paymentMethods');
const PaymentMethods = require('../../../entities/paymentMethods');

jest.mock('../../../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

jest.mock('../../../entities/paymentMethods', () => ({
    findByPk: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
}));

jest.mock('../../../entities/paymentMethodServices', () => ({}));
jest.mock('../../../entities/serviceOperator', () => ({}));

describe('updatePaymentMethodStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('reports a payment method that does not exist', async () => {
        PaymentMethods.findByPk.mockResolvedValue(null);

        const result = await updatePaymentMethodStatus(9, false);

        expect(result).toEqual({ status: false, message: 'Payment method not found.' });
        expect(PaymentMethods.update).not.toHaveBeenCalled();
    });

    it.each([
        [false, 'Payment method disabled successfully.'],
        [true, 'Payment method enabled successfully.'],
    ])('stores isActive %s on the payment method', async (isActive, message) => {
        PaymentMethods.findByPk.mockResolvedValue({ id: 9 });

        const result = await updatePaymentMethodStatus(9, isActive);

        expect(PaymentMethods.update).toHaveBeenCalledWith({ isActive }, { where: { id: 9 } });
        expect(result).toEqual({ status: true, message, data: { id: 9, isActive } });
    });

    it('reports a failed update without throwing', async () => {
        PaymentMethods.findByPk.mockResolvedValue({ id: 9 });
        PaymentMethods.update.mockRejectedValue(new Error('db down'));

        const result = await updatePaymentMethodStatus(9, false);

        expect(result).toEqual({
            status: false,
            message: 'Something went wrong while updating the payment method status.',
        });
    });
});

describe('findAllPaymentMethodForCorporate', () => {
    it("offers only the partner's active payment methods at checkout", async () => {
        PaymentMethods.findAll.mockResolvedValue([]);

        await findAllPaymentMethodForCorporate({ partnerId: 1854, accessKey: 'hotels_api' });

        expect(PaymentMethods.findAll.mock.calls[0][0].where).toEqual({
            partnerId: 1854,
            isActive: true,
            '$serviceList.serviceOperator.accessKey$': 'hotels_api',
        });
    });
});
