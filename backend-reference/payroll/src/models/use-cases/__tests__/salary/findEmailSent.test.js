const { updateEmailSent } = require('../../../use-cases/salary');
const Salary = require('../../../entities/salary');
const mongoose = require('mongoose');

jest.mock('../../../entities/salary');

describe('updateEmailSent Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the paySlipEmailSent field and return the updated salary', async () => {
        const params = {
            corporateUserID: '60c72b2f9b1e8b2f4c8b4567',
            employeeId: '60c72b2f9b1e8b2f4c8b4568',
            month: 7,
            year: 2023
        };

        const updateResult = {
            matchedCount: 1,
            modifiedCount: 1,
            acknowledged: true
        };

        Salary.updateOne.mockResolvedValue(updateResult);

        const result = await updateEmailSent(params);

        expect(Salary.updateOne).toHaveBeenCalledWith(
            {
                corporateUser: params.corporateUserID,
                employee: new mongoose.Types.ObjectId(params.employeeId),
                year: params.year,
                month: params.month
            },
            { $set: { paySlipEmailSent: true } }
        );

        expect(result).toEqual(updateResult);
    });

    it('should return an error if the database operation fails', async () => {
        const params = {
            corporateUserID: '60c72b2f9b1e8b2f4c8b4567',
            employeeId: '60c72b2f9b1e8b2f4c8b4568',
            month: 7,
            year: 2023
        };
        const errorMessage = 'Database error';

        console.log = jest.fn();
        Salary.updateOne.mockRejectedValue(new Error(errorMessage));

        const result = await updateEmailSent(params);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toEqual(errorMessage);
    });
});
