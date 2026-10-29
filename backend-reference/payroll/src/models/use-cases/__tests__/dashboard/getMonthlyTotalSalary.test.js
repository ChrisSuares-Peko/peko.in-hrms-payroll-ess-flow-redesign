const { getMonthlyTotalSalary } = require('../../../use-cases/dashBoard');
const Salary = require('../../../entities/salary');

jest.mock('../../../entities/salary');

describe('getMonthlyTotalSalary Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

   

    it('should return the total salary for each month of the given year', async () => {
        const year = 2023;
        const corporateUserId = 'corporateUserID';

        const aggregateResult = [
            { _id: 1, totalSalary: 10000 },
            { _id: 2, totalSalary: 20000 },
            { _id: 3, totalSalary: 15000 },
        ];

        Salary.aggregate.mockResolvedValue(aggregateResult);

        const result = await getMonthlyTotalSalary(year, corporateUserId);

        const expected = [
            { id: 1,month:'Jan',  totalSalary: 10000 },
            { id: 2, month: 'Feb', totalSalary: 20000 },
            { id: 3, month: 'Mar', totalSalary: 15000 },
            { id: 4, month: 'Apr', totalSalary: 0 },
            { id: 5, month: 'May', totalSalary: 0 },
            { id: 6, month: 'Jun', totalSalary: 0 },
            { id: 7, month: 'Jul', totalSalary: 0 },
            { id: 8, month: 'Aug', totalSalary: 0 },
            { id: 9, month: 'Sep', totalSalary: 0 },
            { id: 10, month: 'Oct', totalSalary: 0 },
            { id: 11, month: 'Nov', totalSalary: 0 },
            { id: 12, month: 'Dec', totalSalary: 0 },
        ];

        expect(Salary.aggregate).toHaveBeenCalledWith([
            {
                $match: {
                    corporateUser: corporateUserId,
                    year
                }
            },
            {
                $group: {
                    _id: "$month",
                    totalSalary: { $sum: "$totalPayable" }
                }
            }
        ]);

        expect(result).toEqual(expected);
    });

    it('should handle errors gracefully', async () => {
        const year = 2023;
        const corporateUserId = 'corporateUserID';
        const errorMessage = 'Database error';

        Salary.aggregate.mockRejectedValue(new Error(errorMessage));

        const result = await getMonthlyTotalSalary(year, corporateUserId);

        expect(result.message).toEqual(errorMessage);
    });
});
