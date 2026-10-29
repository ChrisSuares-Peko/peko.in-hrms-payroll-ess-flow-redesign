const { findOneSalaryForReprocessing } = require('../../../use-cases/salary');
const Salary = require('../../../entities/salary');
const { ObjectId } = require('mongoose').Types;

jest.mock('../../../entities/salary');

describe('findOneSalaryForReprocessing Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the employee salary for the given parameters', async () => {
        const params = {
            corporateUserID: '60c72b2f9b1e8b2f4c8b4567', // Valid ObjectId string
            employeeId: '60c72b2f9b1e8b2f4c8b4568', // Valid ObjectId string
            year: 2023,
            month: 7,
            cycleStart: new Date('2023-07-01'),
            cycleEnd: new Date('2023-07-31')
        };

        const salaryData = {
            _id: new ObjectId(),
            corporateUser: params.corporateUserID,
            employee: new ObjectId(params.employeeId),
            year: params.year,
            month: params.month,
            salaryCycleStart: params.cycleStart,
            salaryCycleEnd: params.cycleEnd
        };

        Salary.findOne.mockResolvedValue(salaryData);

        const result = await findOneSalaryForReprocessing(params);

        expect(Salary.findOne).toHaveBeenCalledWith({
            corporateUser: params.corporateUserID,
            employee: new ObjectId(params.employeeId),
            year: params.year,
            month: params.month,
            salaryCycleStart: params.cycleStart,
            salaryCycleEnd: params.cycleEnd
        });

        expect(result).toEqual(salaryData);
    });

    it('should return an error if the database operation fails', async () => {
        const params = {
            corporateUserID: '60c72b2f9b1e8b2f4c8b4567', // Valid ObjectId string
            employeeId: '60c72b2f9b1e8b2f4c8b4568', // Valid ObjectId string
            year: 2023,
            month: 7,
            cycleStart: new Date('2023-07-01'),
            cycleEnd: new Date('2023-07-31')
        };
        const errorMessage = 'Database error';

        Salary.findOne.mockRejectedValue(new Error(errorMessage));

        const result = await findOneSalaryForReprocessing(params);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toEqual(errorMessage);
    });
});
