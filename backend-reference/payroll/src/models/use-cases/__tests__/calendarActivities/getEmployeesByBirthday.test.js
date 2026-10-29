const { getEmployeesByBirthday } = require('../../../use-cases/calendarActivities');
const Employee = require('../../../entities/employee');
const mongoose = require('mongoose');

jest.mock('../../../entities/employee');

describe('getEmployeesByBirthday', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return employees with birthdays within the specified range', async () => {
        const userId = 'validUserId';
        const within = 30;
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + within);

        const id1 = new mongoose.Types.ObjectId();
        const id2 = new mongoose.Types.ObjectId();
        const id3 = new mongoose.Types.ObjectId();

        const employees = [
            {
                _id: id1,
                id: id1.toString(),
                personalInformation: {
                    fullName: 'John Doe',
                    dateOfBirth: new Date('1990-08-25'),
                    gender: 'Male'
                }
            },
            {
                _id: id2,
                id: id2.toString(),
                personalInformation: {
                    fullName: 'Jane Smith',
                    dateOfBirth: new Date('1985-09-10'),
                    gender: 'Female'
                }
            },
            {
                _id: id3,
                id: id3.toString(),
                personalInformation: {
                    fullName: 'Mark Brown',
                    dateOfBirth: new Date('1992-10-01'),
                    gender: 'Male'
                }
            }
        ];

        Employee.find.mockResolvedValue(employees);

        const result = await getEmployeesByBirthday(userId, within);

        expect(Employee.find).toHaveBeenCalledWith({
            corporateUser: userId,
            'employeeInformation.employeeStatus': { $nin: ['SUSPENDED', 'RESIGNED'] }
        });

        const expected = employees.map(employee => {
            const dob = new Date(employee.personalInformation.dateOfBirth);
            dob.setFullYear(today.getFullYear());
            if (dob < today) {
                dob.setFullYear(today.getFullYear() + 1);
            }
            return {
                id: employee.id,
                fullName: employee.personalInformation.fullName,
                dateOfBirth: employee.personalInformation.dateOfBirth,
                nextBirthday: dob,
                gender: employee.personalInformation.gender
            };
        }).filter(employee => employee.nextBirthday <= endDate);

        expect(result).toEqual(expected);
    });

    it('should return an empty array if no employees have birthdays within the specified range', async () => {
        const userId = 'validUserId';
        const within = 7;

        const id1 = new mongoose.Types.ObjectId();
        const employees = [
            {
                _id: id1,
                id: id1.toString(),
                personalInformation: {
                    fullName: 'John Doe',
                    dateOfBirth: new Date('1990-08-25'),
                    gender: 'Male'
                }
            }
        ];

        Employee.find.mockResolvedValue(employees);

        const result = await getEmployeesByBirthday(userId, within);

        expect(Employee.find).toHaveBeenCalledWith({
            corporateUser: userId,
            'employeeInformation.employeeStatus': { $nin: ['SUSPENDED', 'RESIGNED'] }
        });

        expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
        const userId = 'validUserId';
        const within = 30;
        const mockError = new Error('Database error');

        Employee.find.mockRejectedValue(mockError);
        console.log = jest.fn();

        const result = await getEmployeesByBirthday(userId, within);

        expect(Employee.find).toHaveBeenCalledWith({
            corporateUser: userId,
            'employeeInformation.employeeStatus': { $nin: ['SUSPENDED', 'RESIGNED'] }
        });

        expect(result).toEqual(mockError);
    });
});
