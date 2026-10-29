'use strict';
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }));
jest.mock('../../../models/use-cases/setting', () => ({
    getPGMethods: jest.fn(),
    createPGMethod: jest.fn(),
    updatePGMethod: jest.fn(),
}));
jest.mock('../../../models/use-cases/paymentMethods', () => ({ findAllPaymentMethodForCorporate: jest.fn() }));
jest.mock('../../../models/use-cases/order', () => ({ getUserPaymentUsage: jest.fn() }));
jest.mock('../../corporate/commonBillHandler', () => ({ getABiller: jest.fn() }));

const { getPGMethods } = require('../../../models/use-cases/setting');
const { findAllPaymentMethodForCorporate } = require('../../../models/use-cases/paymentMethods');
const { getUserPaymentUsage } = require('../../../models/use-cases/order');
const { fetchAllAvailablePgMethodsCorporate } = require('../paymentMethods');

const noLimits = { limitPerTransaction: 0, limitPerDay: 0, limitPerMonth: 0 };
const gatewayRow = (pgProvider) => ({ paymentMethod: 'PAYMENT_GATEWAY', pgProvider, limits: noLimits });
const walletRow = () => ({ paymentMethod: 'WALLET', pgProvider: null, limits: noLimits });

const gatewayFor = async (rows) => {
    findAllPaymentMethodForCorporate.mockResolvedValue(rows);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await fetchAllAvailablePgMethodsCorporate(
        { user: { id: 7, registeredBy: 1854 }, query: { accessKey: 'hotels_api' } },
        res,
        jest.fn()
    );
    return res.json.mock.calls[0][0].data.gateway;
};

beforeEach(() => {
    jest.clearAllMocks();
    getPGMethods.mockResolvedValue({
        details: { isGatewayPaymentAvailable: true, isWalletPaymentAvailable: true, isCouponApplicable: true },
    });
    getUserPaymentUsage.mockResolvedValue({ wallet: { today: 0, month: 0 }, gateway: { today: 0, month: 0 } });
});

describe('fetchAllAvailablePgMethodsCorporate gateway providers', () => {
    it("lists the gateways enabled for the partner's service", async () => {
        const gateway = await gatewayFor([gatewayRow('ccavenue_pg'), walletRow(), gatewayRow('cashfree_pg')]);

        expect(findAllPaymentMethodForCorporate).toHaveBeenCalledWith({ partnerId: 1854, accessKey: 'hotels_api' });
        expect(gateway.providers).toEqual([
            { pgProvider: 'cashfree_pg', name: 'Cashfree' },
            { pgProvider: 'ccavenue_pg', name: 'CC Avenue' },
        ]);
    });

    it('lists each gateway once when several of its service rows match', async () => {
        const gateway = await gatewayFor([gatewayRow('cashfree_pg'), gatewayRow('cashfree_pg')]);

        expect(gateway.providers).toEqual([{ pgProvider: 'cashfree_pg', name: 'Cashfree' }]);
    });

    it('lists no gateway for a payment gateway row without one', async () => {
        const gateway = await gatewayFor([gatewayRow(null)]);

        expect(gateway).toMatchObject({ available: true, providers: [] });
    });

    it('lists no gateway when payment gateway is switched off', async () => {
        getPGMethods.mockResolvedValue({
            details: { isGatewayPaymentAvailable: false, isWalletPaymentAvailable: true, isCouponApplicable: true },
        });

        const gateway = await gatewayFor([gatewayRow('cashfree_pg')]);

        expect(gateway).toMatchObject({ available: false, providers: [] });
    });
});
