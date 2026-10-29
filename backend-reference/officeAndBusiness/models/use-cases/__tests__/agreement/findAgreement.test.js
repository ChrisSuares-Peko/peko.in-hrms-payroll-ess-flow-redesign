const { findAgreement } = require('../../agreement');
const agreement = require('../../../entities/agreement');
const corporateUser = require('../../../entities/corporateUser');

jest.mock('../../../entities/agreement', () => ({
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
}));
jest.mock('../../../entities/corporateUser');

describe('findAgreement', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the agreement with corporateUser association', async () => {
        const mockDoc = { id: 1, status: 'DRAFT', corporateUser: { name: 'Test Corp', email: 'corp@test.com' } };
        agreement.findOne.mockResolvedValue(mockDoc);

        const result = await findAgreement({ id: 1 });

        expect(agreement.findOne).toHaveBeenCalledWith({
            where: { id: 1 },
            include: [
                {
                    model: corporateUser,
                    attributes: ['name', 'email', 'mobileNo', 'gstNumber', 'logo'],
                },
            ],
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockDoc);
    });

    it('should return null when agreement is not found', async () => {
        agreement.findOne.mockResolvedValue(null);

        const result = await findAgreement({ id: 999 });

        expect(result).toBeNull();
    });

    it('should throw an error if database call fails', async () => {
        agreement.findOne.mockRejectedValue(new Error('Database error'));

        await expect(findAgreement({ id: 1 })).rejects.toThrow('Database error');
    });
});
