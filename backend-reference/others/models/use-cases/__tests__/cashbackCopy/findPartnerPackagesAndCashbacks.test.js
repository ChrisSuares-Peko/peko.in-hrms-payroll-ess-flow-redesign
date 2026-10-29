const { Op } = require('sequelize');
const cashback = require('../../../entities/cashback');
const pkgModel = require('../../../entities/package');
const { findPartnerPackagesAndCashbacks } = require('../../cashbackCopy');

jest.mock('../../../../configs/database/index', () => ({
    transaction: jest.fn(),
}));
jest.mock('../../../entities/cashback', () => ({
    findAll: jest.fn(),
}));
jest.mock('../../../entities/package', () => ({
    findAll: jest.fn(),
}));
jest.mock('../../../entities/serviceOperator', () => ({}));

describe('findPartnerPackagesAndCashbacks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('queries Peko packages with a null partnerId when partnerId is "default"', async () => {
        pkgModel.findAll.mockResolvedValue([]);

        await findPartnerPackagesAndCashbacks('default');

        expect(pkgModel.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ where: { partnerId: null } })
        );
    });

    it('queries Peko packages with a null partnerId when partnerId is missing', async () => {
        pkgModel.findAll.mockResolvedValue([]);

        await findPartnerPackagesAndCashbacks(undefined);

        expect(pkgModel.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ where: { partnerId: null } })
        );
    });

    it('queries packages scoped to the given partner', async () => {
        pkgModel.findAll.mockResolvedValue([]);

        await findPartnerPackagesAndCashbacks('42');

        expect(pkgModel.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ where: { partnerId: '42' } })
        );
    });

    it('skips the cashback query and returns an empty list when the partner has no packages', async () => {
        pkgModel.findAll.mockResolvedValue([]);

        const result = await findPartnerPackagesAndCashbacks('42');

        expect(cashback.findAll).not.toHaveBeenCalled();
        expect(result).toEqual({ packages: [], cashbacks: [] });
    });

    it('fetches cashbacks for every package the partner owns', async () => {
        const packages = [{ id: 1 }, { id: 2 }];
        const cashbacks = [{ id: 10, packageId: 1 }];
        pkgModel.findAll.mockResolvedValue(packages);
        cashback.findAll.mockResolvedValue(cashbacks);

        const result = await findPartnerPackagesAndCashbacks('42');

        expect(cashback.findAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { packageId: { [Op.in]: [1, 2] } },
                raw: true,
                nest: true,
            })
        );
        expect(result).toEqual({ packages, cashbacks });
    });
});
