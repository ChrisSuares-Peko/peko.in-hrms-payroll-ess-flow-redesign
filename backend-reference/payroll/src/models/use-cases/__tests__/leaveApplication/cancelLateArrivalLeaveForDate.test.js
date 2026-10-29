const { cancelLateArrivalLeaveForDate } = require('../../../use-cases/leaveApplication');
const LeaveApplication = require('../../../entities/leaveApplication');
const EmployeeLeaveBalance = require('../../../entities/leaveBalance');

jest.mock('../../../entities/leaveApplication');
jest.mock('../../../entities/leaveBalance');

describe('cancelLateArrivalLeaveForDate Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const getDayBounds = (date) => {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        return { dayStart, dayEnd };
    };

    it('should delete the late-arrival deduction for that employee/date only, and restore the 0.5 day to their balance', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const date = new Date('2023-07-10T09:45:00');
        const { dayStart, dayEnd } = getDayBounds(date);

        const deduction = {
            _id: 'deductionId',
            employee: employeeId,
            typeOfLeave: 'annualComponentId',
            leaveCount: 0.5
        };
        LeaveApplication.findOneAndDelete.mockResolvedValue(deduction);
        EmployeeLeaveBalance.findOneAndUpdate.mockResolvedValue({});

        const result = await cancelLateArrivalLeaveForDate(corporateUser, employeeId, date);

        expect(LeaveApplication.findOneAndDelete).toHaveBeenCalledWith({
            corporateUser,
            employee: employeeId,
            isLateArrivalDeduction: true,
            start: { $gte: dayStart, $lte: dayEnd }
        });

        expect(EmployeeLeaveBalance.findOneAndUpdate).toHaveBeenCalledWith(
            { employee: employeeId, 'leavePolicies.leaveComponent': deduction.typeOfLeave },
            { $inc: { 'leavePolicies.$.availableLeave': deduction.leaveCount } }
        );

        expect(result).toEqual(deduction);
    });

    it('should return null and not touch the leave balance when there is no late-arrival deduction for that date', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const date = new Date('2023-07-10T09:45:00');

        LeaveApplication.findOneAndDelete.mockResolvedValue(null);

        const result = await cancelLateArrivalLeaveForDate(corporateUser, employeeId, date);

        expect(result).toBeNull();
        expect(EmployeeLeaveBalance.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should propagate the underlying error on DB failure (no wrapping)', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const date = new Date('2023-07-10T09:45:00');
        const errorMessage = 'Database error';

        LeaveApplication.findOneAndDelete.mockRejectedValue(new Error(errorMessage));

        await expect(cancelLateArrivalLeaveForDate(corporateUser, employeeId, date))
            .rejects.toThrow(errorMessage);
    });
});
