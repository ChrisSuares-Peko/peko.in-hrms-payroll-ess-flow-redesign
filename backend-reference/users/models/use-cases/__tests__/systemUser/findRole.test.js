const { findRole } = require('../../../use-cases/systemUser'); // Adjust path as needed
const systemUser = require('../../../entities/systemUser'); // Adjust path as needed
const roleAndPermissions = require('../../../entities/roleAndPermissions'); 

jest.mock('../../../entities/systemUser', () => ({
    findOne: jest.fn(),
}));

describe('findRole', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the user\'s role when found', async () => {
        const mockCredentialId = 123;
        const mockUserWithRole = {
            credentialId: mockCredentialId,
            roleAndPermissions: {  // Nested object for the included model
                roleName: 'admin',
            },
        };

        systemUser.findOne.mockResolvedValue(mockUserWithRole);

        const result = await findRole(mockCredentialId);

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockCredentialId },
            include: [{
                model: roleAndPermissions,
                attributes: ['roleName']
            }]
        });
        expect(result).toEqual(mockUserWithRole);
    });

    it('should return null when no user is found', async () => {
        const mockCredentialId = 123;
        systemUser.findOne.mockResolvedValue(null);

        const result = await findRole(mockCredentialId);

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockCredentialId },
            include: [{
                model: roleAndPermissions,
                attributes: ['roleName']
            }]
        });
        expect(result).toBeNull();
    });

    it('should handle errors during database query', async () => {
        const mockCredentialId = 123;
        const mockError = new Error('Database error');

        systemUser.findOne.mockRejectedValue(mockError);

        await expect(findRole(mockCredentialId)).rejects.toThrow(mockError); // Or handle it differently

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockCredentialId },
            include: [{
                model: roleAndPermissions,
                attributes: ['roleName']
            }]
        });
    });

    it('should handle cases where roleAndPermissions is null', async () => {
        const mockCredentialId = 123;
        const mockUserWithoutRole = {
            credentialId: mockCredentialId,
            roleAndPermissions: null, // No role associated
        };

        systemUser.findOne.mockResolvedValue(mockUserWithoutRole);

        const result = await findRole(mockCredentialId);

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockCredentialId },
            include: [{
                model: roleAndPermissions,
                attributes: ['roleName']
            }]
        });
        expect(result).toEqual(mockUserWithoutRole); // Or perhaps modify the function to return a more specific value in this case.
    });
});