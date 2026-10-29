const { findOne } = require('../../../use-cases/corporateUser');
const corporateUser = require('../../../entities/corporateUser');
const packAge = require('../../../entities/package');

jest.mock('../../../entities/corporateUser', () => ({
    findOne: jest.fn(),
}));

describe('findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a corporate user with associated package', async () => {
        const mockParams = { id: 1 };
        const mockAttributes = ['id', 'name'];
        const mockCorporateUser = {
            id: 1,
            name: 'Test User',
            package: { id: 101, name: 'Premium Package' }
        };

        corporateUser.findOne.mockResolvedValue(mockCorporateUser);

        const result = await findOne(mockParams, mockAttributes);

        expect(corporateUser.findOne).toHaveBeenCalledWith({
            include: [{ model: packAge }],
            where: { credentialId: mockParams.id },
            attributes: mockAttributes,
            nest: true,
            raw: true,
        });
        expect(result).toEqual(mockCorporateUser);
    });

    it('should return null if no corporate user is found', async () => {
        const mockParams = { id: 999 };
        corporateUser.findOne.mockResolvedValue(null);

        const result = await findOne(mockParams);

        expect(result).toBeNull();
    });

    it('should handle errors if database query fails', async () => {
        const mockParams = { id: 1 };
        const mockError = new Error('Database error');

        corporateUser.findOne.mockRejectedValue(mockError);

        await expect(findOne(mockParams)).rejects.toThrow('Database error');
    });
});
