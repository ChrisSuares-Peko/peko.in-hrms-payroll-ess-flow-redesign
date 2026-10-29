const { findByRole } = require('../../systemUser'); // Update the path as needed
const systemUser = require('../../../entities/systemUser');

jest.mock('../../../entities/systemUser');

describe('findByRole', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all users with the given roleAndPermissionId', async () => {
        const mockRoleId = 1;
        const mockUsers = [
            { id: 1, name: 'User 1', roleAndPermissionId: mockRoleId },
            { id: 2, name: 'User 2', roleAndPermissionId: mockRoleId },
        ];

        systemUser.findAll.mockResolvedValue(mockUsers);

        const result = await findByRole(mockRoleId);

        expect(systemUser.findAll).toHaveBeenCalledWith({
            where: {
                roleAndPermissionId: mockRoleId,
            },
        });
        expect(result).toEqual(mockUsers);
    });

    it('should return an empty array if no users match the given roleAndPermissionId', async () => {
        const mockRoleId = 2;

        systemUser.findAll.mockResolvedValue([]);

        const result = await findByRole(mockRoleId);

        expect(systemUser.findAll).toHaveBeenCalledWith({
            where: {
                roleAndPermissionId: mockRoleId,
            },
        });
        expect(result).toEqual([]);
    });

    it('should throw an error if the database query fails', async () => {
        const mockRoleId = 1;
        const mockError = new Error('Database error');

        systemUser.findAll.mockRejectedValue(mockError);

        await expect(findByRole(mockRoleId)).rejects.toThrow('Database error');
        expect(systemUser.findAll).toHaveBeenCalledWith({
            where: {
                roleAndPermissionId: mockRoleId,
            },
        });
    });
});
