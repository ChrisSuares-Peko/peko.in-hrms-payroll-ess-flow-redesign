const { findApplicationById } = require('../../companyIncorporation');
const companyIncorporation = require('../../../entities/companyIncorporation');

jest.mock('../../../entities/companyIncorporation', () => ({
    findOne: jest.fn(),
}));

describe('findApplicationById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should query with the full applicationId/credentialId/corporateId scope', async () => {
        const mockApp = { id: 1, applicationId: 'INC/2026/00001' };
        companyIncorporation.findOne.mockResolvedValue(mockApp);

        const result = await findApplicationById('INC/2026/00001', 11, 22);

        expect(companyIncorporation.findOne).toHaveBeenCalledWith({
            where: { applicationId: 'INC/2026/00001', credentialId: 11, corporateId: 22 },
        });
        expect(result).toEqual(mockApp);
    });

    it('should return null when the application is not found within scope', async () => {
        companyIncorporation.findOne.mockResolvedValue(null);

        const result = await findApplicationById('INC/2026/99999', 11, 22);

        expect(result).toBeNull();
    });
});
