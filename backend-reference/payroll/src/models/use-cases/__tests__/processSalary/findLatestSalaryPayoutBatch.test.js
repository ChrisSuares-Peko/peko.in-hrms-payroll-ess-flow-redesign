const { findLatestSalaryPayoutBatch } = require('../../../use-cases/processSalary');
const SalaryPayoutBatch = require('../../../entities/salaryPayoutBatch');

jest.mock('../../../entities/salaryPayoutBatch');

describe('findLatestSalaryPayoutBatch', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should return the latest batch for the given month/year', async () => {
        const batch = { _id: 'b1', corporateUser: 'corp1', month: 5, year: 2026 };
        const sortMock = jest.fn().mockResolvedValue(batch);
        SalaryPayoutBatch.findOne.mockReturnValue({ sort: sortMock });

        const result = await findLatestSalaryPayoutBatch({ corporateUser: 'corp1', month: 5, year: 2026 });

        expect(SalaryPayoutBatch.findOne).toHaveBeenCalledWith({ corporateUser: 'corp1', month: 5, year: 2026 });
        expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
        expect(result).toEqual(batch);
    });

    it('should return null when no batch exists for the month/year', async () => {
        const sortMock = jest.fn().mockResolvedValue(null);
        SalaryPayoutBatch.findOne.mockReturnValue({ sort: sortMock });

        const result = await findLatestSalaryPayoutBatch({ corporateUser: 'corp1', month: 1, year: 2020 });

        expect(result).toBeNull();
    });

    it('should throw if the query rejects', async () => {
        const sortMock = jest.fn().mockRejectedValue(new Error('DB error'));
        SalaryPayoutBatch.findOne.mockReturnValue({ sort: sortMock });

        await expect(findLatestSalaryPayoutBatch({ corporateUser: 'corp1', month: 5, year: 2026 })).rejects.toThrow('DB error');
    });
});
