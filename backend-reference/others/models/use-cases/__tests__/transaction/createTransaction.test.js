const { createTransaction } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');

describe('createTransaction', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should create a transaction successfully', async () => {
        const mockParams = { amount: 100, credentialId: 1 };
        const mockResult = { id: 1, ...mockParams };
        transaction.create.mockResolvedValue(mockResult);

        const result = await createTransaction(mockParams);
        expect(transaction.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockResult);
    });

    it('should return undefined on error', async () => {
        transaction.create.mockRejectedValue(new Error('DB error'));
        const result = await createTransaction({});
        expect(result).toBeUndefined();
    });
});
