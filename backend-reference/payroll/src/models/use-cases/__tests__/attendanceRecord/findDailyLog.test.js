// NOTE: `findDailyLog` in src/models/use-cases/attendanceRecord.js scopes to
// currently-active employees (excluding SUSPENDED, and RESIGNED past their last
// working day) before querying AttendanceRecord, so a status change takes effect
// here immediately — real records aren't deleted when an employee is later
// suspended/offboarded. Virtual absent/on-leave synthesis and local/UTC date-key
// merging still live entirely in the controller's `getDailyLog` handler
// (src/controller/attendanceRecord.js), which calls this use-case for the raw
// records and builds the virtual entries itself.

const { findDailyLog } = require('../../attendanceRecord');
const AttendanceRecord = require('../../../entities/attendanceRecord');
const Employee = require('../../../entities/employee');

jest.mock('../../../entities/attendanceRecord', () => ({
    find: jest.fn(),
    countDocuments: jest.fn(),
}));
jest.mock('../../../entities/employee', () => ({
    find: jest.fn(),
}));

describe('findDailyLog Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-07-31T12:00:00'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const mockActiveEmployees = (ids) => {
        Employee.find.mockReturnValue({ select: jest.fn().mockResolvedValue(ids.map(_id => ({ _id }))) });
    };

    const mockFindChain = (resolvedRecords) => {
        const sort = jest.fn().mockReturnThis();
        const skip = jest.fn().mockReturnThis();
        const limit = jest.fn().mockResolvedValue(resolvedRecords);
        AttendanceRecord.find.mockReturnValue({ sort, skip, limit });
        return { sort, skip, limit };
    };

    it('should query by corporateUser and active employees only, using default pagination when no filters are given', async () => {
        mockActiveEmployees(['emp1', 'emp2']);
        const records = [{ _id: 'r1' }];
        const { sort, skip, limit } = mockFindChain(records);
        AttendanceRecord.countDocuments.mockResolvedValue(1);

        const result = await findDailyLog('corp1', {});

        expect(Employee.find).toHaveBeenCalledWith({
            corporateUser: 'corp1',
            isEmployeeDeleted: false,
            $or: [
                { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'INPROBATION', 'CONFIRMED'] } },
                { 'employeeInformation.employeeStatus': 'RESIGNED', 'offBoardingInformation.lastWorkingDay': { $gte: new Date('2026-07-31T12:00:00') } },
            ],
        });
        const expectedQuery = { corporateUser: 'corp1', employee: { $in: ['emp1', 'emp2'] } };
        expect(AttendanceRecord.find).toHaveBeenCalledWith(expectedQuery);
        expect(sort).toHaveBeenCalledWith({ date: -1 });
        expect(skip).toHaveBeenCalledWith(0);
        expect(limit).toHaveBeenCalledWith(30);
        expect(AttendanceRecord.countDocuments).toHaveBeenCalledWith(expectedQuery);
        expect(result).toEqual({ records, total: 1 });
    });

    it('should scope the active-employee lookup to the given employeeIds, and apply from/to/status filters and custom pagination', async () => {
        const employeeIds = ['emp1', 'emp2'];
        mockActiveEmployees(['emp1']); // emp2 turns out to be suspended
        const records = [{ _id: 'r2' }];
        const { skip, limit } = mockFindChain(records);
        AttendanceRecord.countDocuments.mockResolvedValue(1);

        const from = new Date('2026-07-01');
        const to = new Date('2026-07-31');

        const result = await findDailyLog('corp1', { from, to, employeeIds, status: 'late', page: 2, limit: 10 });

        expect(Employee.find).toHaveBeenCalledWith(expect.objectContaining({ _id: { $in: employeeIds } }));
        const expectedQuery = {
            corporateUser: 'corp1',
            employee: { $in: ['emp1'] },
            date: { $gte: from, $lte: to },
            status: 'late',
        };
        expect(AttendanceRecord.find).toHaveBeenCalledWith(expectedQuery);
        expect(AttendanceRecord.countDocuments).toHaveBeenCalledWith(expectedQuery);
        expect(skip).toHaveBeenCalledWith(10); // (page 2 - 1) * limit 10
        expect(limit).toHaveBeenCalledWith(10);
        expect(result).toEqual({ records, total: 1 });
    });

    it('should apply only a $gte date bound when only `from` is provided', async () => {
        mockActiveEmployees([]);
        mockFindChain([]);
        AttendanceRecord.countDocuments.mockResolvedValue(0);
        const from = new Date('2026-07-01');

        await findDailyLog('corp1', { from });

        expect(AttendanceRecord.find).toHaveBeenCalledWith({ corporateUser: 'corp1', employee: { $in: [] }, date: { $gte: from } });
    });

    it('should apply only a $lte date bound when only `to` is provided', async () => {
        mockActiveEmployees([]);
        mockFindChain([]);
        AttendanceRecord.countDocuments.mockResolvedValue(0);
        const to = new Date('2026-07-31');

        await findDailyLog('corp1', { to });

        expect(AttendanceRecord.find).toHaveBeenCalledWith({ corporateUser: 'corp1', employee: { $in: [] }, date: { $lte: to } });
    });

    it('should throw a wrapped error when the DB call fails', async () => {
        mockActiveEmployees([]);
        const sort = jest.fn().mockReturnThis();
        const skip = jest.fn().mockReturnThis();
        const limit = jest.fn().mockRejectedValue(new Error('DB failure'));
        AttendanceRecord.find.mockReturnValue({ sort, skip, limit });
        AttendanceRecord.countDocuments.mockResolvedValue(0);

        await expect(findDailyLog('corp1', {})).rejects.toThrow('Failed to fetch daily log: DB failure');
    });
});
