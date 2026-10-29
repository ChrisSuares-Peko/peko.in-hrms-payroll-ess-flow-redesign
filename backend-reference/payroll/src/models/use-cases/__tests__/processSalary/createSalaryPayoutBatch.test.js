const { createSalaryPayoutBatch } = require('../../../use-cases/processSalary');
const SalaryPayoutBatch = require('../../../entities/salaryPayoutBatch');

jest.mock('../../../entities/salaryPayoutBatch');

describe('createSalaryPayoutBatch', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should create and return a new payout batch', async () => {
        const data = { corporateUser: 'corp1', batchReferenceId: 'BATCH_001', month: 5, year: 2026 };
        const created = { _id: 'batch123', ...data };
        SalaryPayoutBatch.create.mockResolvedValue(created);

        const result = await createSalaryPayoutBatch(data);

        expect(SalaryPayoutBatch.create).toHaveBeenCalledWith(data);
        expect(result).toEqual(created);
    });

    it('should pass all fields in data to create', async () => {
        const data = { corporateUser: 'corp2', batchReferenceId: 'BATCH_002', status: 'PENDING', totalRequestedAmount: 50000 };
        SalaryPayoutBatch.create.mockResolvedValue({ _id: 'batch456', ...data });

        await createSalaryPayoutBatch(data);

        expect(SalaryPayoutBatch.create).toHaveBeenCalledWith(data);
    });

    it('should throw if create rejects', async () => {
        SalaryPayoutBatch.create.mockRejectedValue(new Error('DB error'));

        await expect(createSalaryPayoutBatch({})).rejects.toThrow('DB error');
    });
});
