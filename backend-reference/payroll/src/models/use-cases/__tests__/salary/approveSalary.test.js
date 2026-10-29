const { approveSalary } = require('../../../use-cases/salary');
const Salary = require('../../../entities/salary');

jest.mock('../../../entities/salary');

describe('approveSalary Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an error if salaries are already approved for the given month and year', async () => {
        const params = {
            payingDate: new Date(),
            paymentStatus: 'APPROVED',
            corporateUserID: '60c72b2f9b1e8b2f4c8b4567',
            month: 7,
            year: 2023
        };

        Salary.find.mockResolvedValueOnce([{ _id: 'salarypayrollv2' }]);

        const result = await approveSalary(params);

        expect(result).toEqual({ success: false, message: 'Salaries for this month and year are already approved.' });
    });

    it('should return an error if trying to approve upcoming months salaries', async () => {
        const params = {
            payingDate: new Date(),
            paymentStatus: 'APPROVED',
            corporateUserID: '60c72b2f9b1e8b2f4c8b4567',
            month: 7,
            year: 2023
        };

        Salary.find.mockResolvedValueOnce([]);
        Salary.find.mockResolvedValueOnce([{ _id: 'salarypayrollv2' }]);

        const result = await approveSalary(params);

        expect(result).toEqual({ success: false, message: 'You cannot approve upcoming months salaries.' });
    });

    it('should update the payment status and paying date for the given month and year', async () => {
        const params = {
            payingDate: new Date(),
            paymentStatus: 'APPROVED',
            corporateUserID: '60c72b2f9b1e8b2f4c8b4567',
            month: 7,
            year: 2023
        };

        Salary.find.mockResolvedValueOnce([]);
        Salary.find.mockResolvedValueOnce([]);
        const updateResult = { nModified: 5 };

        Salary.updateMany.mockResolvedValueOnce(updateResult);
        // Third Salary.find call: fetches the just-approved salaries to mark their linked
        // arrears (if any) as PAID.
        Salary.find.mockResolvedValueOnce([]);

        const result = await approveSalary(params);

        expect(Salary.updateMany).toHaveBeenCalledWith(
            {
                corporateUser: params.corporateUserID,
                month: params.month,
                year: params.year
            },
            { payingDate: params.payingDate, paymentStatus: params.paymentStatus }
        );

        expect(result).toEqual(updateResult);
    });

    it('should return an error if the database operation fails', async () => {
        const params = {
            payingDate: new Date(),
            paymentStatus: 'APPROVED',
            corporateUserID: '60c72b2f9b1e8b2f4c8b4567',
            month: 7,
            year: 2023
        };
        const errorMessage = 'Database error';

        Salary.find.mockRejectedValueOnce(new Error(errorMessage));

        const result = await approveSalary(params);

        expect(result.message).toEqual(errorMessage);
    });
});
