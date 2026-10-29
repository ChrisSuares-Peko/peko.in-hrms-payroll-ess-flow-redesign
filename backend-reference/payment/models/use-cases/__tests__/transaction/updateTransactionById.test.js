const { updateTransactionById } = require('../../transaction'); // Adjust path as needed
const transaction = require('../../../entities/transaction'); // Adjust path as needed

jest.mock('../../../entities/transaction', () => ({
    update: jest.fn(),
}));

describe('updateTransactionById', () => {
    const mockTransactionId = 1;
    const mockData = { status: 'CONFIRMED' };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the transaction successfully and return the result', async () => {
        const mockUpdateResult = [1]; // Sequelize `update` returns an array [affectedRows]
        transaction.update.mockResolvedValue(mockUpdateResult);

        const result = await updateTransactionById(mockTransactionId, mockData);

        expect(transaction.update).toHaveBeenCalledWith(mockData, {
            where: {
                id: mockTransactionId
            }
        });
        expect(result).toEqual(mockUpdateResult);
    });

    it('should log an error if update fails', async () => {
        const mockError = new Error('Update failed');
        transaction.update.mockRejectedValue(mockError);
        console.log = jest.fn(); // Mock console.log to test the error logging

        await updateTransactionById(mockTransactionId, mockData);

        expect(console.log).toHaveBeenCalledWith(mockError.message);
    });

    it('should always log "TRANSACTION CREATE ROUTE CALLED" regardless of success or failure', async () => {
        console.log = jest.fn(); // Mock console.log

        // Test with successful update
        transaction.update.mockResolvedValue([1]);
        await updateTransactionById(mockTransactionId, mockData);
        expect(console.log).toHaveBeenCalledWith("TRANSACTION CREATE ROUTE CALLED");

        // Test with failed update
        transaction.update.mockRejectedValue(new Error('Update failed'));
        await updateTransactionById(mockTransactionId, mockData);
        expect(console.log).toHaveBeenCalledWith("TRANSACTION CREATE ROUTE CALLED");
    });
});
