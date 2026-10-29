const { findSalaryPayoutTransactions } = require('../../../use-cases/processSalary');
const SalaryPayoutTransaction = require('../../../entities/salaryPayoutTransaction');

jest.mock('../../../entities/salaryPayoutTransaction');

describe('findSalaryPayoutTransactions', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should return transactions sorted by createdAt ascending', async () => {
        const transactions = [
            { _id: 'txn1', status: 'SUCCESS' },
            { _id: 'txn2', status: 'PENDING' },
        ];
        const sortMock = jest.fn().mockResolvedValue(transactions);
        SalaryPayoutTransaction.find.mockReturnValue({ sort: sortMock });

        const result = await findSalaryPayoutTransactions({ corporateUser: 'corp1', batchReferenceId: 'BATCH_001' });

        expect(SalaryPayoutTransaction.find).toHaveBeenCalledWith({ corporateUser: 'corp1', batchReferenceId: 'BATCH_001' });
        expect(sortMock).toHaveBeenCalledWith({ createdAt: 1 });
        expect(result).toEqual(transactions);
    });

    it('should return an empty array when no transactions exist for the batch', async () => {
        const sortMock = jest.fn().mockResolvedValue([]);
        SalaryPayoutTransaction.find.mockReturnValue({ sort: sortMock });

        const result = await findSalaryPayoutTransactions({ corporateUser: 'corp1', batchReferenceId: 'BATCH_EMPTY' });

        expect(result).toEqual([]);
    });

    it('should throw if the query rejects', async () => {
        const sortMock = jest.fn().mockRejectedValue(new Error('DB error'));
        SalaryPayoutTransaction.find.mockReturnValue({ sort: sortMock });

        await expect(findSalaryPayoutTransactions({ corporateUser: 'corp1', batchReferenceId: 'BATCH_001' })).rejects.toThrow('DB error');
    });
});
