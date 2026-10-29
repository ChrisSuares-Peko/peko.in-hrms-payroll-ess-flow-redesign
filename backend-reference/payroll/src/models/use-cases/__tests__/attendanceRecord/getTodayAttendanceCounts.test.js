const { getTodayAttendanceCounts } = require('../../attendanceRecord');
const AttendanceRecord = require('../../../entities/attendanceRecord');
const Employee = require('../../../entities/employee');
const LeaveApplication = require('../../../entities/leaveApplication');
const OrganizationSettings = require('../../../entities/organizationSettings');
const holiyDay = require('../../holiyDay');

jest.mock('../../../entities/attendanceRecord', () => ({
    find: jest.fn(),
}));
jest.mock('../../../entities/employee', () => ({
    find: jest.fn(),
}));
jest.mock('../../../entities/leaveApplication', () => ({
    find: jest.fn(),
}));
jest.mock('../../../entities/organizationSettings', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../holiyDay', () => ({
    getHolidaysInARange: jest.fn(),
}));

describe('getTodayAttendanceCounts Use-Case', () => {
    const corporateUser = 'corporateUserId';
    const fixedNow = new Date('2026-07-16T10:30:00'); // Thursday

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(fixedNow);
        OrganizationSettings.findOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
        holiyDay.getHolidaysInARange.mockResolvedValue([]);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const dayBounds = () => {
        const dayStart = new Date(fixedNow); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(fixedNow); dayEnd.setHours(23, 59, 59, 999);
        return { dayStart, dayEnd };
    };

    it('should bucket active employees into present/late/absent/onLeave based on today\'s record or leave', async () => {
        const employees = [
            { _id: 'emp-late' },
            { _id: 'emp-present' },
            { _id: 'emp-onleave' },
            { _id: 'emp-absent' },
        ];
        Employee.find.mockReturnValue({ select: jest.fn().mockResolvedValue(employees) });

        const records = [
            { employee: 'emp-late', status: 'late', checkIn: { time: '2026-07-16T09:45:00' } },
            { employee: 'emp-present', status: 'present', checkIn: { time: '2026-07-16T09:00:00' } },
        ];
        const leaves = [{ employee: 'emp-onleave' }];

        AttendanceRecord.find.mockReturnValue({ select: jest.fn().mockResolvedValue(records) });
        LeaveApplication.find.mockReturnValue({ select: jest.fn().mockResolvedValue(leaves) });

        const result = await getTodayAttendanceCounts(corporateUser);

        const { dayStart, dayEnd } = dayBounds();
        expect(Employee.find).toHaveBeenCalledWith({
            corporateUser,
            $or: [
                { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'INPROBATION', 'CONFIRMED'] } },
                { 'employeeInformation.employeeStatus': 'RESIGNED', 'offBoardingInformation.lastWorkingDay': { $gte: fixedNow } },
            ],
            isEmployeeDeleted: false,
        });
        expect(AttendanceRecord.find).toHaveBeenCalledWith({
            corporateUser,
            employee: { $in: ['emp-late', 'emp-present', 'emp-onleave', 'emp-absent'] },
            date: { $gte: dayStart, $lte: dayEnd },
        });
        expect(LeaveApplication.find).toHaveBeenCalledWith({
            corporateUser,
            employee: { $in: ['emp-late', 'emp-present', 'emp-onleave', 'emp-absent'] },
            status: 'approved',
            start: { $lte: dayEnd },
            end: { $gte: dayStart },
        });

        expect(result).toEqual({ present: 1, late: 1, absent: 1, onLeave: 1 });
    });

    it('should treat an employee with a record but no checkIn.time as not-present, falling back to leave/absent', async () => {
        const employees = [{ _id: 'emp-noshow-onleave' }, { _id: 'emp-noshow-absent' }];
        Employee.find.mockReturnValue({ select: jest.fn().mockResolvedValue(employees) });

        // Record exists (e.g. a manually created "absent" row) but has no checkIn.time.
        const records = [{ employee: 'emp-noshow-onleave', status: 'absent', checkIn: undefined }];
        const leaves = [{ employee: 'emp-noshow-onleave' }];

        AttendanceRecord.find.mockReturnValue({ select: jest.fn().mockResolvedValue(records) });
        LeaveApplication.find.mockReturnValue({ select: jest.fn().mockResolvedValue(leaves) });

        const result = await getTodayAttendanceCounts(corporateUser);

        expect(result).toEqual({ present: 0, late: 0, absent: 1, onLeave: 1 });
    });

    it('should return all zeros when there are no active employees', async () => {
        Employee.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
        AttendanceRecord.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
        LeaveApplication.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });

        const result = await getTodayAttendanceCounts(corporateUser);

        expect(result).toEqual({ present: 0, late: 0, absent: 0, onLeave: 0 });
    });

    it('should not mark anyone absent when today is a declared company holiday', async () => {
        const employees = [{ _id: 'emp-present' }, { _id: 'emp-noshow' }];
        Employee.find.mockReturnValue({ select: jest.fn().mockResolvedValue(employees) });

        const records = [{ employee: 'emp-present', status: 'present', checkIn: { time: '2026-07-16T09:00:00' } }];
        AttendanceRecord.find.mockReturnValue({ select: jest.fn().mockResolvedValue(records) });
        LeaveApplication.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
        const { dayStart, dayEnd } = dayBounds();
        holiyDay.getHolidaysInARange.mockResolvedValue([{ start: dayStart, end: dayEnd }]);

        const result = await getTodayAttendanceCounts(corporateUser);

        expect(result).toEqual({ present: 1, late: 0, absent: 0, onLeave: 0 });
    });

    it('should not mark anyone absent when today is a non-working weekend day', async () => {
        // Sun 2026-07-19 — not a working day under the default Mon-Fri set.
        jest.setSystemTime(new Date('2026-07-19T10:30:00'));
        Employee.find.mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: 'emp-noshow' }]) });
        AttendanceRecord.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
        LeaveApplication.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });

        const result = await getTodayAttendanceCounts(corporateUser);

        expect(result).toEqual({ present: 0, late: 0, absent: 0, onLeave: 0 });
    });

    it('should throw a wrapped error when a DB call fails', async () => {
        Employee.find.mockReturnValue({ select: jest.fn().mockRejectedValue(new Error('DB failure')) });

        await expect(getTodayAttendanceCounts(corporateUser)).rejects.toThrow(
            'Failed to compute today attendance counts: DB failure'
        );
    });
});
