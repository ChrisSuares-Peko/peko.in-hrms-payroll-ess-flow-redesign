const pkgModel = require('../../../entities/package');
const { getPackageIdsForCashBack } = require('../../serviceOperator');

jest.mock('../../../entities/package', () => ({
    findAll: jest.fn(),
}));

describe('getPackageIdsForCashBack', () => {

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should return package IDs when valid partnerId and packageId are provided', async () => {
        const partnerId = 10;
        const packageId = 99;

        const mockData = [{ id: 99 }, { id: 100 }];
        pkgModel.findAll.mockResolvedValue(mockData);

        const result = await getPackageIdsForCashBack(partnerId, packageId);

        expect(pkgModel.findAll).toHaveBeenCalledWith({
            where: {
                partnerId,
                status: true,
                id: packageId,
            },
            attributes: ['id'],
            raw: true,
            nest: true,
        });

        expect(result).toEqual(mockData);
    });

    it('should return an empty array when no matching packages are found', async () => {
        pkgModel.findAll.mockResolvedValue([]);

        const result = await getPackageIdsForCashBack(1, 200);

        expect(result).toEqual([]);
    });

    it('should still query and return results even if partnerId is null', async () => {
        pkgModel.findAll.mockResolvedValue([{ id: 5 }]);

        const result = await getPackageIdsForCashBack(null, 5);

        expect(pkgModel.findAll).toHaveBeenCalledWith({
            where: {
                partnerId: null,
                status: true,
                id: 5,
            },
            attributes: ['id'],
            raw: true,
            nest: true,
        });

        expect(result).toEqual([{ id: 5 }]);
    });

    it('should allow packageId to be undefined (Sequelize will search for id = undefined)', async () => {
        pkgModel.findAll.mockResolvedValue([]);

        const result = await getPackageIdsForCashBack(20, undefined);

        expect(pkgModel.findAll).toHaveBeenCalledWith({
            where: {
                partnerId: 20,
                status: true,
                id: undefined,
            },
            attributes: ['id'],
            raw: true,
            nest: true,
        });

        expect(result).toEqual([]);
    });

    it('should throw an error if database operation fails', async () => {
        const error = new Error("DB failure");
        pkgModel.findAll.mockRejectedValue(error);

        await expect(getPackageIdsForCashBack(10, 5)).rejects.toThrow("DB failure");
    });
});
