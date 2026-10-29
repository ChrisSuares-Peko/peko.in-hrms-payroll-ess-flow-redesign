const { createSalaryPayoutTransaction } = require('../../../use-cases/processSalary');
const SalaryPayoutTransaction = require('../../../entities/salaryPayoutTransaction');

jest.mock('../../../entities/salaryPayoutTransaction');

describe('createSalaryPayoutTransaction', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should create and return a new payout transaction', async () => {
        const data = { corporateUser: 'corp1', salary: 'sal1', batchReferenceId: 'BATCH_001', amount: 50000 };
        const created = { _id: 'txn1', ...data };
        SalaryPayoutTransaction.create.mockResolvedValue(created);

        const result = await createSalaryPayoutTransaction(data);

        expect(SalaryPayoutTransaction.create).toHaveBeenCalledWith(data);
        expect(result).toEqual(created);
    });

    it('should pass all fields correctly to create', async () => {
        const data = { corporateUser: 'corp2', salary: 'sal2', status: 'PENDING', referenceId: 'REF_001' };
        SalaryPayoutTransaction.create.mockResolvedValue({ _id: 'txn2', ...data });

        await createSalaryPayoutTransaction(data);

        expect(SalaryPayoutTransaction.create).toHaveBeenCalledWith(data);
    });

    it('should throw if create rejects', async () => {
        SalaryPayoutTransaction.create.mockRejectedValue(new Error('DB error'));

        await expect(createSalaryPayoutTransaction({})).rejects.toThrow('DB error');
    });
});
