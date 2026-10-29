const { isSalaryProcessedForMonthYearCorporateUser } = require('../../../use-cases/salary'); // Adjust the path accordingly
const Salary = require('../../../entities/salary'); // Adjust the path accordingly

jest.mock('../../../entities/salary');

describe('isSalaryProcessedForMonthYearCorporateUser', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the salary document if found', async () => {
        const month = 1;
        const year = 2023;
        const corporateUserId = 'validCorporateUserId';

        const mockSalary = {
            _id: '60c72b2f5f1b2c001c8e4cfb',
            corporateUser: corporateUserId,
            month: month,
            year: year,
            salaryAmount: 5000,
        };

        Salary.findOne.mockResolvedValue(mockSalary);

        const result = await isSalaryProcessedForMonthYearCorporateUser(month, year, corporateUserId);

        expect(Salary.findOne).toHaveBeenCalledWith({
            corporateUser: corporateUserId,
            month: month,
            year: year,
        });
        expect(result).toEqual(mockSalary);
    });

    it('should return null if no salary document is found', async () => {
        const month = 1;
        const year = 2023;
        const corporateUserId = 'validCorporateUserId';

        Salary.findOne.mockResolvedValue(null);

        const result = await isSalaryProcessedForMonthYearCorporateUser(month, year, corporateUserId);

        expect(Salary.findOne).toHaveBeenCalledWith({
            corporateUser: corporateUserId,
            month: month,
            year: year,
        });
        expect(result).toBeNull();
    });

    it('should return false if an error occurs', async () => {
        const month = 1;
        const year = 2023;
        const corporateUserId = 'validCorporateUserId';

        const mockError = new Error('Database error');

        console.error = jest.fn();
        Salary.findOne.mockRejectedValue(mockError);

        const result = await isSalaryProcessedForMonthYearCorporateUser(month, year, corporateUserId);

        expect(Salary.findOne).toHaveBeenCalledWith({
            corporateUser: corporateUserId,
            month: month,
            year: year,
        });
        expect(result).toBe(false);
    });
});
