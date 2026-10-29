const { createUserLeaveApplication } = require('../../../use-cases/leaveApplication');
const LeaveApplication = require('../../../entities/leaveApplication');

jest.mock('../../../entities/leaveApplication');

describe('createUserLeaveApplication Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a paid leave application scoped to the corporate user and employee, with status "applied"', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const leaveData = {
            start: new Date('2023-07-01'),
            end: new Date('2023-07-02'),
            leaveCount: 2,
            typeOfLeave: 'leaveTypeId',
            isUnpaidLeave: false,
            halfDaySelection: null,
            notes: 'Family function'
        };

        const created = { _id: 'leaveId', ...leaveData, corporateUser, employee: employeeId, status: 'applied' };
        LeaveApplication.create.mockResolvedValue(created);

        const result = await createUserLeaveApplication(corporateUser, employeeId, leaveData);

        expect(LeaveApplication.create).toHaveBeenCalledWith({
            corporateUser,
            employee: employeeId,
            start: leaveData.start,
            end: leaveData.end,
            leaveCount: leaveData.leaveCount,
            typeOfLeave: leaveData.typeOfLeave,
            isUnpaidLeave: false,
            halfDaySelection: leaveData.halfDaySelection,
            notes: leaveData.notes,
            status: 'applied'
        });
        expect(result).toEqual(created);
    });

    it('should omit typeOfLeave and set isUnpaidLeave true for unpaid leave', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const leaveData = {
            start: new Date('2023-07-01'),
            end: new Date('2023-07-02'),
            leaveCount: 2,
            typeOfLeave: 'leaveTypeId',
            isUnpaidLeave: true,
            halfDaySelection: null,
            notes: ''
        };

        LeaveApplication.create.mockResolvedValue({ _id: 'leaveId' });

        await createUserLeaveApplication(corporateUser, employeeId, leaveData);

        expect(LeaveApplication.create).toHaveBeenCalledWith(
            expect.objectContaining({
                typeOfLeave: undefined,
                isUnpaidLeave: true
            })
        );
    });

    it('should throw a wrapped error on DB failure', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const leaveData = {
            start: new Date('2023-07-01'),
            end: new Date('2023-07-02'),
            leaveCount: 2,
            typeOfLeave: 'leaveTypeId'
        };
        const errorMessage = 'Database error';

        LeaveApplication.create.mockRejectedValue(new Error(errorMessage));

        await expect(createUserLeaveApplication(corporateUser, employeeId, leaveData))
            .rejects.toThrow(`Failed to submit leave application: ${errorMessage}`);
    });
});
