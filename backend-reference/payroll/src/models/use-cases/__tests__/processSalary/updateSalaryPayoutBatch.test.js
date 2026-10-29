const { updateSalaryPayoutBatch } = require('../../../use-cases/processSalary');
const SalaryPayoutBatch = require('../../../entities/salaryPayoutBatch');

jest.mock('../../../entities/salaryPayoutBatch');

describe('updateSalaryPayoutBatch', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should update and return the updated batch', async () => {
        const updated = { _id: 'b1', batchReferenceId: 'BATCH_001', status: 'COMPLETED' };
        SalaryPayoutBatch.findOneAndUpdate.mockResolvedValue(updated);

        const result = await updateSalaryPayoutBatch({
            batchReferenceId: 'BATCH_001',
            corporateUser: 'corp1',
            data: { status: 'COMPLETED' },
        });

        expect(SalaryPayoutBatch.findOneAndUpdate).toHaveBeenCalledWith(
            { batchReferenceId: 'BATCH_001', corporateUser: 'corp1' },
            { $set: { status: 'COMPLETED' } },
            { new: true }
        );
        expect(result).toEqual(updated);
    });

    it('should return null when no matching batch is found', async () => {
        SalaryPayoutBatch.findOneAndUpdate.mockResolvedValue(null);

        const result = await updateSalaryPayoutBatch({
            batchReferenceId: 'NONEXISTENT',
            corporateUser: 'corp1',
            data: { status: 'FAILED' },
        });

        expect(result).toBeNull();
    });

    it('should throw if findOneAndUpdate rejects', async () => {
        SalaryPayoutBatch.findOneAndUpdate.mockRejectedValue(new Error('DB error'));

        await expect(updateSalaryPayoutBatch({ batchReferenceId: 'B1', corporateUser: 'c1', data: {} })).rejects.toThrow('DB error');
    });
});
