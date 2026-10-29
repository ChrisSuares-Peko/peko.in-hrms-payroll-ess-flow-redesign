const { deleteCashback } = require('../../../use-cases/cashback');
const cashback = require('../../../entities/cashback');

jest.mock('../../../entities/cashback', () => ({
    destroy: jest.fn(),
}));

describe('deleteCashback', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a cashback entry successfully', async () => {
        const mockParams = { id: 1 };
        const mockResult = 1; // Sequelize `destroy` returns the number of rows deleted

        // Mock the `cashback.destroy` method to resolve with `mockResult`
        cashback.destroy.mockResolvedValue(mockResult);

        // Call the `deleteCashback` function
        const result = await deleteCashback(mockParams);

        // Verify `cashback.destroy` was called with the correct arguments
        expect(cashback.destroy).toHaveBeenCalledTimes(1);
        expect(cashback.destroy).toHaveBeenCalledWith({
            where: {
                id: mockParams.id,
            },
        });

        // Verify the result matches the mocked result
        expect(result).toEqual(mockResult);
    });

    it('should throw an error if deletion fails', async () => {
        const mockParams = { id: 1 };
        const mockError = new Error('Database error');

        // Mock the `cashback.destroy` method to reject with an error
        cashback.destroy.mockRejectedValue(mockError);

        // Call the `deleteCashback` function and expect it to throw an error
        await expect(deleteCashback(mockParams)).rejects.toThrow('Database error');

        // Verify `cashback.destroy` was called with the correct arguments
        expect(cashback.destroy).toHaveBeenCalledTimes(1);
        expect(cashback.destroy).toHaveBeenCalledWith({
            where: {
                id: mockParams.id,
            },
        });
    });
});
