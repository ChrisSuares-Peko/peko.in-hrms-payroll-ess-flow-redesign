const { recalculateSalaryPayoutBatch } = require('../../../use-cases/processSalary');
const SalaryPayoutTransaction = require('../../../entities/salaryPayoutTransaction');
const SalaryPayoutBatch = require('../../../entities/salaryPayoutBatch');

jest.mock('../../../entities/salaryPayoutTransaction');
jest.mock('../../../entities/salaryPayoutBatch');

describe('recalculateSalaryPayoutBatch', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should set status COMPLETED when all transactions are SUCCESS', async () => {
        const transactions = [
            { status: 'SUCCESS', amount: 50000 },
            { status: 'SUCCESS', amount: 30000 },
        ];
        SalaryPayoutTransaction.find.mockResolvedValue(transactions);
        SalaryPayoutBatch.findOneAndUpdate.mockResolvedValue({ status: 'COMPLETED' });

        const result = await recalculateSalaryPayoutBatch({ corporateUser: 'corp1', batchReferenceId: 'BATCH_001' });

        expect(SalaryPayoutBatch.findOneAndUpdate).toHaveBeenCalledWith(
            { batchReferenceId: 'BATCH_001', corporateUser: 'corp1' },
            expect.objectContaining({ $set: expect.objectContaining({ status: 'COMPLETED' }) }),
            { new: true }
        );
        expect(result).toEqual({ status: 'COMPLETED' });
    });

    it('should set status FAILED when all transactions are FAILED or SKIPPED', async () => {
        const transactions = [
            { status: 'FAILED', amount: 50000 },
            { status: 'SKIPPED', amount: 30000 },
        ];
        SalaryPayoutTransaction.find.mockResolvedValue(transactions);
        SalaryPayoutBatch.findOneAndUpdate.mockResolvedValue({ status: 'FAILED' });

        await recalculateSalaryPayoutBatch({ corporateUser: 'corp1', batchReferenceId: 'BATCH_002' });

        expect(SalaryPayoutBatch.findOneAndUpdate).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({ $set: expect.objectContaining({ status: 'FAILED' }) }),
            { new: true }
        );
    });

    it('should set status PARTIALLY_COMPLETED when some succeed and some fail', async () => {
        const transactions = [
            { status: 'SUCCESS', amount: 50000 },
            { status: 'FAILED', amount: 30000 },
        ];
        SalaryPayoutTransaction.find.mockResolvedValue(transactions);
        SalaryPayoutBatch.findOneAndUpdate.mockResolvedValue({ status: 'PARTIALLY_COMPLETED' });

        await recalculateSalaryPayoutBatch({ corporateUser: 'corp1', batchReferenceId: 'BATCH_003' });

        expect(SalaryPayoutBatch.findOneAndUpdate).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({ $set: expect.objectContaining({ status: 'PARTIALLY_COMPLETED' }) }),
            { new: true }
        );
    });
});
