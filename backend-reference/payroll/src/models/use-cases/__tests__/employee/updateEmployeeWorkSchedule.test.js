const { updateEmployeeWorkSchedule } = require('../../../use-cases/employee'); // Adjust the path accordingly
const Employee = require('../../../entities/employee'); // Adjust the path accordingly

jest.mock('../../../entities/employee');

describe('updateEmployeeWorkSchedule', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the employee work schedule successfully', async () => {
        const employeeId = 'employeeId1';
        const corporateUser = 'corporateUser1';
        const isDeleted = false;
        const workScheduleData = { startTime: '09:00', endTime: '17:00', breakTimeHrs: 1 };
        const mockUpdatedEmployee = {
            _id: employeeId,
            corporateUser,
            workSchedule: workScheduleData,
        };

        Employee.findOneAndUpdate.mockResolvedValue(mockUpdatedEmployee);

        const result = await updateEmployeeWorkSchedule(employeeId, corporateUser, isDeleted, workScheduleData);

        expect(Employee.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: employeeId, corporateUser, isDeleted },
            { $set: { workSchedule: workScheduleData } },
            { new: true }
        );
        expect(result).toEqual(mockUpdatedEmployee);
    });

    it('should handle errors gracefully', async () => {
        const employeeId = 'employeeId1';
        const corporateUser = 'corporateUser1';
        const isDeleted = false;
        const workScheduleData = { startTime: '09:00', endTime: '17:00', breakTimeHrs: 1 };
        const mockError = new Error('Database error');

        console.log = jest.fn();
        Employee.findOneAndUpdate.mockRejectedValue(mockError);

        const result = await updateEmployeeWorkSchedule(employeeId, corporateUser, isDeleted, workScheduleData);

        expect(Employee.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: employeeId, corporateUser, isDeleted },
            { $set: { workSchedule: workScheduleData } },
            { new: true }
        );
        expect(result).toEqual(mockError);
    });
});
