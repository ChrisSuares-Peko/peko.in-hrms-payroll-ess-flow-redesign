const { getLastMonthSalaryDetails } = require('../../../use-cases/dashBoard');
const Salary = require('../../../entities/salary');

jest.mock('../../../entities/salary');

describe('getLastMonthSalaryDetails Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the total payable sum for the last month', async () => {
        const params = { corporateUser: 'corporateUserID' };
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const currentYear = currentDate.getFullYear();
        const year = lastMonth === 12 ? currentYear - 1 : currentYear;

        const aggregateResult = [{ _id: null, totalPayableSum: 10000 }];
        Salary.aggregate.mockResolvedValue(aggregateResult);

        const result = await getLastMonthSalaryDetails(params);

        expect(Salary.aggregate).toHaveBeenCalledWith([
            {
                $match: {
                    corporateUser: params.corporateUser,
                    month: lastMonth,
                    year: year,
                },
            },
            {
                $group: {
                    _id: null,
                    totalPayableSum: { $sum: '$totalPayable' },
                },
            },
        ]);

        expect(result).toBe(aggregateResult[0].totalPayableSum);
    });

    it('should return 0 if there are no salary details for the last month', async () => {
        const params = { corporateUser: 'corporateUserID' };

        Salary.aggregate.mockResolvedValue([]);

        const result = await getLastMonthSalaryDetails(params);

        expect(result).toBe(0);
    });

    it('should handle errors', async () => {
        const params = { corporateUser: 'corporateUserID' };
        const errorMessage = 'Something went wrong while fetching the last month salary details. Please try again later';

        Salary.aggregate.mockRejectedValue(new Error(errorMessage));

        const result = await getLastMonthSalaryDetails(params);

        expect(result).toEqual(new Error(errorMessage));
    });
});
