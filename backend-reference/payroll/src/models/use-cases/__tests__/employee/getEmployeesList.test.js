const { getEmployeesList } = require('../../../use-cases/employee');
const Employee = require('../../../entities/employee');
const mongoose = require('mongoose');

jest.mock('../../../entities/employee');

describe('getEmployeesList', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a list of employees for valid inputs without month and year', async () => {
        const userId = new mongoose.Types.ObjectId();
        const searchText = '';
        const mockEmployees = [
            { personalInformation: { fullName: 'John Doe' }, employeeInformation: {} },
            { personalInformation: { fullName: 'Jane Smith' }, employeeInformation: {} }
        ];

        Employee.aggregate.mockResolvedValue(mockEmployees);

        const result = await getEmployeesList(userId, searchText);

        expect(Employee.aggregate).toHaveBeenCalledWith([
            { $match: expect.objectContaining({ corporateUser: userId, isEmployeeDeleted: false }) },
            {
                $project: expect.objectContaining({
                    label: '$personalInformation.fullName',
                    value: '$personalInformation.fullName',
                    personalInformation: 1,
                    employeeInformation: 1,
                    id: '$_id',
                    _id: 0
                })
            },
            { $sort: { 'personalInformation.fullName': 1 } }
        ]);

        expect(result).toEqual(mockEmployees);
    });

    it('should return a list of employees for valid inputs with month and year', async () => {
        const userId = new mongoose.Types.ObjectId();
        const searchText = '';
        const month = 8;
        const year = 2024;
        const mockEmployees = [
            { personalInformation: { fullName: 'John Doe' }, employeeInformation: {} },
            { personalInformation: { fullName: 'Jane Smith' }, employeeInformation: {} }
        ];

        Employee.aggregate.mockResolvedValue(mockEmployees);

        const result = await getEmployeesList(userId, searchText, month, year);

        expect(Employee.aggregate).toHaveBeenCalledWith([
            { $match: expect.objectContaining({ corporateUser: userId, isEmployeeDeleted: false }) },
            {
                $project: expect.objectContaining({
                    label: '$personalInformation.fullName',
                    value: '$personalInformation.fullName',
                    personalInformation: 1,
                    id: '$_id',
                    _id: 0
                })
            },
            { $sort: { 'personalInformation.fullName': 1 } }
        ]);

        expect(result).toEqual(mockEmployees);
    });

    it('should return a list of employees for valid inputs with searchText', async () => {
        const userId = new mongoose.Types.ObjectId();
        const searchText = 'John';
        const mockEmployees = [
            { personalInformation: { fullName: 'John Doe' }, employeeInformation: {} }
        ];

        Employee.aggregate.mockResolvedValue(mockEmployees);

        const result = await getEmployeesList(userId, searchText);

        expect(Employee.aggregate).toHaveBeenCalledWith([
            {
                $match: expect.objectContaining({
                    corporateUser: userId,
                    isEmployeeDeleted: false,
                    'personalInformation.fullName': { $regex: `^${searchText}`, $options: 'i' }
                })
            },
            {
                $project: expect.objectContaining({
                    label: '$personalInformation.fullName',
                    value: '$personalInformation.fullName',
                    personalInformation: 1,
                    id: '$_id',
                    _id: 0
                })
            },
            { $sort: { 'personalInformation.fullName': 1 } }
        ]);

        expect(result).toEqual(mockEmployees);
    });

    it('should handle errors gracefully', async () => {
        const userId = new mongoose.Types.ObjectId();
        const searchText = '';
        const mockError = new Error('Database error');

        Employee.aggregate.mockRejectedValue(mockError);

        const result = await getEmployeesList(userId, searchText);

        expect(Employee.aggregate).toHaveBeenCalled();
        expect(result).toEqual(mockError);
    });
});
