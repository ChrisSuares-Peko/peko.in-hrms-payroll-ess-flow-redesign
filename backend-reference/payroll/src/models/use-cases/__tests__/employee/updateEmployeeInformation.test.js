const { updateEmployeeInformation } = require('../../../use-cases/employee'); // Adjust the path accordingly
const Employee = require('../../../entities/employee'); // Adjust the path accordingly

jest.mock('../../../entities/employee');

describe('updateEmployeeInformation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the employee information successfully', async () => {
        const id = 'employeeId1';
        const corporateUserId = 'corporateUserId1';
        const employeeData = {
            dateOfJoin: '2023-08-01',
            employeeId: 'E123',
            designation: 'Software Engineer',
            department: 'IT',
            workLocation: 'Remote',
            status: 'ACTIVE',
            reportingStaff: 'Manager',
            workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            schedule: '9 AM - 5 PM',
            jobType: 'Full-Time',
            probation: '6 months',
            workingHours: 40
        };
        const mockUpdatedEmployee = {
            _id: id,
            corporateUser: corporateUserId,
            employeeInformation: employeeData
        };

        Employee.findOneAndUpdate.mockResolvedValue(mockUpdatedEmployee);

        const result = await updateEmployeeInformation(id, corporateUserId, employeeData);

        expect(Employee.findOneAndUpdate).toHaveBeenCalledWith(
            {
                _id: id,
                corporateUser: corporateUserId,
                isEmployeeDeleted: false
            },
            {
                $set: {
                    "employeeInformation.dateOfJoin": employeeData.dateOfJoin,
                    "employeeInformation.employeeId": employeeData.employeeId,
                    "employeeInformation.designation": employeeData.designation,
                    "employeeInformation.department": employeeData.department,
                    "employeeInformation.workLocation": employeeData.workLocation,
                    "employeeInformation.employeeStatus": employeeData.status,
                    "employeeInformation.reportingStaff": employeeData.reportingStaff,
                    "employeeInformation.workingDays": employeeData.workingDays,
                    "employeeInformation.schedule": employeeData.schedule,
                    "employeeInformation.jobType": employeeData.jobType,
                    "employeeInformation.probation": employeeData.probation,
                    "employeeInformation.workingHours": employeeData.workingHours
                }
            },
            { new: true }
        );
        expect(result).toEqual(mockUpdatedEmployee);
    });

    it('should handle errors gracefully', async () => {
        const id = 'employeeId1';
        const corporateUserId = 'corporateUserId1';
        const employeeData = {
            dateOfJoin: '2023-08-01',
            employeeId: 'E123',
            designation: 'Software Engineer',
            department: 'IT',
            workLocation: 'Remote',
            status: 'ACTIVE',
            reportingStaff: 'Manager',
            workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            schedule: '9 AM - 5 PM',
            jobType: 'Full-Time',
            probation: '6 months',
            workingHours: 40
        };
        const mockError = new Error('Database error');

        console.log = jest.fn();
        Employee.findOneAndUpdate.mockRejectedValue(mockError);

        const result = await updateEmployeeInformation(id, corporateUserId, employeeData);

        expect(Employee.findOneAndUpdate).toHaveBeenCalledWith(
            {
                _id: id,
                corporateUser: corporateUserId,
                isEmployeeDeleted: false
            },
            {
                $set: {
                    "employeeInformation.dateOfJoin": employeeData.dateOfJoin,
                    "employeeInformation.employeeId": employeeData.employeeId,
                    "employeeInformation.designation": employeeData.designation,
                    "employeeInformation.department": employeeData.department,
                    "employeeInformation.workLocation": employeeData.workLocation,
                    "employeeInformation.employeeStatus": employeeData.status,
                    "employeeInformation.reportingStaff": employeeData.reportingStaff,
                    "employeeInformation.workingDays": employeeData.workingDays,
                    "employeeInformation.schedule": employeeData.schedule,
                    "employeeInformation.jobType": employeeData.jobType,
                    "employeeInformation.probation": employeeData.probation,
                    "employeeInformation.workingHours": employeeData.workingHours
                }
            },
            { new: true }
        );
        expect(result).toEqual(mockError);
    });
});
