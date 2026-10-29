const { findOneSubCorporate } = require('../../subCorporateUser');
const SubCorporateUsers = require('../../../entities/subCorporateUsers');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/subCorporateUsers', () => ({
    findOne: jest.fn()
}));

jest.mock('../../../entities/corporateUser', () => ({
    hasMany: jest.fn(),
  }));

describe('findOneSubCorporate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find a sub-corporate user by ID with default attributes', async () => {
        const mockUser = {
            id: 1,
            name: 'Test User',
            'credential.role': 'CORPORATE',
            'credential.username': 'testuser'
        };

        SubCorporateUsers.findOne.mockResolvedValue(mockUser);

        const params = { id: 1 };
        const result = await findOneSubCorporate(params);

        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({
            include: [{
                model: credential,
                attributes: ['role', 'username']
            }],
            where: { id: params.id },
            attributes: undefined,
            nest: true,
            raw: true
        });
        expect(result).toEqual(mockUser);
    });

    it('should find a sub-corporate user by ID with specified attributes', async () => {
        const mockUser = {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            'credential.role': 'CORPORATE',
            'credential.username': 'testuser'
        };

        SubCorporateUsers.findOne.mockResolvedValue(mockUser);

        const params = { id: 1 };
        const attributes = ['id', 'name', 'email'];
        const result = await findOneSubCorporate(params, attributes);

        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({
            include: [{
                model: credential,
                attributes: ['role', 'username']
            }],
            where: { id: params.id },
            attributes,
            nest: true,
            raw: true
        });
        expect(result).toEqual(mockUser);
    });

    it('should return null if no sub-corporate user is found', async () => {
        SubCorporateUsers.findOne.mockResolvedValue(null);

        const params = { id: 999 };
        const result = await findOneSubCorporate(params);

        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({
            include: [{
                model: credential,
                attributes: ['role', 'username']
            }],
            where: { id: params.id },
            attributes: undefined,
            nest: true,
            raw: true
        });
        expect(result).toBeNull();
    });

    it('should throw an error if there is a database error', async () => {
        SubCorporateUsers.findOne.mockRejectedValue(new Error('Database error'));

        const params = { id: 1 };
        await expect(findOneSubCorporate(params)).rejects.toThrow('Database error');
    });

    it('should handle invalid parameters gracefully', async () => {
        SubCorporateUsers.findOne.mockResolvedValue(null);

        const params = { id: 'invalid_id' }; // Invalid ID
        await expect(findOneSubCorporate(params)).resolves.toBeNull();
    });
});
