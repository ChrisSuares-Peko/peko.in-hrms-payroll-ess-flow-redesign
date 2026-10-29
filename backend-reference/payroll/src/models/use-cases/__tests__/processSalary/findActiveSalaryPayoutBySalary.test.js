const { findActiveSalaryPayoutBySalary } = require('../../../use-cases/processSalary');
const SalaryPayoutTransaction = require('../../../entities/salaryPayoutTransaction');

jest.mock('../../../entities/salaryPayoutTransaction');

describe('findActiveSalaryPayoutBySalary', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should return the latest active transaction for a salary', async () => {
        const transaction = { _id: 'txn1', salary: 'sal1', status: 'INITIATED' };
        const sortMock = jest.fn().mockResolvedValue(transaction);
        SalaryPayoutTransaction.findOne.mockReturnValue({ sort: sortMock });

        const result = await findActiveSalaryPayoutBySalary({ corporateUser: 'corp1', salaryId: 'sal1' });

        expect(SalaryPayoutTransaction.findOne).toHaveBeenCalledWith({
            corporateUser: 'corp1',
            salary: 'sal1',
            status: { $in: ['PENDING', 'INITIATED'] },
        });
        expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
        expect(result).toEqual(transaction);
    });

    it('should return null when no active transaction exists for the salary', async () => {
        const sortMock = jest.fn().mockResolvedValue(null);
        SalaryPayoutTransaction.findOne.mockReturnValue({ sort: sortMock });

        const result = await findActiveSalaryPayoutBySalary({ corporateUser: 'corp1', salaryId: 'sal_none' });

        expect(result).toBeNull();
    });

    it('should throw if the query rejects', async () => {
        const sortMock = jest.fn().mockRejectedValue(new Error('DB error'));
        SalaryPayoutTransaction.findOne.mockReturnValue({ sort: sortMock });

        await expect(findActiveSalaryPayoutBySalary({ corporateUser: 'corp1', salaryId: 'sal1' })).rejects.toThrow('DB error');
    });
});
