const { findMonthlyCashback } = require('../../dashboard');
const transactions = require('../../../entities/transaction'); // Import the actual model

jest.mock('../../../entities/transaction', () => ({
    sum: jest.fn(),
}));
jest.mock('../../../entities/corporateUser',()=>({
    hasMany:jest.fn()
}))

describe('findMonthlyCashback', () => {
    it('should return the total cashback for the last month', async () => {
        // Mocking the `sum` method to return a specific value
        transactions.sum.mockResolvedValueOnce(500);

        const credentialId = 'some-credential-id';
        const result = await findMonthlyCashback(credentialId);

        expect(result).toBe(500);
    });

    it('should handle cases where there is no cashback for the last month', async () => {
        // Mocking the `sum` method to return 0
        transactions.sum.mockResolvedValueOnce(0);

        const credentialId = 'some-credential-id';
        const result = await findMonthlyCashback(credentialId);

        expect(result).toBe(0);
    });

    it('should handle cases where the sum method throws an error', async () => {
        // Mocking the `sum` method to throw an error
        transactions.sum.mockRejectedValueOnce(new Error('Database error'));

        const credentialId = 'some-credential-id';
        
        await expect(findMonthlyCashback(credentialId)).rejects.toThrow('Database error');
    });
});
