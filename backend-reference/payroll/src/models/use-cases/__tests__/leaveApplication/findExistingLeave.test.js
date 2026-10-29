const { findExistingLeave } = require('../../../use-cases/leaveApplication');
const LeaveApplication = require('../../../entities/leaveApplication');

jest.mock('../../../entities/leaveApplication');

describe('findExistingLeave Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    it('should return the existing leave for the given parameters', async () => {
        const corporateUserID = 'corporateUserID';
        const employeeId = 'employeeId';
        const start = new Date('2023-07-01');
        const end = new Date('2023-07-10');

        const existingLeave = {
            _id: 'leaveId',
            corporateUser: corporateUserID,
            employee: employeeId,
            start,
            end
        };

        LeaveApplication.findOne.mockResolvedValue(existingLeave);

        const result = await findExistingLeave(corporateUserID, employeeId, start, end);

        expect(LeaveApplication.findOne).toHaveBeenCalledWith({
            corporateUser: corporateUserID,
            employee: employeeId,
            start: { $lte: end },
            end: { $gte: start },
            status: { $nin: ['rejected', 'cancelledByEmployee'] }
        });

        expect(result).toEqual(existingLeave);
    });

    it('should handle errors gracefully', async () => {
        const corporateUserID = 'corporateUserID';
        const employeeId = 'employeeId';
        const start = new Date('2023-07-01');
        const end = new Date('2023-07-10');
        const errorMessage = 'Database error';

        LeaveApplication.findOne.mockRejectedValue(new Error(errorMessage));

        const result = await findExistingLeave(corporateUserID, employeeId, start, end);

        expect(result.message).toEqual(errorMessage);
    });
});
