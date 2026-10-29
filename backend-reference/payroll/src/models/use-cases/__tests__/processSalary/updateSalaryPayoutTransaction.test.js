const { updateSalaryPayoutTransaction } = require('../../../use-cases/processSalary');
const SalaryPayoutTransaction = require('../../../entities/salaryPayoutTransaction');

jest.mock('../../../entities/salaryPayoutTransaction');

describe('updateSalaryPayoutTransaction', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should update and return the updated transaction', async () => {
        const updated = { _id: 'txn1', status: 'SUCCESS' };
        SalaryPayoutTransaction.findByIdAndUpdate.mockResolvedValue(updated);

        const result = await updateSalaryPayoutTransaction({ id: 'txn1', data: { status: 'SUCCESS' } });

        expect(SalaryPayoutTransaction.findByIdAndUpdate).toHaveBeenCalledWith(
            'txn1',
            { $set: { status: 'SUCCESS' } },
            { new: true }
        );
        expect(result).toEqual(updated);
    });

    it('should return null when no transaction is found for the id', async () => {
        SalaryPayoutTransaction.findByIdAndUpdate.mockResolvedValue(null);

        const result = await updateSalaryPayoutTransaction({ id: 'nonexistent', data: { status: 'FAILED' } });

        expect(result).toBeNull();
    });

    it('should throw if findByIdAndUpdate rejects', async () => {
        SalaryPayoutTransaction.findByIdAndUpdate.mockRejectedValue(new Error('DB error'));

        await expect(updateSalaryPayoutTransaction({ id: 'txn1', data: {} })).rejects.toThrow('DB error');
    });
});
