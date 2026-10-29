const { findApprovedSalaries } = require('../../../use-cases/salary'); // Adjust the path accordingly
const Salary = require('../../../entities/salary'); // Adjust the path accordingly

jest.mock('../../../entities/salary');

describe('findApprovedSalaries', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    it('should return success message if no salary record is found', async () => {
        const month = 1;
        const year = 2023;
        const corporateUser = 'validCorporateUserId';

        Salary.findOne.mockResolvedValue(null);

        const result = await findApprovedSalaries(month, year, corporateUser);

        expect(Salary.findOne).toHaveBeenCalledWith({
            corporateUser,
            month,
            year,
            paymentStatus: { $in: ['APPROVED', 'PAID'] }
        });
        expect(result).toEqual({ status: true, message: 'Success' });
    });

    it('should return message if salary is approved', async () => {
        const month = 1;
        const year = 2023;
        const corporateUser = 'validCorporateUserId';

        const mockSalaryRecord = {
            paymentStatus: 'APPROVED'
        };

        Salary.findOne.mockResolvedValue(mockSalaryRecord);

        const result = await findApprovedSalaries(month, year, corporateUser);

        expect(Salary.findOne).toHaveBeenCalledWith({
            corporateUser,
            month,
            year,
            paymentStatus: { $in: ['APPROVED', 'PAID'] }
        });
        expect(result).toEqual({ status: false, message: 'The salary for this month is already approved' });
    });

    it('should return message if salary is paid', async () => {
        const month = 1;
        const year = 2023;
        const corporateUser = 'validCorporateUserId';

        const mockSalaryRecord = {
            paymentStatus: 'PAID'
        };

        Salary.findOne.mockResolvedValue(mockSalaryRecord);

        const result = await findApprovedSalaries(month, year, corporateUser);

        expect(Salary.findOne).toHaveBeenCalledWith({
            corporateUser,
            month,
            year,
            paymentStatus: { $in: ['APPROVED', 'PAID'] }
        });
        expect(result).toEqual({ status: false, message: 'The salary for this month is already paid' });
    });

    it('should handle errors gracefully', async () => {
        const month = 1;
        const year = 2023;
        const corporateUser = 'validCorporateUserId';

        const mockError = new Error('Database error');

        console.error = jest.fn();
        Salary.findOne.mockRejectedValue(mockError);

        const result = await findApprovedSalaries(month, year, corporateUser);

        expect(Salary.findOne).toHaveBeenCalledWith({
            corporateUser,
            month,
            year,
            paymentStatus: { $in: ['APPROVED', 'PAID'] }
        });
        expect(result).toEqual({ status: false, message: 'Something went wrong..' });
    });
});
