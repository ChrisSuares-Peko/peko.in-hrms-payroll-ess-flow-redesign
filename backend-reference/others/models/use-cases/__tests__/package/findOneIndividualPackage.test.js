const { findOneIndividualPackage } = require('../../package');
const pkgModel = require('../../../entities/package');

describe('findOneIndividualPackage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return package data for a valid accessCode and partnerId', async () => {
        const params = { accessCode: 'validAccessCode', partnerId: 'validPartnerId' };
        const mockResult = {
            id: 1,
            accessCode: 'validAccessCode',
            partnerId: 'validPartnerId',
            packageName: 'Test Package',
            packagePrice: '100',
        };

        pkgModel.findOne.mockResolvedValue(mockResult);

        const result = await findOneIndividualPackage(params);

        expect(pkgModel.findOne).toHaveBeenCalledWith({
            where: { accessCode: 'validAccessCode', partnerId: 'validPartnerId' },
            raw: true,
        });
        expect(result).toEqual(mockResult);
    });

    it('should return false if no package is found for the given accessCode and partnerId', async () => {
        const params = { accessCode: 'nonExistentAccessCode', partnerId: 'nonExistentPartnerId' };
        const mockResult = null;

        pkgModel.findOne.mockResolvedValue(mockResult);

        const result = await findOneIndividualPackage(params);

        expect(pkgModel.findOne).toHaveBeenCalledWith({
            where: { accessCode: 'nonExistentAccessCode', partnerId: 'nonExistentPartnerId' },
            raw: true,
        });
        expect(result).toBe(null);
    });

    it('should handle cases where accessCode or partnerId is missing', async () => {
        const params = { accessCode: undefined, partnerId: 'validPartnerId' };
        const mockResult = null;

        pkgModel.findOne.mockResolvedValue(mockResult);

        const result = await findOneIndividualPackage(params);

        expect(pkgModel.findOne).toHaveBeenCalledWith({
            where: { accessCode: undefined, partnerId: 'validPartnerId' },
            raw: true,
        });
        expect(result).toBe(null);
    });

    it('should log and return false if there is an error while querying the database', async () => {
        const params = { accessCode: 'validAccessCode', partnerId: 'validPartnerId' };
        const mockError = new Error('Database error');
        
        // Mock the console.log to check if it logs the error
        console.log = jest.fn();
        pkgModel.findOne.mockRejectedValue(mockError);

        const result = await findOneIndividualPackage(params);

        expect(pkgModel.findOne).toHaveBeenCalledWith({
            where: { accessCode: 'validAccessCode', partnerId: 'validPartnerId' },
            raw: true,
        });
        expect(result).toBe(false);
        expect(console.log).toHaveBeenCalledWith(mockError);
    });
});
