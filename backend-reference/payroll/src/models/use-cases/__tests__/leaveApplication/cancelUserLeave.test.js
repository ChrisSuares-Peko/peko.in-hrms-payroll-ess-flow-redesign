const { cancelUserLeave } = require('../../../use-cases/leaveApplication');
const LeaveApplication = require('../../../entities/leaveApplication');

jest.mock('../../../entities/leaveApplication');

describe('cancelUserLeave Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the status to cancelledByEmployee, scoped to the given leave id and employee id', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const leaveId = 'leaveId';
        const updated = { _id: leaveId, employee: employeeId, corporateUser, status: 'cancelledByEmployee' };

        LeaveApplication.findOneAndUpdate.mockResolvedValue(updated);

        const result = await cancelUserLeave(corporateUser, employeeId, leaveId);

        expect(LeaveApplication.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: leaveId, corporateUser, employee: employeeId },
            { $set: { status: 'cancelledByEmployee' } },
            { new: true }
        );
        expect(result).toEqual(updated);
    });

    it('should return null when no matching leave is found for that employee', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const leaveId = 'notMineLeaveId';

        LeaveApplication.findOneAndUpdate.mockResolvedValue(null);

        const result = await cancelUserLeave(corporateUser, employeeId, leaveId);

        expect(result).toBeNull();
    });

    it('should throw a wrapped error on DB failure', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const leaveId = 'leaveId';
        const errorMessage = 'Database error';

        LeaveApplication.findOneAndUpdate.mockRejectedValue(new Error(errorMessage));

        await expect(cancelUserLeave(corporateUser, employeeId, leaveId))
            .rejects.toThrow(`Failed to cancel leave application: ${errorMessage}`);
    });
});
