const { Delete } = require('../../../use-cases/disableService');
const disableService = require('../../../entities/disabledService');

jest.mock('../../../entities/disabledService', () => ({
    destroy: jest.fn(),
}));

describe('Delete', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a record with the provided id', async () => {
        const mockParams = { id: 1 };
        const mockResult = 1; // Sequelize's destroy method returns the number of rows deleted

        disableService.destroy.mockResolvedValue(mockResult);

        const result = await Delete(mockParams);

        expect(disableService.destroy).toHaveBeenCalledWith({
            where: { id: mockParams.id },
        });
        expect(result).toEqual(mockResult);
    });

    it('should return 0 if no record is found to delete', async () => {
        const mockParams = { id: 999 };
        const mockResult = 0;

        disableService.destroy.mockResolvedValue(mockResult);

        const result = await Delete(mockParams);

        expect(disableService.destroy).toHaveBeenCalledWith({
            where: { id: mockParams.id },
        });
        expect(result).toEqual(mockResult);
    });

    it('should throw an error if delete operation fails', async () => {
        const mockParams = { id: 1 };
        const mockError = new Error('Database error');

        disableService.destroy.mockRejectedValue(mockError);

        await expect(Delete(mockParams)).rejects.toThrow('Database error');
        expect(disableService.destroy).toHaveBeenCalledWith({
            where: { id: mockParams.id },
        });
    });
});
