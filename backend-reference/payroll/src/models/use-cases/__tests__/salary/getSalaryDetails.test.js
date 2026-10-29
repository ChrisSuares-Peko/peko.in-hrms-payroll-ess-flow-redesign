const { getSalaryDetails } = require('../../../use-cases/salary');
const Salary = require('../../../entities/salary');
const { getDaysDifference } = require('../../../../utils/dateUtils');

jest.mock('../../../entities/salary');
jest.mock('../../../../utils/dateUtils');

describe('getSalaryDetails Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return paginated salary details and total count', async () => {
        const params = {
            page: 1,
            limit: 10,
            searchText: 'John',
            cycleStart: '2023-07-01',
            cycleEnd: '2023-07-31',
            corporateUserID: 'corporateUserID'
        };

        const salaryData = [
            {
                _id: 'salarypayrollv2',
                corporateUser: params.corporateUserID,
                employee: { _id: 'employeepayrollv2', fullName: 'John Doe', employeeInformation: { employeeId: '123', designation: 'Developer' } },
                department: { _id: 'department1', departmentName: 'IT' },
                totalPayable: 5000,
                salaryInformation: {
                    basicPay: 2000,
                    travelAllowances: 500,
                    homeAllowances: 500,
                    medicalAllowances: 500,
                    otherAllowances: 500,
                    other: 500
                },
                totalIncentive: 500,
                totalBonus: 500,
                totalOvertime: 500,
            }
        ];

        // One aggregation — total payable, count and the page are all derived from it.
        Salary.aggregate.mockResolvedValueOnce(salaryData);

        getDaysDifference.mockReturnValue(30);

        const result = await getSalaryDetails(params);

        expect(Salary.aggregate).toHaveBeenCalledTimes(1);
        expect(Salary.aggregate).toHaveBeenCalledWith(expect.any(Array));
        expect(result).toEqual({
            count: 1,
            salaryCycle: { salaryCycleStart: params.cycleStart, salaryCycleEnd: params.cycleEnd, salaryCycleDays: 30 },
            totalPayableSum: 5000,
            rows: salaryData,
        });
    });

    it('should return an error if the database operation fails', async () => {
        const params = {
            page: 1,
            limit: 10,
            searchText: 'John',
            cycleStart: '2023-07-01',
            cycleEnd: '2023-07-31',
            corporateUserID: 'corporateUserID'
        };

        const errorMessage = 'Database error';

        console.error = jest.fn();
        Salary.aggregate.mockRejectedValueOnce(new Error(errorMessage));

        const result = await getSalaryDetails(params);

        expect(result.message).toEqual(errorMessage);
    });
});
