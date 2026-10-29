const { getExcelSalaryDetails } = require('../../../use-cases/salary');
const Salary = require('../../../entities/salary');

jest.mock('../../../entities/salary');

describe('getExcelSalaryDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return salary details using aggregation pipeline for valid inputs', async () => {
        const params = {
            cycleStart: '2023-01-01',
            cycleEnd: '2023-01-31',
            corporateUserID: 'validCorporateUserId'
        };
        const mockSalaryDetails = [
            {
                employee: {
                    fullName: 'John Doe',
                    employeeInformation: { status: 'ACTIVE', department: { departmentName: 'Engineering' } }
                },
                monthlySalary: 5000
            }
        ];

        Salary.aggregate.mockResolvedValue(mockSalaryDetails);

        const result = await getExcelSalaryDetails(params);

        expect(Salary.aggregate).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    $match: {
                        corporateUser: params.corporateUserID,
                        salaryCycleStart: { $gte: new Date(params.cycleStart) },
                        salaryCycleEnd: { $lte: new Date(params.cycleEnd) }
                    }
                })
            ])
        );
        expect(result).toEqual(mockSalaryDetails);
    });

    it('should return an empty array if no salary details are found', async () => {
        const params = {
            cycleStart: '2023-01-01',
            cycleEnd: '2023-01-31',
            corporateUserID: 'validCorporateUserId'
        };

        Salary.aggregate.mockResolvedValue([]);

        const result = await getExcelSalaryDetails(params);

        expect(Salary.aggregate).toHaveBeenCalled();
        expect(result).toEqual([]);
    });

    it('should handle errors gracefully and return the error', async () => {
        const params = {
            cycleStart: '2023-01-01',
            cycleEnd: '2023-01-31',
            corporateUserID: 'validCorporateUserId'
        };
        const mockError = new Error('Database error');

        Salary.aggregate.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await getExcelSalaryDetails(params);

        expect(Salary.aggregate).toHaveBeenCalled();
        expect(result).toEqual(mockError);
    });
});
