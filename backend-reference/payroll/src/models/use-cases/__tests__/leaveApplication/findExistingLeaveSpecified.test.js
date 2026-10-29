const { findExistingLeaveSpecified } = require('../../../use-cases/leaveApplication');
const LeaveApplication = require('../../../entities/leaveApplication');

jest.mock('../../../entities/leaveApplication');

describe('findExistingLeaveSpecified Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    it('should find an existing leave that matches the criteria', async () => {
        const leaveId = 'leaveId';
        const corporateUserID = 'corporateUserID';
        const employeeId = 'employeeId';
        const start = new Date('2023-07-01');
        const end = new Date('2023-07-10');

        const expectedLeave = {
            _id: 'otherLeaveId',
            corporateUser: corporateUserID,
            employee: employeeId,
            start: new Date('2023-07-15'),
            end: new Date('2023-07-20')
        };

        LeaveApplication.findOne.mockResolvedValue(expectedLeave);

        const result = await findExistingLeaveSpecified(leaveId, corporateUserID, employeeId, start, end);

        expect(LeaveApplication.findOne).toHaveBeenCalledWith({
            _id: { $ne: leaveId },
            corporateUser: corporateUserID,
            employee: employeeId,
            start: { $gt: end },
            end: { $lt: start }
        });

        expect(result).toEqual(expectedLeave);
    });

    it('should handle errors gracefully', async () => {
        const leaveId = 'leaveId';
        const corporateUserID = 'corporateUserID';
        const employeeId = 'employeeId';
        const start = new Date('2023-07-01');
        const end = new Date('2023-07-10');
        const errorMessage = 'Database error';

        LeaveApplication.findOne.mockRejectedValue(new Error(errorMessage));

        const result = await findExistingLeaveSpecified(leaveId, corporateUserID, employeeId, start, end);

        expect(result.message).toEqual(errorMessage);
    });
});
