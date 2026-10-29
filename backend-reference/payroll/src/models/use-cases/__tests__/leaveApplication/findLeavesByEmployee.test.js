const { findLeavesByEmployee } = require('../../../use-cases/leaveApplication');
const LeaveApplication = require('../../../entities/leaveApplication');

jest.mock('../../../entities/leaveApplication');

describe('findLeavesByEmployee Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockFindChain = (resolvedRecords) => {
        const limit = jest.fn().mockResolvedValue(resolvedRecords);
        const skip = jest.fn().mockReturnValue({ limit });
        const sort = jest.fn().mockReturnValue({ skip });
        const populate = jest.fn().mockReturnValue({ sort });
        LeaveApplication.find.mockReturnValue({ populate });
        return { populate, sort, skip, limit };
    };

    it('should scope the query to the requesting employee only, excluding late-arrival deductions, when no date range is given, using default pagination', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const leaves = [{ _id: 'leave1' }];

        const { populate, sort, skip, limit } = mockFindChain(leaves);
        LeaveApplication.countDocuments.mockResolvedValue(1);

        const result = await findLeavesByEmployee(corporateUser, employeeId);

        const expectedQuery = {
            corporateUser,
            employee: employeeId,
            isLateArrivalDeduction: { $ne: true }
        };
        expect(LeaveApplication.find).toHaveBeenCalledWith(expectedQuery);
        expect(LeaveApplication.countDocuments).toHaveBeenCalledWith(expectedQuery);
        expect(populate).toHaveBeenCalledWith('typeOfLeave', 'leaveType');
        expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
        expect(skip).toHaveBeenCalledWith(0);
        expect(limit).toHaveBeenCalledWith(10);
        expect(result).toEqual({ records: leaves, total: 1 });
    });

    it('should apply from/to date-range filters on start when provided', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const from = new Date('2023-07-01');
        const to = new Date('2023-07-31');

        mockFindChain([]);
        LeaveApplication.countDocuments.mockResolvedValue(0);

        await findLeavesByEmployee(corporateUser, employeeId, { from, to });

        expect(LeaveApplication.find).toHaveBeenCalledWith({
            corporateUser,
            employee: employeeId,
            isLateArrivalDeduction: { $ne: true },
            start: { $gte: from, $lte: to }
        });
    });

    it('should only set the provided bound when only "from" is given', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const from = new Date('2023-07-01');

        mockFindChain([]);
        LeaveApplication.countDocuments.mockResolvedValue(0);

        await findLeavesByEmployee(corporateUser, employeeId, { from });

        expect(LeaveApplication.find).toHaveBeenCalledWith({
            corporateUser,
            employee: employeeId,
            isLateArrivalDeduction: { $ne: true },
            start: { $gte: from }
        });
    });

    it('should filter by status and apply custom pagination when provided', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';

        const { skip, limit } = mockFindChain([]);
        LeaveApplication.countDocuments.mockResolvedValue(0);

        await findLeavesByEmployee(corporateUser, employeeId, { status: 'approved', page: 2, limit: 5 });

        expect(LeaveApplication.find).toHaveBeenCalledWith({
            corporateUser,
            employee: employeeId,
            isLateArrivalDeduction: { $ne: true },
            status: 'approved',
        });
        expect(skip).toHaveBeenCalledWith(5); // (page 2 - 1) * limit 5
        expect(limit).toHaveBeenCalledWith(5);
    });

    it('should throw a wrapped error on DB failure', async () => {
        const corporateUser = 'corporateUserID';
        const employeeId = 'employeeId';
        const errorMessage = 'Database error';

        LeaveApplication.find.mockImplementation(() => {
            throw new Error(errorMessage);
        });
        LeaveApplication.countDocuments.mockResolvedValue(0);

        await expect(findLeavesByEmployee(corporateUser, employeeId))
            .rejects.toThrow(`Failed to fetch leave applications: ${errorMessage}`);
    });
});
