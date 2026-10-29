const { getAvailableLeavesForEmployee } = require('../../../use-cases/leaveApplication');
const LeaveApplication = require('../../../entities/leaveApplication');
const LeaveComponent = require('../../../entities/leaveComponent');
const { ObjectId } = require('mongoose').Types;

jest.mock('../../../entities/leaveApplication');
jest.mock('../../../entities/leaveComponent');

describe('getAvailableLeavesForEmployee Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should compute remaining balance per leave component (minus used) plus an Unpaid Leave entry', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = new ObjectId().toString();

        const annualComponentId = new ObjectId();
        const sickComponentId = new ObjectId();

        const components = [
            {
                _id: annualComponentId,
                leaveType: 'Annual Leave',
                maximumNumberOfLeaves: 12,
                leaveBalanceCarryover: 'NOT_ALLOWED',
                carryOverBalance: 0
            },
            {
                _id: sickComponentId,
                leaveType: 'Sick Leave',
                maximumNumberOfLeaves: 6,
                leaveBalanceCarryover: 'ALLOWED',
                carryOverBalance: 2
            }
        ];

        LeaveComponent.find
            .mockReturnValueOnce({ distinct: jest.fn().mockResolvedValue([]) })
            .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(components) });

        LeaveApplication.aggregate.mockResolvedValue([
            { _id: annualComponentId, leaveCount: 3 }
        ]);

        const result = await getAvailableLeavesForEmployee(corporateUser, employeeId);

        expect(LeaveComponent.find).toHaveBeenNthCalledWith(1, {
            corporateUser,
            employee: employeeId,
            isGlobal: false,
            globalComponentId: { $ne: null }
        });

        expect(LeaveComponent.find).toHaveBeenNthCalledWith(2, {
            corporateUser,
            $or: [
                { isGlobal: false, globalComponentId: null, employee: employeeId },
                { isGlobal: false, globalComponentId: { $in: [] }, employee: employeeId },
                { isGlobal: true, _id: { $nin: [] }, globalComponentId: null }
            ]
        });

        expect(LeaveApplication.aggregate).toHaveBeenCalledWith([
            {
                $match: {
                    corporateUser,
                    employee: new ObjectId(employeeId),
                    typeOfLeave: { $in: [annualComponentId, sickComponentId] },
                    status: { $nin: ['applied', 'rejected', 'cancelledByEmployee'] }
                }
            },
            { $group: { _id: '$typeOfLeave', leaveCount: { $sum: '$leaveCount' } } }
        ]);

        expect(result).toEqual([
            { value: annualComponentId.toString(), label: 'Annual Leave', count: 9 },
            { value: sickComponentId.toString(), label: 'Sick Leave', count: 8 },
            { value: 'UNPAID', label: 'Unpaid Leave', count: 'Available' }
        ]);
    });

    it('should floor remaining balance at 0 when usage exceeds the allowance', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = new ObjectId().toString();
        const componentId = new ObjectId();

        const components = [
            {
                _id: componentId,
                leaveType: 'Annual Leave',
                maximumNumberOfLeaves: 5,
                leaveBalanceCarryover: 'NOT_ALLOWED',
                carryOverBalance: 0
            }
        ];

        LeaveComponent.find
            .mockReturnValueOnce({ distinct: jest.fn().mockResolvedValue([]) })
            .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(components) });

        LeaveApplication.aggregate.mockResolvedValue([
            { _id: componentId, leaveCount: 8 }
        ]);

        const result = await getAvailableLeavesForEmployee(corporateUser, employeeId);

        expect(result).toEqual([
            { value: componentId.toString(), label: 'Annual Leave', count: 0 },
            { value: 'UNPAID', label: 'Unpaid Leave', count: 'Available' }
        ]);
    });

    it('should throw a wrapped error on DB failure', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = new ObjectId().toString();
        const errorMessage = 'Database error';

        LeaveComponent.find.mockReturnValueOnce({
            distinct: jest.fn().mockRejectedValue(new Error(errorMessage))
        });

        await expect(getAvailableLeavesForEmployee(corporateUser, employeeId))
            .rejects.toThrow(`Failed to fetch available leaves: ${errorMessage}`);
    });
});
