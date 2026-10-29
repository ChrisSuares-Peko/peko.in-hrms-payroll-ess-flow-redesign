const { getMonthlyMetrics } = require('../../attendanceRecord');
const AttendanceRecord = require('../../../entities/attendanceRecord');
const LeaveApplication = require('../../../entities/leaveApplication');
const Employee = require('../../../entities/employee');
const OrganizationSettings = require('../../../entities/organizationSettings');
const holiyDay = require('../../holiyDay');

jest.mock('../../../entities/attendanceRecord', () => ({
    aggregate: jest.fn(),
    find: jest.fn(),
}));
jest.mock('../../../entities/leaveApplication', () => ({
    find: jest.fn(),
}));
jest.mock('../../../entities/employee', () => ({
    findById: jest.fn(),
}));
jest.mock('../../../entities/organizationSettings', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../holiyDay', () => ({
    getHolidaysInARange: jest.fn(),
}));

describe('getMonthlyMetrics Use-Case', () => {
    const corporateUser = 'corporateUserId';
    const employeeId = '507f1f77bcf86cd799439011';
    const monthStart = new Date('2026-07-01T00:00:00');
    const monthEnd = new Date('2026-07-31T23:59:59.999');

    const mockSelect = (value) => ({ select: jest.fn().mockResolvedValue(value) });
    const mockSelectLean = (value) => ({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }) });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-07-31T12:00:00'));
        AttendanceRecord.aggregate.mockResolvedValue([{ _id: null, totalCheckIns: 0, totalLateArrivals: 0, onTime: 0, notPresent: 0 }]);
        AttendanceRecord.find.mockReturnValue(mockSelect([]));
        LeaveApplication.find.mockReturnValue(mockSelect([]));
        Employee.findById.mockReturnValue(mockSelect(null));
        OrganizationSettings.findOne.mockReturnValue(mockSelectLean(null));
        holiyDay.getHolidaysInARange.mockResolvedValue([]);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('counts an approved LeaveApplication overlapping the range as leave days, clipped to the range', async () => {
        LeaveApplication.find.mockReturnValue(
            mockSelect([{ start: new Date('2026-07-30T00:00:00'), end: new Date('2026-07-30T00:00:00') }])
        );

        const result = await getMonthlyMetrics(corporateUser, employeeId, monthStart, monthEnd);

        expect(LeaveApplication.find).toHaveBeenCalledWith({
            corporateUser,
            employee: employeeId,
            status: 'approved',
            start: { $lte: monthEnd },
            end: { $gte: monthStart },
        });
        expect(result.totalLeaves).toBe(1);
    });

    it('excludes a leave application that is not approved', async () => {
        const result = await getMonthlyMetrics(corporateUser, employeeId, monthStart, monthEnd);

        expect(result.totalLeaves).toBe(0);
    });

    it('dedupes a calendar day covered by both an on-leave AttendanceRecord and an approved LeaveApplication', async () => {
        AttendanceRecord.find.mockReturnValue(mockSelect([{ date: new Date('2026-07-30T00:00:00') }]));
        LeaveApplication.find.mockReturnValue(
            mockSelect([{ start: new Date('2026-07-30T00:00:00'), end: new Date('2026-07-31T00:00:00') }])
        );

        const result = await getMonthlyMetrics(corporateUser, employeeId, monthStart, monthEnd);

        // Jul 30 appears in both sources, Jul 31 only in the leave application -> 2 distinct days
        expect(result.totalLeaves).toBe(2);
    });

    it('clips a leave application that extends beyond the requested month', async () => {
        LeaveApplication.find.mockReturnValue(
            mockSelect([{ start: new Date('2026-07-30T00:00:00'), end: new Date('2026-08-02T00:00:00') }])
        );

        const result = await getMonthlyMetrics(corporateUser, employeeId, monthStart, monthEnd);

        // Only Jul 30 and Jul 31 fall inside monthEnd (Jul 31) -> Aug 1-2 excluded
        expect(result.totalLeaves).toBe(2);
    });

    it('throws a wrapped error when a DB call fails', async () => {
        AttendanceRecord.aggregate.mockRejectedValue(new Error('DB failure'));

        await expect(getMonthlyMetrics(corporateUser, employeeId, monthStart, monthEnd)).rejects.toThrow(
            'Failed to compute attendance metrics: '
        );
    });

    describe('notPresent (Absent Days)', () => {
        // July 2026 has 23 Mon-Fri weekdays (default working days when unconfigured);
        // weekends are never counted as absent.
        it('counts every elapsed working day with no attendance record and no approved leave as absent', async () => {
            // "now" is frozen at 2026-07-31, so all of July has elapsed.
            const result = await getMonthlyMetrics(corporateUser, employeeId, monthStart, monthEnd);

            expect(result.notPresent).toBe(23);
        });

        it('does not count a day that already has a real AttendanceRecord', async () => {
            // Jul 6, 2026 is a Monday (a working day).
            AttendanceRecord.find.mockReturnValue(mockSelect([{ date: new Date('2026-07-06T00:00:00') }]));

            const result = await getMonthlyMetrics(corporateUser, employeeId, monthStart, monthEnd);

            expect(result.notPresent).toBe(22);
        });

        it('does not count a day covered by an approved leave', async () => {
            // Jul 10-12, 2026 are Fri/Sat/Sun -> only Jul 10 is a working day.
            LeaveApplication.find.mockReturnValue(
                mockSelect([{ start: new Date('2026-07-10T00:00:00'), end: new Date('2026-07-12T00:00:00') }])
            );

            const result = await getMonthlyMetrics(corporateUser, employeeId, monthStart, monthEnd);

            expect(result.notPresent).toBe(22);
        });

        it('does not count days before the employee joined', async () => {
            // Joined Mon 2026-07-20 -> Jul 20-31 has 10 working weekdays (Jul 25-26 are Sat/Sun).
            Employee.findById.mockReturnValue(
                mockSelect({ employeeInformation: { dateOfJoin: new Date('2026-07-20T00:00:00') } })
            );

            const result = await getMonthlyMetrics(corporateUser, employeeId, monthStart, monthEnd);

            expect(result.notPresent).toBe(10);
        });

        it('does not count future days beyond today', async () => {
            // "now" frozen at Fri 2026-07-10 -> Jul 1-10 has 8 working weekdays (Jul 4-5 are Sat/Sun).
            jest.setSystemTime(new Date('2026-07-10T12:00:00'));

            const result = await getMonthlyMetrics(corporateUser, employeeId, monthStart, monthEnd);

            expect(result.notPresent).toBe(8);
        });

        it('does not count a non-working weekday even with no other exclusion', async () => {
            // Restrict the range to a single Saturday (2026-07-04) — a non-working day.
            const saturdayStart = new Date('2026-07-04T00:00:00');
            const saturdayEnd = new Date('2026-07-04T23:59:59.999');

            const result = await getMonthlyMetrics(corporateUser, employeeId, saturdayStart, saturdayEnd);

            expect(result.notPresent).toBe(0);
        });

        it('does not count a declared company holiday even on an otherwise working weekday', async () => {
            // Jul 6, 2026 is a Monday (working day) but declared a holiday here.
            holiyDay.getHolidaysInARange.mockResolvedValue([
                { start: new Date('2026-07-06T00:00:00'), end: new Date('2026-07-06T00:00:00') },
            ]);

            const result = await getMonthlyMetrics(corporateUser, employeeId, monthStart, monthEnd);

            expect(result.notPresent).toBe(22);
        });
    });
});
