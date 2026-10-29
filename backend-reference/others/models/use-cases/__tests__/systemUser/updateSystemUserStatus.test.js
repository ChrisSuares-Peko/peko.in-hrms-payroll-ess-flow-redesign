const { updateSystemUserStatus } = require('../../systemUser'); // Update the path as needed
const systemUser = require('../../../entities/systemUser');

jest.mock('../../../entities/systemUser');

describe('updateSystemUserStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the system user status successfully and return the number of affected rows', async () => {
        const mockParams = { id: 1 };
        const mockData = { status: 'ACTIVE' };
        const mockResult = [1]; // Sequelize's update method returns an array with the number of affected rows

        systemUser.update.mockResolvedValue(mockResult);

        const result = await updateSystemUserStatus(mockParams, mockData);

        expect(systemUser.update).toHaveBeenCalledWith(mockData, {
            where: {
                credentialId: mockParams.id,
            },
        });
        expect(result).toEqual(mockResult);
    });

    it('should return [0] if no user is found to update', async () => {
        const mockParams = { id: 999 };
        const mockData = { status: 'INACTIVE' };
        const mockResult = [0]; // No rows affected

        systemUser.update.mockResolvedValue(mockResult);

        const result = await updateSystemUserStatus(mockParams, mockData);

        expect(systemUser.update).toHaveBeenCalledWith(mockData, {
            where: {
                credentialId: mockParams.id,
            },
        });
        expect(result).toEqual(mockResult);
    });

    it('should throw an error if the database query fails', async () => {
        const mockParams = { id: 1 };
        const mockData = { status: 'ACTIVE' };
        const mockError = new Error('Database error');

        systemUser.update.mockRejectedValue(mockError);

        await expect(updateSystemUserStatus(mockParams, mockData)).rejects.toThrow('Database error');
        expect(systemUser.update).toHaveBeenCalledWith(mockData, {
            where: {
                credentialId: mockParams.id,
            },
        });
    });
});
