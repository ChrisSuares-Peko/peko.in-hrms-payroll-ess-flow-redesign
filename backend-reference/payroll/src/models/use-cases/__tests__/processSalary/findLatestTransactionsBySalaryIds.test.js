const { findLatestTransactionsBySalaryIds } = require('../../../use-cases/processSalary');
const SalaryPayoutTransaction = require('../../../entities/salaryPayoutTransaction');

jest.mock('../../../entities/salaryPayoutTransaction');

describe('findLatestTransactionsBySalaryIds', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should return a map of salaryId to latest transaction', async () => {
        const salaryIds = ['sal1', 'sal2'];
        const aggResult = [
            { _id: 'sal1', transaction: { _id: 'txn1', status: 'SUCCESS' } },
            { _id: 'sal2', transaction: { _id: 'txn2', status: 'FAILED' } },
        ];
        SalaryPayoutTransaction.aggregate.mockResolvedValue(aggResult);

        const result = await findLatestTransactionsBySalaryIds({ corporateUser: 'corp1', salaryIds });

        expect(result).toEqual({
            sal1: { _id: 'txn1', status: 'SUCCESS' },
            sal2: { _id: 'txn2', status: 'FAILED' },
        });
    });

    it('should return empty object when salaryIds is empty', async () => {
        const result = await findLatestTransactionsBySalaryIds({ corporateUser: 'corp1', salaryIds: [] });

        expect(SalaryPayoutTransaction.aggregate).not.toHaveBeenCalled();
        expect(result).toEqual({});
    });

    it('should return empty object when salaryIds is not an array', async () => {
        const result = await findLatestTransactionsBySalaryIds({ corporateUser: 'corp1', salaryIds: null });

        expect(SalaryPayoutTransaction.aggregate).not.toHaveBeenCalled();
        expect(result).toEqual({});
    });
});
