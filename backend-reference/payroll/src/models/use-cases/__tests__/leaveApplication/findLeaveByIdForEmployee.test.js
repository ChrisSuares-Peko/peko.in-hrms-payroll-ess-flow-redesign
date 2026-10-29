const { findLeaveByIdForEmployee } = require('../../../use-cases/leaveApplication');
const LeaveApplication = require('../../../entities/leaveApplication');

jest.mock('../../../entities/leaveApplication');

describe('findLeaveByIdForEmployee Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should scope the lookup by both the leave id and the employee id, so another employee cannot fetch it by guessing the id', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const leaveId = 'leaveId';
        const leave = { _id: leaveId, employee: employeeId, corporateUser };

        LeaveApplication.findOne.mockResolvedValue(leave);

        const result = await findLeaveByIdForEmployee(corporateUser, employeeId, leaveId);

        expect(LeaveApplication.findOne).toHaveBeenCalledWith({
            _id: leaveId,
            corporateUser,
            employee: employeeId
        });
        expect(result).toEqual(leave);
    });

    it('should return null when the leave does not belong to the requesting employee', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const leaveId = 'someoneElsesLeaveId';

        LeaveApplication.findOne.mockResolvedValue(null);

        const result = await findLeaveByIdForEmployee(corporateUser, employeeId, leaveId);

        expect(LeaveApplication.findOne).toHaveBeenCalledWith({
            _id: leaveId,
            corporateUser,
            employee: employeeId
        });
        expect(result).toBeNull();
    });

    it('should throw a wrapped error on DB failure', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const leaveId = 'leaveId';
        const errorMessage = 'Database error';

        LeaveApplication.findOne.mockRejectedValue(new Error(errorMessage));

        await expect(findLeaveByIdForEmployee(corporateUser, employeeId, leaveId))
            .rejects.toThrow(`Failed to fetch leave application: ${errorMessage}`);
    });
});
