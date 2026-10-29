const { Delete } = require('../../beneficiary');
const beneficiary = require('../../../entities/beneficiary');

// Mock the beneficiary model
jest.mock('../../../entities/beneficiary', () => ({
    destroy: jest.fn(),
}));

describe('Delete', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Clear mock data after each test
    });

    it('should delete the beneficiary with the given id', async () => {
        const mockParams = { id: 1 };

        // Mock destroy to return the number of affected rows
        beneficiary.destroy.mockResolvedValue(1);

        const result = await Delete(mockParams);

        expect(result).toBe(1);
        expect(beneficiary.destroy).toHaveBeenCalledWith({
            where: {
                id: mockParams.id,
            },
        });
    });

    it('should return 0 if no beneficiary is found with the given id', async () => {
        const mockParams = { id: 999 }; // Assuming this ID doesn't exist

        // Mock destroy to return 0 (no rows affected)
        beneficiary.destroy.mockResolvedValue(0);

        const result = await Delete(mockParams);

        expect(result).toBe(0);
        expect(beneficiary.destroy).toHaveBeenCalledWith({
            where: {
                id: mockParams.id,
            },
        });
    });

    it('should throw an error if an exception occurs', async () => {
        const mockParams = { id: 1 };

        const mockError = new Error('Database error');

        // Mock destroy to throw an error
        beneficiary.destroy.mockRejectedValue(mockError);

        await expect(Delete(mockParams)).rejects.toThrow('Database error');
    });
});
