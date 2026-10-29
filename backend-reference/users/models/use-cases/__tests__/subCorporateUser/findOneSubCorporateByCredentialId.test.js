const { findOneSubCorporateByCredentialId } = require('../../subCorporateUser');
const SubCorporateUsers = require('../../../entities/subCorporateUsers');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/subCorporateUsers', () => ({
    findOne: jest.fn()
}));

jest.mock('../../../entities/corporateUser', () => ({
    hasMany: jest.fn(),
  }));

describe('findOneSubCorporateByCredentialId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find a sub-corporate user by credential ID with default attributes', async () => {
        const mockUser = {
            id: 1,
            name: 'Test User',
            credentialId: 123,
            'credential.role': 'CORPORATE'
        };
        
        SubCorporateUsers.findOne.mockResolvedValue(mockUser);

        const params = { id: 123 };
        const result = await findOneSubCorporateByCredentialId(params);

        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({
            include: [{
                model: credential,
                attributes: ['role']
            }],
            where: { credentialId: params.id },
            attributes: undefined,
            nest: true,
            raw: true
        });
        expect(result).toEqual(mockUser);
    });

    it('should find a sub-corporate user by credential ID with specified attributes', async () => {
        const mockUser = {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            'credential.role': 'CORPORATE'
        };

        SubCorporateUsers.findOne.mockResolvedValue(mockUser);

        const params = { id: 123 };
        const attributes = ['id', 'name', 'email'];
        const result = await findOneSubCorporateByCredentialId(params, attributes);

        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({
            include: [{
                model: credential,
                attributes: ['role']
            }],
            where: { credentialId: 123 },
            attributes,
            nest: true,
            raw: true
        });
        expect(result).toEqual(mockUser);
    });

    it('should return null if no sub-corporate user is found', async () => {
        SubCorporateUsers.findOne.mockResolvedValue(null);

        const params = { id: 999 };
        const result = await findOneSubCorporateByCredentialId(params);

        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({
            include: [{
                model: credential,
                attributes: ['role']
            }],
            where: { credentialId: params.id },
            attributes: undefined,
            nest: true,
            raw: true
        });
        expect(result).toBeNull();
    });

    it('should throw an error if there is a database error', async () => {
        SubCorporateUsers.findOne.mockRejectedValue(new Error('Database error'));

        const params = { id: 123 };
        await expect(findOneSubCorporateByCredentialId(params)).rejects.toThrow('Database error');
    });

    it('should handle invalid credential ID gracefully', async () => {
        SubCorporateUsers.findOne.mockResolvedValue(null);

        const params = { id: 'invalid_id' }; // Invalid ID
        const result = await findOneSubCorporateByCredentialId(params);
        expect(result).toBeNull();
    });

    it('should handle unexpected result format', async () => {
        const mockUser = { unexpected: 'data' }; // Unexpected format
        SubCorporateUsers.findOne.mockResolvedValue(mockUser);

        const params = { id: 123 };
        await expect(findOneSubCorporateByCredentialId(params)).resolves.toEqual(mockUser);
    });
});
