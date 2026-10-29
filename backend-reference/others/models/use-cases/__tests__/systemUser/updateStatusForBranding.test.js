const { updateStatusForBranding } = require('../../systemUser'); // Adjust the path as needed
const systemUser = require('../../../entities/systemUser');

jest.mock('../../../entities/systemUser', () => ({
    update: jest.fn(),
}));

describe('updateStatusForBranding', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update branding status for a user successfully', async () => {
        const mockParams = { id: 1, status: true };
        const mockResult = [1]; // Sequelize `update` returns an array with number of affected rows

        systemUser.update.mockResolvedValue(mockResult);

        const result = await updateStatusForBranding(mockParams);

        expect(systemUser.update).toHaveBeenCalledWith(
            { brandingStatus: mockParams.status },
            {
                where: {
                    id: mockParams.id,
                },
            }
        );
        expect(result).toEqual(mockResult);
    });

    it('should handle cases where no rows are updated', async () => {
        const mockParams = { id: 2, status: false };
        const mockResult = [0]; // No rows affected

        systemUser.update.mockResolvedValue(mockResult);

        const result = await updateStatusForBranding(mockParams);

        expect(systemUser.update).toHaveBeenCalledWith(
            { brandingStatus: mockParams.status },
            {
                where: {
                    id: mockParams.id,
                },
            }
        );
        expect(result).toEqual(mockResult);
    });

    it('should handle errors gracefully', async () => {
        const mockParams = { id: 3, status: true };
        const mockError = new Error('Database error');

        systemUser.update.mockRejectedValue(mockError);

        await expect(updateStatusForBranding(mockParams)).rejects.toEqual({
            message: 'Something went wrong',
        });

        expect(systemUser.update).toHaveBeenCalledWith(
            { brandingStatus: mockParams.status },
            {
                where: {
                    id: mockParams.id,
                },
            }
        );
    });
});
