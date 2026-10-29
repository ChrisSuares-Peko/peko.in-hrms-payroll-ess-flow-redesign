const { Op } = require('sequelize');
const { findActiveApplicationByCorporate } = require('../../companyIncorporation');
const companyIncorporation = require('../../../entities/companyIncorporation');

jest.mock('../../../entities/companyIncorporation', () => ({
    findOne: jest.fn(),
}));

describe('findActiveApplicationByCorporate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should query for an active application by corporateId with the active status set', async () => {
        const mockApp = { id: 1, corporateId: 22, status: 'PENDING' };
        companyIncorporation.findOne.mockResolvedValue(mockApp);

        const result = await findActiveApplicationByCorporate(22);

        expect(companyIncorporation.findOne).toHaveBeenCalledWith({
            where: {
                corporateId: 22,
                status: { [Op.in]: ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] },
            },
        });
        expect(result).toEqual(mockApp);
    });

    it('should return null when no active application exists', async () => {
        companyIncorporation.findOne.mockResolvedValue(null);

        const result = await findActiveApplicationByCorporate(99);

        expect(result).toBeNull();
    });
});
