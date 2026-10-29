const { findRefreshableSalaryPayoutTransactions } = require('../../../use-cases/processSalary');
const SalaryPayoutTransaction = require('../../../entities/salaryPayoutTransaction');

jest.mock('../../../entities/salaryPayoutTransaction');

describe('findRefreshableSalaryPayoutTransactions', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should return transactions that are PENDING or INITIATED', async () => {
        const transactions = [{ _id: 'txn1', status: 'PENDING' }, { _id: 'txn2', status: 'INITIATED' }];
        const sortMock = jest.fn().mockResolvedValue(transactions);
        SalaryPayoutTransaction.find.mockReturnValue({ sort: sortMock });

        const result = await findRefreshableSalaryPayoutTransactions({ corporateUser: 'corp1', batchReferenceId: 'BATCH_001' });

        expect(SalaryPayoutTransaction.find).toHaveBeenCalledWith(
            expect.objectContaining({
                corporateUser: 'corp1',
                batchReferenceId: 'BATCH_001',
                $or: expect.any(Array),
            })
        );
        expect(sortMock).toHaveBeenCalledWith({ createdAt: 1 });
        expect(result).toEqual(transactions);
    });

    it('should return SUCCESS transactions where vaDebitStatus is not SUCCESS', async () => {
        const transactions = [{ _id: 'txn3', status: 'SUCCESS', vaDebitStatus: 'PENDING' }];
        const sortMock = jest.fn().mockResolvedValue(transactions);
        SalaryPayoutTransaction.find.mockReturnValue({ sort: sortMock });

        const result = await findRefreshableSalaryPayoutTransactions({ corporateUser: 'corp1', batchReferenceId: 'BATCH_001' });

        expect(result).toEqual(transactions);
    });

    it('should return empty array when no refreshable transactions exist', async () => {
        const sortMock = jest.fn().mockResolvedValue([]);
        SalaryPayoutTransaction.find.mockReturnValue({ sort: sortMock });

        const result = await findRefreshableSalaryPayoutTransactions({ corporateUser: 'corp1', batchReferenceId: 'BATCH_DONE' });

        expect(result).toEqual([]);
    });
});
