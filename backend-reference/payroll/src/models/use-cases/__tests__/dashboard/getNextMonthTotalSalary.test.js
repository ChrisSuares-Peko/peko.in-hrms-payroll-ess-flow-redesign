const { getNextMonthTotalSalary } = require('../../../use-cases/dashBoard');
const Salary = require('../../../entities/salary');
const mongoose = require('mongoose');

jest.mock('../../../entities/salary');
jest.mock('../../../use-cases/salary', () => ({
    getNextMonthTotalSalary: jest.fn(),
    getTotalSalaryForActiveAndLeaveEmployees: jest.fn(),
}));

describe('getNextMonthTotalSalary', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the total payable salary for the next month', async () => {
        const corporateUser = new mongoose.Types.ObjectId().toString();
        const mockAggregateResult = [{ totalPayableSum: 10000 }];
        const params = { corporateUser };

        Salary.aggregate.mockResolvedValue(mockAggregateResult);

        const result = await getNextMonthTotalSalary(params);

        expect(Salary.aggregate).toHaveBeenCalledWith([
            {
                $match: {
                    corporateUser,
                    month: new Date().getMonth() === 11 ? 1 : new Date().getMonth() + 2,
                    year: new Date().getMonth() === 11 ? new Date().getFullYear() + 1 : new Date().getFullYear(),
                },
            },
            {
                $group: {
                    _id: null,
                    totalPayableSum: { $sum: '$totalPayable' },
                },
            },
        ]);

        expect(result).toBe(mockAggregateResult[0].totalPayableSum);
    });

  

    it('should handle errors gracefully', async () => {
        const corporateUser = new mongoose.Types.ObjectId().toString();
        const mockError = new Error('Database error');
        const params = { corporateUser };

        Salary.aggregate.mockRejectedValue(mockError);

        const result = await getNextMonthTotalSalary(params);

        expect(Salary.aggregate).toHaveBeenCalledWith([
            {
                $match: {
                    corporateUser,
                    month: new Date().getMonth() === 11 ? 1 : new Date().getMonth() + 2,
                    year: new Date().getMonth() === 11 ? new Date().getFullYear() + 1 : new Date().getFullYear(),
                },
            },
            {
                $group: {
                    _id: null,
                    totalPayableSum: { $sum: '$totalPayable' },
                },
            },
        ]);

        expect(result).toBe(mockError);
    });
});
