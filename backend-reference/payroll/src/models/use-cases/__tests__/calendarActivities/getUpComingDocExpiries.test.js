const { getUpComingDocExpiries } = require('../../../use-cases/calendarActivities');
const Employee = require('../../../entities/employee');
const mongoose = require('mongoose');

jest.mock('../../../entities/employee');

describe('getUpComingDocExpiries', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return upcoming document expiries within the specified range', async () => {
        const userId = 'validUserId';
        const within = 30;
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + within);

        const id1 = new mongoose.Types.ObjectId();
        const id2 = new mongoose.Types.ObjectId();

        const mockEmployees = [
            {
                _id: id1,
                id: id1.toString(),
                personalInformation: { fullName: 'John Doe' },
                employeeInformation: { status: 'ACTIVE' },
                employeeDocuments: [
                    { name: 'Passport', expiryDate: new Date(today.getTime() + (10 * 24 * 60 * 60 * 1000)) },
                    { name: 'Visa', expiryDate: new Date(today.getTime() + (40 * 24 * 60 * 60 * 1000)) }
                ]
            },
            {
                _id: id2,
                id: id2.toString(),
                personalInformation: { fullName: 'Jane Smith' },
                employeeInformation: { status: 'LEAVE' },
                employeeDocuments: [
                    { name: 'Work Permit', expiryDate: new Date(today.getTime() + (20 * 24 * 60 * 60 * 1000)) }
                ]
            }
        ];

        Employee.find.mockResolvedValue(mockEmployees);

        const result = await getUpComingDocExpiries(userId, within);

        expect(Employee.find).toHaveBeenCalledWith(
            { corporateUser: userId, 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] } }
        );

        expect(result).toEqual([
            {
                fullName: 'John Doe',
                docName: 'Passport',
                expiryDate: new Date(today.getTime() + (10 * 24 * 60 * 60 * 1000)),
                id: id1.toString()
            },
            {
                fullName: 'Jane Smith',
                docName: 'Work Permit',
                expiryDate: new Date(today.getTime() + (20 * 24 * 60 * 60 * 1000)),
                id: id2.toString()
            }
        ]);
    });

    it('should return an empty array if no documents are expiring within the specified range', async () => {
        const userId = 'validUserId';
        const within = 30;

        const id1 = new mongoose.Types.ObjectId();
        const mockEmployees = [
            {
                _id: id1,
                id: id1.toString(),
                personalInformation: { fullName: 'John Doe' },
                employeeInformation: { status: 'ACTIVE' },
                employeeDocuments: [
                    { name: 'Passport', expiryDate: new Date(new Date().getTime() + (40 * 24 * 60 * 60 * 1000)) },
                    { name: 'Visa', expiryDate: new Date(new Date().getTime() + (50 * 24 * 60 * 60 * 1000)) }
                ]
            }
        ];

        Employee.find.mockResolvedValue(mockEmployees);

        const result = await getUpComingDocExpiries(userId, within);

        expect(Employee.find).toHaveBeenCalledWith(
            { corporateUser: userId, 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] } }
        );

        expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
        const userId = 'validUserId';
        const within = 30;
        const mockError = new Error('Database error');

        Employee.find.mockRejectedValue(mockError);
        console.log = jest.fn();

        const result = await getUpComingDocExpiries(userId, within);

        expect(Employee.find).toHaveBeenCalledWith(
            { corporateUser: userId, 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] } }
        );

        expect(result).toEqual(mockError);
    });
});
