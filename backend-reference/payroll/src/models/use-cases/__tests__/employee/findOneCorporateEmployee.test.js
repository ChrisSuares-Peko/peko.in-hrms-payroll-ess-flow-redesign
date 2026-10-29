const { findOneCorporateEmployee } = require('../../../use-cases/employee'); // Adjust the path accordingly
const Employee = require('../../../entities/employee'); // Adjust the path accordingly
const mongoose = require('mongoose');

jest.mock('../../../entities/employee');

describe('findOneCorporateEmployee', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    it('should return an employee for a valid ID and corporateUserID', async () => {
        const employeeId = new mongoose.Types.ObjectId();
        const corporateUserID = new mongoose.Types.ObjectId();
        const mockEmployee = { _id: employeeId, corporateUser: corporateUserID, fullName: 'John Doe' };

        Employee.findOne.mockResolvedValue(mockEmployee);

        const result = await findOneCorporateEmployee({ employeeId, corporateUserID });

        expect(Employee.findOne).toHaveBeenCalledWith({
            _id: employeeId,
            corporateUser: corporateUserID
        });
        expect(result).toEqual(mockEmployee);
    });

    it('should handle errors gracefully', async () => {
        const employeeId = new mongoose.Types.ObjectId();
        const corporateUserID = new mongoose.Types.ObjectId();
        const mockError = new Error('Database error');

        Employee.findOne.mockRejectedValue(mockError);

        const result = await findOneCorporateEmployee({ employeeId, corporateUserID });

        expect(Employee.findOne).toHaveBeenCalledWith({
            _id: employeeId,
            corporateUser: corporateUserID
        });
        expect(result).toEqual(mockError);
    });
});
