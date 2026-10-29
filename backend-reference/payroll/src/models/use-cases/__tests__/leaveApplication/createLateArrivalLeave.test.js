const { createLateArrivalLeave } = require('../../../use-cases/leaveApplication');
const LeaveApplication = require('../../../entities/leaveApplication');
const LeaveComponent = require('../../../entities/leaveComponent');
const EmployeeLeaveBalance = require('../../../entities/leaveBalance');

jest.mock('../../../entities/leaveApplication');
jest.mock('../../../entities/leaveComponent');
jest.mock('../../../entities/leaveBalance');

describe('createLateArrivalLeave Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const getDayStart = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    it('should create a new leave balance doc (allowance minus 0.5) when the employee has none yet, and create the 0.5-day leave record', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const date = new Date('2023-07-10T09:45:00');
        const dayStart = getDayStart(date);

        const annualComponent = {
            _id: 'annualComponentId',
            maximumNumberOfLeaves: 12,
            carryOverBalance: 0
        };

        LeaveComponent.findOne.mockResolvedValueOnce(annualComponent);
        EmployeeLeaveBalance.findOne.mockResolvedValue(null);
        EmployeeLeaveBalance.prototype.save = jest.fn().mockResolvedValue(true);

        const createdLeave = { _id: 'leaveId', isLateArrivalDeduction: true };
        LeaveApplication.create.mockResolvedValue(createdLeave);

        const result = await createLateArrivalLeave(corporateUser, employeeId, date);

        expect(LeaveComponent.findOne).toHaveBeenNthCalledWith(1, {
            corporateUser,
            leaveType: 'Annual Leave',
            employee: employeeId
        });
        expect(EmployeeLeaveBalance.findOne).toHaveBeenCalledWith({ employee: employeeId });
        expect(EmployeeLeaveBalance).toHaveBeenCalledWith({
            employee: employeeId,
            leavePolicies: [{
                leaveComponent: annualComponent._id,
                availableLeave: 11.5,
                carryOverBalance: 0
            }]
        });
        expect(EmployeeLeaveBalance.prototype.save).toHaveBeenCalled();

        expect(LeaveApplication.create).toHaveBeenCalledWith({
            corporateUser,
            employee: employeeId,
            start: dayStart,
            end: dayStart,
            leaveCount: 0.5,
            typeOfLeave: annualComponent._id,
            halfDaySelection: 'FIRST_HALF',
            isLateArrivalDeduction: true
        });
        expect(result).toEqual(createdLeave);
    });

    it('should decrement the existing matching policy by 0.5 when a leave balance doc already has this component', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const date = new Date('2023-07-10T09:45:00');

        const annualComponent = {
            _id: 'annualComponentId',
            maximumNumberOfLeaves: 12,
            carryOverBalance: 0
        };
        LeaveComponent.findOne.mockResolvedValueOnce(annualComponent);

        const existingBalance = {
            leavePolicies: [
                { leaveComponent: { toString: () => 'annualComponentId' }, availableLeave: 10, carryOverBalance: 0 }
            ],
            save: jest.fn().mockResolvedValue(true)
        };
        EmployeeLeaveBalance.findOne.mockResolvedValue(existingBalance);

        LeaveApplication.create.mockResolvedValue({ _id: 'leaveId' });

        await createLateArrivalLeave(corporateUser, employeeId, date);

        expect(existingBalance.leavePolicies[0].availableLeave).toBe(9.5);
        expect(existingBalance.save).toHaveBeenCalled();
    });

    it('should push a new policy entry when the existing balance doc has no matching component yet', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const date = new Date('2023-07-10T09:45:00');

        const annualComponent = {
            _id: 'annualComponentId',
            maximumNumberOfLeaves: 12,
            carryOverBalance: 3
        };
        LeaveComponent.findOne.mockResolvedValueOnce(annualComponent);

        const existingBalance = {
            leavePolicies: [
                { leaveComponent: { toString: () => 'someOtherComponentId' }, availableLeave: 4, carryOverBalance: 0 }
            ],
            save: jest.fn().mockResolvedValue(true)
        };
        EmployeeLeaveBalance.findOne.mockResolvedValue(existingBalance);

        LeaveApplication.create.mockResolvedValue({ _id: 'leaveId' });

        await createLateArrivalLeave(corporateUser, employeeId, date);

        expect(existingBalance.leavePolicies).toHaveLength(2);
        expect(existingBalance.leavePolicies[1]).toEqual({
            leaveComponent: annualComponent._id,
            availableLeave: 11.5,
            carryOverBalance: 3
        });
        expect(existingBalance.save).toHaveBeenCalled();
    });

    it('should fall back to the global Annual Leave component when no employee-specific one exists', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const date = new Date('2023-07-10T09:45:00');

        const globalComponent = {
            _id: 'globalComponentId',
            maximumNumberOfLeaves: 12,
            carryOverBalance: 0
        };
        LeaveComponent.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(globalComponent);
        EmployeeLeaveBalance.findOne.mockResolvedValue(null);
        EmployeeLeaveBalance.prototype.save = jest.fn().mockResolvedValue(true);
        LeaveApplication.create.mockResolvedValue({ _id: 'leaveId' });

        await createLateArrivalLeave(corporateUser, employeeId, date);

        expect(LeaveComponent.findOne).toHaveBeenNthCalledWith(2, {
            corporateUser,
            leaveType: 'Annual Leave',
            isGlobal: true,
            employee: null
        });
        expect(LeaveApplication.create).toHaveBeenCalledWith(
            expect.objectContaining({ typeOfLeave: globalComponent._id })
        );
    });

    it('should propagate the underlying error on DB failure (no wrapping)', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const date = new Date('2023-07-10T09:45:00');
        const errorMessage = 'Database error';

        LeaveComponent.findOne.mockRejectedValue(new Error(errorMessage));

        await expect(createLateArrivalLeave(corporateUser, employeeId, date))
            .rejects.toThrow(errorMessage);
    });
});
