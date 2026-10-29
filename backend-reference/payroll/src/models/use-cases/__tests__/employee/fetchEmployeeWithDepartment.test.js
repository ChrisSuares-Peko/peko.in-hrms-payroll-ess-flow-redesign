const { fetchEmployeeWithDepartment } = require('../../../use-cases/employee'); // Adjust the path accordingly
const Employee = require('../../../entities/employee'); // Adjust the path accordingly
const mongoose = require('mongoose');

jest.mock('../../../entities/employee');

describe('fetchEmployeeWithDepartment', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch employee for given corporateUserID and departmentId', async () => {
        const corporateUserID = new mongoose.Types.ObjectId();
        const departmentId = new mongoose.Types.ObjectId();
        const mockEmployee = {
            _id: new mongoose.Types.ObjectId(),
            fullName: 'John Doe',
            corporateUser: corporateUserID,
            employeeInformation: {
                department: departmentId,
                status: 'ACTIVE'
            },
            isEmployeeDeleted: false
        };

        Employee.findOne.mockResolvedValue(mockEmployee);

        const result = await fetchEmployeeWithDepartment(corporateUserID, departmentId);

        expect(Employee.findOne).toHaveBeenCalledWith({
            $and: [
                { corporateUser: corporateUserID },
                { 'employeeInformation.department': new mongoose.Types.ObjectId(departmentId) },
                { isEmployeeDeleted: false },
                { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] } }
            ]
        });
        expect(result).toEqual(mockEmployee);
    });

    it('should return null if no employee is found', async () => {
        const corporateUserID = new mongoose.Types.ObjectId();
        const departmentId = new mongoose.Types.ObjectId();

        Employee.findOne.mockResolvedValue(null);

        const result = await fetchEmployeeWithDepartment(corporateUserID, departmentId);

        expect(Employee.findOne).toHaveBeenCalledWith({
            $and: [
                { corporateUser: corporateUserID },
                { 'employeeInformation.department': new mongoose.Types.ObjectId(departmentId) },
                { isEmployeeDeleted: false },
                { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] } }
            ]
        });
        expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
        const corporateUserID = new mongoose.Types.ObjectId();
        const departmentId = new mongoose.Types.ObjectId();
        const mockError = new Error('Database error');

        console.log = jest.fn();
        Employee.findOne.mockRejectedValue(mockError);

        const result = await fetchEmployeeWithDepartment(corporateUserID, departmentId);

        expect(Employee.findOne).toHaveBeenCalledWith({
            $and: [
                { corporateUser: corporateUserID },
                { 'employeeInformation.department': new mongoose.Types.ObjectId(departmentId) },
                { isEmployeeDeleted: false },
                { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] } }
            ]
        });
        expect(result).toEqual(mockError);
    });
});
