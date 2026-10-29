const { getExcelLeaveDetails } = require('../../../use-cases/leaveApplication');
const LeaveApplication = require('../../../entities/leaveApplication');
const EmployeeLeaveBalance = require('../../../entities/leaveBalance');
const LeaveComponent = require('../../../entities/leaveComponent');

jest.mock('../../../entities/leaveApplication');
jest.mock('../../../entities/leaveBalance');
jest.mock('../../../entities/leaveComponent');

describe('getExcelLeaveDetails Use-case', () => {
    const mockSelectLean = (value) => ({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }) });

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
        LeaveComponent.findById.mockReturnValue(mockSelectLean(null));
    });

    it('excludes applied/rejected/cancelledByEmployee leaves, matching the Leaves tab (getAllLeaves)', async () => {
        const params = {
            corporateUserID: 'corporateUserID',
            year: '2026',
            month: '7',
        };

        LeaveApplication.aggregate.mockResolvedValue([]);

        await getExcelLeaveDetails(params);

        expect(LeaveApplication.aggregate).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    $match: expect.objectContaining({
                        corporateUser: params.corporateUserID,
                        status: { $nin: ['applied', 'rejected', 'cancelledByEmployee'] },
                    }),
                }),
            ])
        );
    });

    it('filters out leaves belonging to a deleted employee', async () => {
        const params = { corporateUserID: 'corporateUserID', year: '2026', month: '7' };

        LeaveApplication.aggregate.mockResolvedValue([
            { employee: { _id: 'emp1', isEmployeeDeleted: false }, typeOfLeave: { _id: 'type1' }, start: new Date('2026-07-10'), leaveCount: 1 },
            { employee: { _id: 'emp2', isEmployeeDeleted: true }, typeOfLeave: { _id: 'type1' }, start: new Date('2026-07-11'), leaveCount: 1 },
        ]);
        EmployeeLeaveBalance.findOne.mockResolvedValue(null);

        const result = await getExcelLeaveDetails(params);

        expect(result).toHaveLength(1);
        expect(result[0].employee._id).toBe('emp1');
    });

    it('falls back to the LeaveComponent allowance when EmployeeLeaveBalance has no matching policy (e.g. an ESS-only leave type)', async () => {
        const params = { corporateUserID: 'corporateUserID', year: '2026', month: '7' };

        LeaveApplication.aggregate
            .mockResolvedValueOnce([
                { employee: { _id: 'emp1', isEmployeeDeleted: false }, typeOfLeave: { _id: 'sickLeaveType', leaveType: 'Sick Leave' }, start: new Date('2026-07-10'), leaveCount: 1 },
            ])
            .mockResolvedValueOnce([{ _id: null, totalUsedBefore: 2 }]);
        // Balance doc exists but only has a policy for a different leave type (Annual Leave).
        EmployeeLeaveBalance.findOne.mockResolvedValue({
            leavePolicies: [{ leaveComponent: 'annualLeaveType', availableLeave: 20 }],
        });
        LeaveComponent.findById.mockReturnValue(
            mockSelectLean({ maximumNumberOfLeaves: 12, leaveBalanceCarryover: 'ALLOWED', carryOverBalance: 3 })
        );

        const result = await getExcelLeaveDetails(params);

        // totalAllowance = 12 + 3 (carryover) = 15; leaveBalance = 15 - usedBefore(2) = 13
        expect(result[0].leaveBalance).toBe(13);
    });

    it('leaves the balance null when neither EmployeeLeaveBalance nor LeaveComponent has a match', async () => {
        const params = { corporateUserID: 'corporateUserID', year: '2026', month: '7' };

        LeaveApplication.aggregate.mockResolvedValueOnce([
            { employee: { _id: 'emp1', isEmployeeDeleted: false }, typeOfLeave: { _id: 'unknownType' }, start: new Date('2026-07-10'), leaveCount: 1 },
        ]);
        EmployeeLeaveBalance.findOne.mockResolvedValue(null);
        LeaveComponent.findById.mockReturnValue(mockSelectLean(null));

        const result = await getExcelLeaveDetails(params);

        expect(result[0].leaveBalance).toBeNull();
    });

    it('returns an error object when the aggregation fails', async () => {
        const params = { corporateUserID: 'corporateUserID', year: '2026', month: '7' };
        LeaveApplication.aggregate.mockRejectedValue(new Error('Database error'));

        const result = await getExcelLeaveDetails(params);

        expect(result.message).toEqual('Database error');
    });
});
