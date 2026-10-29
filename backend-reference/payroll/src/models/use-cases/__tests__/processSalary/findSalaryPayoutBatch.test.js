const { findSalaryPayoutBatch } = require('../../../use-cases/processSalary');
const SalaryPayoutBatch = require('../../../entities/salaryPayoutBatch');

jest.mock('../../../entities/salaryPayoutBatch');

describe('findSalaryPayoutBatch', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should return the matching batch', async () => {
        const batch = { _id: 'b1', corporateUser: 'corp1', batchReferenceId: 'BATCH_001' };
        SalaryPayoutBatch.findOne.mockResolvedValue(batch);

        const result = await findSalaryPayoutBatch({ corporateUser: 'corp1', batchReferenceId: 'BATCH_001' });

        expect(SalaryPayoutBatch.findOne).toHaveBeenCalledWith({ corporateUser: 'corp1', batchReferenceId: 'BATCH_001' });
        expect(result).toEqual(batch);
    });

    it('should return null when no batch matches', async () => {
        SalaryPayoutBatch.findOne.mockResolvedValue(null);

        const result = await findSalaryPayoutBatch({ corporateUser: 'corp1', batchReferenceId: 'NONEXISTENT' });

        expect(result).toBeNull();
    });

    it('should throw if findOne rejects', async () => {
        SalaryPayoutBatch.findOne.mockRejectedValue(new Error('DB error'));

        await expect(findSalaryPayoutBatch({ corporateUser: 'corp1', batchReferenceId: 'BATCH_001' })).rejects.toThrow('DB error');
    });
});
