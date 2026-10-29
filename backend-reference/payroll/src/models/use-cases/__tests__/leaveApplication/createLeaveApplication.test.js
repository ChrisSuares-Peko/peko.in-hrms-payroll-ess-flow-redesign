const { createLeaveApplication } = require('../../../use-cases/leaveApplication');
const LeaveApplication = require('../../../entities/leaveApplication');
const LeaveComponent = require('../../../entities/leaveComponent');

jest.mock('../../../entities/leaveApplication');
jest.mock('../../../entities/leaveComponent');

describe('createLeaveApplication Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create and save a new leave application', async () => {
        const params = {
            corporateUser: 'corporateUserID',
            employee: 'employeeId',
            start: new Date('2023-07-01'),
            end: new Date('2023-07-10'),
            leaveCount: 5,
            typeOfLeave: 'leaveTypeId',
            halfDaySelection: null
        };

        const mockLeaveComponent = {
            _id: 'leaveTypeId',
            maximumNumberOfLeaves: 20,
            leaveBalanceCarryover: 'NOT_ALLOWED'
        };

        const savedLeave = { ...params, _id: 'leaveId' };

        LeaveApplication.findOne.mockResolvedValue(null);
        LeaveComponent.findOne.mockResolvedValue(mockLeaveComponent);
        LeaveApplication.prototype.save = jest.fn().mockResolvedValue(savedLeave);

        const result = await createLeaveApplication(params);

        expect(LeaveApplication.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ employee: params.employee })
        );
        expect(LeaveComponent.findOne).toHaveBeenCalledWith({
            corporateUser: params.corporateUser,
            _id: params.typeOfLeave
        });
        expect(result).toEqual({ status: true, data: savedLeave });
    });

    it('should return error if leave overlaps with existing leave', async () => {
        const params = {
            corporateUser: 'corporateUserID',
            employee: 'employeeId',
            start: new Date('2023-07-01'),
            end: new Date('2023-07-10'),
            leaveCount: 5,
            typeOfLeave: 'leaveTypeId'
        };

        const existingLeave = {
            start: new Date('2023-07-05'),
            end: new Date('2023-07-15')
        };

        LeaveApplication.findOne.mockResolvedValue(existingLeave);

        const result = await createLeaveApplication(params);

        expect(result.status).toBe(false);
        expect(result.message).toContain('overlaps');
    });

    it('should handle errors gracefully', async () => {
        const params = {
            corporateUser: 'corporateUserID',
            employee: 'employeeId',
            start: new Date('2023-07-01'),
            end: new Date('2023-07-10'),
            leaveCount: 5,
            typeOfLeave: 'leaveTypeId'
        };
        const errorMessage = 'Database error';

        LeaveApplication.findOne.mockRejectedValue(new Error(errorMessage));

        const result = await createLeaveApplication(params);

        expect(result.message).toEqual(errorMessage);
    });
});
