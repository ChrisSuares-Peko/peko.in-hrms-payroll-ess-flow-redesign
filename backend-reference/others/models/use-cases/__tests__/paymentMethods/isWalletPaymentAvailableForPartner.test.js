jest.mock('../../setting', () => ({ getPGMethods: jest.fn() }));

const sequelizeConfig = require('../../../../configs/database/index');
const { getPGMethods } = require('../../setting');
const { isWalletPaymentAvailableForPartner } = require('../../paymentMethods');

const pgMethods = (isWalletPaymentAvailable) => ({ details: { isWalletPaymentAvailable } });

describe('isWalletPaymentAvailableForPartner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('is true when wallet is switched on globally and the partner has a wallet-enabled service', async () => {
        getPGMethods.mockResolvedValue(pgMethods(true));
        sequelizeConfig.query.mockResolvedValue([{ 1: 1 }]);

        await expect(isWalletPaymentAvailableForPartner(638)).resolves.toBe(true);
        expect(sequelizeConfig.query).toHaveBeenCalledWith(
            expect.stringContaining("pm.paymentMethod = 'WALLET'"),
            expect.objectContaining({ replacements: { partnerId: 638 } })
        );
    });

    it('is false when the partner has no wallet-enabled service', async () => {
        getPGMethods.mockResolvedValue(pgMethods(true));
        sequelizeConfig.query.mockResolvedValue([]);

        await expect(isWalletPaymentAvailableForPartner(638)).resolves.toBe(false);
    });

    it('is false when wallet payments are switched off globally', async () => {
        getPGMethods.mockResolvedValue(pgMethods(false));
        sequelizeConfig.query.mockResolvedValue([{ 1: 1 }]);

        await expect(isWalletPaymentAvailableForPartner(638)).resolves.toBe(false);
    });

    it('is false when the global payment-method setting is missing', async () => {
        getPGMethods.mockResolvedValue(null);
        sequelizeConfig.query.mockResolvedValue([{ 1: 1 }]);

        await expect(isWalletPaymentAvailableForPartner(638)).resolves.toBe(false);
    });

    it('matches the default partner rows for a user without a partner', async () => {
        getPGMethods.mockResolvedValue(pgMethods(true));
        sequelizeConfig.query.mockResolvedValue([{ 1: 1 }]);

        await isWalletPaymentAvailableForPartner(undefined);

        expect(sequelizeConfig.query).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ replacements: { partnerId: null } })
        );
    });
});
