const { getLeavesForEmployee } = require('../../../use-cases/leaveApplication');
const LeaveApplication = require('../../../entities/leaveApplication');
const Employee = require('../../../entities/employee');
const LeaveComponent = require('../../../entities/leaveComponent');
const LeaveBalance = require('../../../entities/leaveBalance');

jest.mock('../../../entities/leaveApplication');
jest.mock('../../../entities/employee');
jest.mock('../../../entities/leaveComponent');
jest.mock('../../../entities/leaveBalance');
jest.mock('../../../use-cases/leaveBalance', () => ({
    createOrUpdateEmployeeLeaveBalance: jest.fn().mockResolvedValue(undefined)
}));

describe('getLeavesForEmployee Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    it('should return paginated leave data with employee details and total count', async () => {
        const employeeId = 'employeeId';
        const corporateUserID = 'corporateUserID';
        const page = 1;
        const limit = 10;
        const searchText = '';

        const mockEmployee = {
            personalInformation: { fullName: 'John Doe' },
            employeeInformation: { designation: 'Engineer' },
            profileImage: null
        };

        const leaveComponentId = 'leaveComponentId1';
        const mockLeaveComponent = { _id: leaveComponentId, leaveType: 'Annual Leave' };

        const mockLeave = {
            _id: 'leave1',
            typeOfLeave: leaveComponentId,
            start: new Date('2023-07-10'),
            end: new Date('2023-07-15'),
            toObject: jest.fn().mockReturnValue({
                _id: 'leave1',
                typeOfLeave: leaveComponentId,
                start: new Date('2023-07-10'),
                end: new Date('2023-07-15')
            })
        };

        const mockLeaveBalance = {
            leavePolicies: [
                {
                    leaveComponent: leaveComponentId,
                    availableLeave: 10,
                    carryOverBalance: 2
                }
            ]
        };

        Employee.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(mockEmployee)
        });
        LeaveApplication.find.mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockLeave])
        });
        LeaveComponent.find.mockResolvedValue([mockLeaveComponent]);
        LeaveBalance.findOne.mockResolvedValue(mockLeaveBalance);

        const result = await getLeavesForEmployee(employeeId, corporateUserID, page, limit, searchText);

        expect(Employee.findById).toHaveBeenCalledWith(employeeId);
        expect(LeaveApplication.find).toHaveBeenCalledWith({
            employee: employeeId,
            corporateUser: corporateUserID,
            isLateArrivalDeduction: { $ne: true }
        });
        expect(LeaveComponent.find).toHaveBeenCalledWith({ corporateUser: corporateUserID });
        expect(LeaveBalance.findOne).toHaveBeenCalledWith({ employee: employeeId });

        expect(result).toMatchObject({
            count: 1,
            employeeDetails: {
                fullName: 'John Doe',
                designation: 'Engineer',
                profileImage: null
            },
            rows: expect.arrayContaining([
                expect.objectContaining({
                    typeOfLeave: { _id: leaveComponentId, typeOfLeave: 'Annual Leave' },
                    leaveBalance: { availableLeave: 10, carryOverBalance: 2 }
                })
            ])
        });
    });

    it('should filter leaves by searchText', async () => {
        const employeeId = 'employeeId';
        const corporateUserID = 'corporateUserID';
        const page = 1;
        const limit = 10;
        const searchText = 'annual';

        const mockEmployee = {
            personalInformation: { fullName: 'Jane Doe' },
            employeeInformation: { designation: 'Designer' },
            profileImage: null
        };

        const annualComponentId = 'annualId';
        const sickComponentId = 'sickId';

        const mockLeaveComponents = [
            { _id: annualComponentId, leaveType: 'Annual Leave' },
            { _id: sickComponentId, leaveType: 'Sick Leave' }
        ];

        const mockLeaves = [
            {
                _id: 'leave1',
                typeOfLeave: annualComponentId,
                toObject: jest.fn().mockReturnValue({ _id: 'leave1', typeOfLeave: annualComponentId })
            },
            {
                _id: 'leave2',
                typeOfLeave: sickComponentId,
                toObject: jest.fn().mockReturnValue({ _id: 'leave2', typeOfLeave: sickComponentId })
            }
        ];

        Employee.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockEmployee) });
        LeaveApplication.find.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockLeaves) });
        LeaveComponent.find.mockResolvedValue(mockLeaveComponents);
        LeaveBalance.findOne.mockResolvedValue(null);

        const result = await getLeavesForEmployee(employeeId, corporateUserID, page, limit, searchText);

        expect(result.count).toBe(1);
        expect(result.rows[0].typeOfLeave.typeOfLeave).toBe('Annual Leave');
    });

    it('should handle errors gracefully', async () => {
        const employeeId = 'employeeId';
        const corporateUserID = 'corporateUserID';
        const mockError = new Error('Database error');

        Employee.findById.mockReturnValue({
            select: jest.fn().mockRejectedValue(mockError)
        });

        console.log = jest.fn();

        const result = await getLeavesForEmployee(employeeId, corporateUserID, 1, 10, '');

        expect(result.message).toEqual('Database error');
    });
});
