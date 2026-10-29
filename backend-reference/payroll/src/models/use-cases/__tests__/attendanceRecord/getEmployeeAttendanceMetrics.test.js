const mongoose = require('mongoose');
const { getEmployeeAttendanceMetrics } = require('../../attendanceRecord');
const AttendanceRecord = require('../../../entities/attendanceRecord');
const Overtime = require('../../../entities/overTime');
const OrganizationSettings = require('../../../entities/organizationSettings');
const LeaveApplication = require('../../../entities/leaveApplication');
const Employee = require('../../../entities/employee');
const holiyDay = require('../../holiyDay');

jest.mock('../../../entities/attendanceRecord', () => ({
    aggregate: jest.fn(),
}));
jest.mock('../../../entities/overTime', () => ({
    aggregate: jest.fn(),
}));
jest.mock('../../../entities/organizationSettings', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/leaveApplication', () => ({
    find: jest.fn(),
}));
jest.mock('../../../entities/employee', () => ({
    findById: jest.fn(),
}));
jest.mock('../../holiyDay', () => ({
    getHolidaysInARange: jest.fn(),
}));

describe('getEmployeeAttendanceMetrics Use-Case', () => {
    const corporateUser = 'corporateUserId';
    const employeeId = '507f1f77bcf86cd799439011';

    // Fix "now" so workingDaysElapsed / rangeEnd are deterministic regardless of when the suite runs.
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-07-15T12:00:00'));
        Employee.findById.mockReturnValue({
            select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
        });
        holiyDay.getHolidaysInARange.mockResolvedValue([]);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const mockSelectLean = (value) => ({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }) });
    const mockFindSelectLean = (value) => ({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }) });

    it('should compute present/late/absent/onLeave/otHours using the default Mon-Fri working days when OrganizationSettings is missing', async () => {
        const monthStart = new Date('2026-07-01T00:00:00');
        const monthEnd = new Date('2026-07-31T23:59:59.999');

        AttendanceRecord.aggregate.mockResolvedValue([{ _id: null, present: 6, late: 1 }]);
        Overtime.aggregate.mockResolvedValue([{ _id: null, totalOtHours: 5 }]);
        OrganizationSettings.findOne.mockReturnValue(mockSelectLean(null));
        // Overlaps working days Fri 7/10 and Mon 7/13 under Mon-Fri (Sat/Sun excluded) => onLeave = 2
        LeaveApplication.find.mockReturnValue(
            mockFindSelectLean([{ start: new Date('2026-07-10T00:00:00'), end: new Date('2026-07-13T00:00:00') }])
        );

        const result = await getEmployeeAttendanceMetrics(corporateUser, employeeId, monthStart, monthEnd);

        const employeeOid = new mongoose.Types.ObjectId(employeeId);
        expect(AttendanceRecord.aggregate).toHaveBeenCalledWith([
            {
                $match: {
                    corporateUser,
                    employee: employeeOid,
                    date: { $gte: monthStart, $lte: monthEnd },
                },
            },
            {
                $group: {
                    _id: null,
                    present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                    late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
                },
            },
        ]);
        expect(Overtime.aggregate).toHaveBeenCalledWith([
            {
                $match: {
                    corporateUser,
                    employee: employeeOid,
                    status: 'approved',
                    overTimeDate: { $gte: monthStart, $lte: monthEnd },
                },
            },
            { $group: { _id: null, totalOtHours: { $sum: '$extraHours' } } },
        ]);
        expect(OrganizationSettings.findOne).toHaveBeenCalledWith({ corporateUser });
        expect(LeaveApplication.find).toHaveBeenCalledWith({
            corporateUser,
            employee: employeeOid,
            status: 'approved',
            start: { $lte: monthEnd },
            end: { $gte: monthStart },
        });

        // workingDaysElapsed (Mon-Fri, July 1 -> July 15 2026) = 11
        // absent = max(0, 11 - present(6) - late(1) - onLeave(2)) = 2
        expect(result).toEqual({ present: 6, late: 1, absent: 2, onLeave: 2, otHours: 5 });
    });

    it('should use a custom selectWorkingDays from OrganizationSettings instead of the Mon-Fri default', async () => {
        const monthStart = new Date('2026-07-01T00:00:00');
        const monthEnd = new Date('2026-07-31T23:59:59.999');

        AttendanceRecord.aggregate.mockResolvedValue([{ _id: null, present: 4, late: 0 }]);
        Overtime.aggregate.mockResolvedValue([]);
        OrganizationSettings.findOne.mockReturnValue(mockSelectLean({ payrollSettings: { selectWorkingDays: ['MON', 'TUE', 'WED'] } }));
        // Same leave range as above, but only Monday 7/13 falls in {Mon,Tue,Wed} => onLeave = 1
        LeaveApplication.find.mockReturnValue(
            mockFindSelectLean([{ start: new Date('2026-07-10T00:00:00'), end: new Date('2026-07-13T00:00:00') }])
        );

        const result = await getEmployeeAttendanceMetrics(corporateUser, employeeId, monthStart, monthEnd);

        // workingDaysElapsed (Mon-Wed only, July 1 -> July 15 2026) = 7
        // absent = max(0, 7 - present(4) - late(0) - onLeave(1)) = 2
        expect(result).toEqual({ present: 4, late: 0, absent: 2, onLeave: 1, otHours: 0 });
    });

    it('should floor absent at 0 when present + late + onLeave already meets or exceeds working days elapsed', async () => {
        const monthStart = new Date('2026-07-01T00:00:00');
        const monthEnd = new Date('2026-07-31T23:59:59.999');

        AttendanceRecord.aggregate.mockResolvedValue([{ _id: null, present: 20, late: 5 }]);
        Overtime.aggregate.mockResolvedValue([{ _id: null, totalOtHours: 2 }]);
        OrganizationSettings.findOne.mockReturnValue(mockSelectLean(null));
        LeaveApplication.find.mockReturnValue(mockFindSelectLean([]));

        const result = await getEmployeeAttendanceMetrics(corporateUser, employeeId, monthStart, monthEnd);

        expect(result).toEqual({ present: 20, late: 5, absent: 0, onLeave: 0, otHours: 2 });
    });

    it('should count working days from the employee\'s joining date, not month start, when they joined mid-month', async () => {
        const monthStart = new Date('2026-07-01T00:00:00');
        const monthEnd = new Date('2026-07-31T23:59:59.999');

        AttendanceRecord.aggregate.mockResolvedValue([{ _id: null, present: 0, late: 0 }]);
        Overtime.aggregate.mockResolvedValue([]);
        OrganizationSettings.findOne.mockReturnValue(mockSelectLean(null));
        LeaveApplication.find.mockReturnValue(mockFindSelectLean([]));
        // Joined Wed 2026-07-15 — the same day "now" is frozen at.
        Employee.findById.mockReturnValue(
            mockFindSelectLean({ employeeInformation: { dateOfJoin: new Date('2026-07-15T00:00:00') } })
        );

        const result = await getEmployeeAttendanceMetrics(corporateUser, employeeId, monthStart, monthEnd);

        // Only 2026-07-15 (Wed) itself counts as elapsed — no days from July 1-14 should be
        // treated as absent since the employee had not joined yet.
        expect(result).toEqual({ present: 0, late: 0, absent: 1, onLeave: 0, otHours: 0 });
    });

    it('should exclude a declared company holiday from both workingDaysElapsed and onLeave', async () => {
        const monthStart = new Date('2026-07-01T00:00:00');
        const monthEnd = new Date('2026-07-31T23:59:59.999');

        AttendanceRecord.aggregate.mockResolvedValue([{ _id: null, present: 6, late: 1 }]);
        Overtime.aggregate.mockResolvedValue([]);
        OrganizationSettings.findOne.mockReturnValue(mockSelectLean(null));
        // Same leave range as the first test (Fri 7/10 -> Mon 7/13, onLeave would be 2),
        // but Mon 7/13 is now also a declared holiday.
        LeaveApplication.find.mockReturnValue(
            mockFindSelectLean([{ start: new Date('2026-07-10T00:00:00'), end: new Date('2026-07-13T00:00:00') }])
        );
        holiyDay.getHolidaysInARange.mockResolvedValue([
            { start: new Date('2026-07-13T00:00:00'), end: new Date('2026-07-13T00:00:00') },
        ]);

        const result = await getEmployeeAttendanceMetrics(corporateUser, employeeId, monthStart, monthEnd);

        // workingDaysElapsed (Mon-Fri, July 1 -> July 15, minus the 7/13 holiday) = 10
        // onLeave excludes the holiday too -> only Fri 7/10 counts = 1
        // absent = max(0, 10 - present(6) - late(1) - onLeave(1)) = 2
        expect(result).toEqual({ present: 6, late: 1, absent: 2, onLeave: 1, otHours: 0 });
    });

    it('should throw a wrapped error when a DB call fails', async () => {
        const monthStart = new Date('2026-07-01T00:00:00');
        const monthEnd = new Date('2026-07-31T23:59:59.999');

        AttendanceRecord.aggregate.mockRejectedValue(new Error('DB failure'));
        Overtime.aggregate.mockResolvedValue([]);
        OrganizationSettings.findOne.mockReturnValue(mockSelectLean(null));
        LeaveApplication.find.mockReturnValue(mockFindSelectLean([]));

        await expect(getEmployeeAttendanceMetrics(corporateUser, employeeId, monthStart, monthEnd)).rejects.toThrow(
            'Failed to compute employee attendance metrics: DB failure'
        );
    });
});
