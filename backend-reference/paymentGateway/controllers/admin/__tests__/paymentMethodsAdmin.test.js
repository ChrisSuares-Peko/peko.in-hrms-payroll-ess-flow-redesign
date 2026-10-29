'use strict';
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }));
jest.mock('../../../models/use-cases/setting', () => ({
    getPGMethods: jest.fn(),
    createPGMethod: jest.fn(),
    updatePGMethod: jest.fn(),
}));
jest.mock('../../../models/use-cases/paymentMethods', () => ({
    updatePaymentMethodStatus: jest.fn(),
}));
jest.mock('../../../models/use-cases/order', () => ({ getUserPaymentUsage: jest.fn() }));
jest.mock('../../corporate/commonBillHandler', () => ({ getABiller: jest.fn() }));

const { getPGMethods, updatePGMethod } = require('../../../models/use-cases/setting');
const paymentMethodUseCase = require('../../../models/use-cases/paymentMethods');
const { updatePgMethodsAdmin, updatePaymentMethodStatus } = require('../paymentMethods');

const settings = { isGatewayPaymentAvailable: true, isWalletPaymentAvailable: false, isCouponApplicable: true };

const call = async (handler, req) => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await handler({ user: { id: 5, role: 'SYSTEM_USER' }, params: {}, ...req }, res, next);
    return { res, next };
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('updatePgMethodsAdmin', () => {
    it('saves the global settings', async () => {
        getPGMethods.mockResolvedValue({ details: {} });
        updatePGMethod.mockResolvedValue(settings);

        const { res } = await call(updatePgMethodsAdmin, { body: settings });

        expect(updatePGMethod).toHaveBeenCalledWith(settings);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('reports a failure instead of success when the settings row is missing', async () => {
        getPGMethods.mockResolvedValue(null);

        const { res, next } = await call(updatePgMethodsAdmin, { body: settings });

        expect(updatePGMethod).not.toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Payment settings are not available right now. Please refresh the page and try again.',
                status_code: 400,
            })
        );
    });
});

describe('updatePaymentMethodStatus', () => {
    it('returns the saved status', async () => {
        paymentMethodUseCase.updatePaymentMethodStatus.mockResolvedValue({
            status: true,
            message: 'Payment method disabled successfully.',
            data: { id: 31, isActive: false },
        });

        const { res } = await call(updatePaymentMethodStatus, {
            params: { paymentMethodId: 31 },
            body: { isActive: false },
        });

        expect(paymentMethodUseCase.updatePaymentMethodStatus).toHaveBeenCalledWith(31, false);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: true,
            message: 'Payment method disabled successfully.',
            responseCode: '000',
            data: { id: 31, isActive: false },
        });
    });

    it('rejects a payment method that cannot be updated', async () => {
        paymentMethodUseCase.updatePaymentMethodStatus.mockResolvedValue({
            status: false,
            message: 'Payment method not found.',
        });

        const { res } = await call(updatePaymentMethodStatus, {
            params: { paymentMethodId: 99 },
            body: { isActive: true },
        });

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ status: false, message: 'Payment method not found.', responseCode: '001' })
        );
    });
});
