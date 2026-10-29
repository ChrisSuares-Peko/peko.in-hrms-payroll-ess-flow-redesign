// tests/use-cases/fetchEmployeeWithDepartment.test.js
const mongoose = require('mongoose');
const { fetchEmployeeWithDepartment } = require('../../employee');
const Employee = require('../../../entities/employee');

jest.mock('../../../entities/employee', () => ({
  findOne: jest.fn(),
}));

describe('fetchEmployeeWithDepartment Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch an employee associated with a department', async () => {
    const corporateUserID = 'corporateUserID';
    const departmentId = new mongoose.Types.ObjectId();
    const expectedEmployee = { _id: 'employeeId', corporateUser: corporateUserID, 'employeeInformation.department': departmentId };

    Employee.findOne.mockResolvedValue(expectedEmployee);

    const result = await fetchEmployeeWithDepartment(corporateUserID, departmentId);

    expect(Employee.findOne).toHaveBeenCalledWith({
      $and: [
        { corporateUser: corporateUserID },
        { 'employeeInformation.department': departmentId },
        { isEmployeeDeleted: false },
        { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] } }
      ]
    });
    expect(result).toEqual(expectedEmployee);
  });

  it('should return an error if the findOne method throws an error', async () => {
    const corporateUserID = 'corporateUserID';
    const departmentId = new mongoose.Types.ObjectId();  // Changed this to ObjectId
    const expectedError = new Error('Database error');

    console.log = jest.fn();
    Employee.findOne.mockRejectedValue(expectedError);

    const result = await fetchEmployeeWithDepartment(corporateUserID, departmentId);

    expect(Employee.findOne).toHaveBeenCalledWith({
      $and: [
        { corporateUser: corporateUserID },
        { 'employeeInformation.department': departmentId },
        { isEmployeeDeleted: false },
        { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] } }
      ]
    });
    expect(result).toBe(expectedError);
  });
});
