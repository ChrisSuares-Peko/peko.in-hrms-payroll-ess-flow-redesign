const { findOneCorporateTaxRegistration } = require('../../corporateTaxRegistration');
const corporateTaxRegistration = require('../../../entities/corporateTaxRegistration');

jest.mock('../../../entities/corporateTaxRegistration');

describe('findOneCorporateTaxRegistration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return data when found', async () => {
        const mockData = { id: 1, credentialId: 123 };
        corporateTaxRegistration.findOne.mockResolvedValue(mockData);

        const result = await findOneCorporateTaxRegistration(123);

        expect(corporateTaxRegistration.findOne).toHaveBeenCalledWith({
            where: { credentialId: 123 },
        });
        expect(result).toEqual(mockData);
    });

    it('should return false when not found', async () => {
        corporateTaxRegistration.findOne.mockResolvedValue(null);

        const result = await findOneCorporateTaxRegistration(999);
        expect(result).toBe(false);
    });

    it('should return false on error', async () => {
        corporateTaxRegistration.findOne.mockRejectedValue(new Error('DB error'));

        const result = await findOneCorporateTaxRegistration(123);
        expect(result).toBe(false);
    });
});
