const { findAttendanceList } = require('../../attendanceRecord');
const AttendanceRecord = require('../../../entities/attendanceRecord');
const LeaveApplication = require('../../../entities/leaveApplication');
const Employee = require('../../../entities/employee');
const OrganizationSettings = require('../../../entities/organizationSettings');
const holiyDay = require('../../holiyDay');

jest.mock('../../../entities/attendanceRecord', () => ({
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

describe('findAttendanceList Use-Case', () => {
    const corporateUser = 'corporateUserId';
    const employeeId = '507f1f77bcf86cd799439011';

    const mockSelect = (value) => ({ select: jest.fn().mockResolvedValue(value) });
    const mockSelectLean = (value) => ({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }) });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-07-05T12:00:00'));
        AttendanceRecord.find.mockResolvedValue([]);
        LeaveApplication.find.mockReturnValue(mockSelect([]));
        Employee.findById.mockReturnValue(mockSelect(null));
        OrganizationSettings.findOne.mockReturnValue(mockSelectLean(null));
        holiyDay.getHolidaysInARange.mockResolvedValue([]);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    // Jul 1-3, 2026 are Wed/Thu/Fri — all working days under the default Mon-Fri set.
    const range = { from: new Date('2026-07-01T00:00:00'), to: new Date('2026-07-03T23:59:59.999') };

    it('synthesizes an "absent" virtual row for every elapsed day with no real record and no approved leave', async () => {
        const { records, total } = await findAttendanceList(corporateUser, employeeId, range);

        expect(total).toBe(3);
        expect(records.every(r => r.status === 'absent')).toBe(true);
        expect(records.map(r => r.date.toDateString())).toEqual([
            new Date('2026-07-03').toDateString(),
            new Date('2026-07-02').toDateString(),
            new Date('2026-07-01').toDateString(),
        ]);
    });

    it('does not synthesize a day that already has a real AttendanceRecord', async () => {
        AttendanceRecord.find.mockResolvedValue([
            { date: new Date('2026-07-02T00:00:00'), status: 'present' },
        ]);

        const { records, total } = await findAttendanceList(corporateUser, employeeId, range);

        expect(total).toBe(3);
        const jul2 = records.find(r => r.date.toDateString() === new Date('2026-07-02').toDateString());
        expect(jul2.status).toBe('present');
    });

    it('synthesizes "on-leave" instead of "absent" for a day covered by an approved leave', async () => {
        LeaveApplication.find.mockReturnValue(
            mockSelect([{ start: new Date('2026-07-02T00:00:00'), end: new Date('2026-07-02T00:00:00') }])
        );

        const { records } = await findAttendanceList(corporateUser, employeeId, range);

        const jul2 = records.find(r => r.date.toDateString() === new Date('2026-07-02').toDateString());
        expect(jul2.status).toBe('on-leave');
        expect(records.filter(r => r.status === 'absent')).toHaveLength(2);
    });

    it('filters the merged (real + virtual) list by status', async () => {
        AttendanceRecord.find.mockResolvedValue([
            { date: new Date('2026-07-01T00:00:00'), status: 'present' },
        ]);

        const { records, total } = await findAttendanceList(corporateUser, employeeId, { ...range, status: 'absent' });

        expect(total).toBe(2);
        expect(records.every(r => r.status === 'absent')).toBe(true);
    });

    it('does not synthesize days before the employee joined', async () => {
        Employee.findById.mockReturnValue(
            mockSelect({ employeeInformation: { dateOfJoin: new Date('2026-07-02T00:00:00') } })
        );

        const { records, total } = await findAttendanceList(corporateUser, employeeId, range);

        expect(total).toBe(2);
        expect(records.some(r => r.date.toDateString() === new Date('2026-07-01').toDateString())).toBe(false);
    });

    it('does not synthesize future days beyond today', async () => {
        jest.setSystemTime(new Date('2026-07-08T12:00:00')); // Wednesday
        const futureRange = { from: new Date('2026-07-07T00:00:00'), to: new Date('2026-07-14T23:59:59.999') };

        const { records, total } = await findAttendanceList(corporateUser, employeeId, futureRange);

        // "now" is frozen at Wed 2026-07-08 -> only Tue 7/7 and Wed 7/8 have elapsed.
        expect(total).toBe(2);
        expect(records.map(r => r.date.toDateString())).toEqual([
            new Date('2026-07-08').toDateString(),
            new Date('2026-07-07').toDateString(),
        ]);
    });

    it('does not synthesize a non-working weekend day as absent', async () => {
        // Jul 4-5, 2026 are Sat/Sun.
        const weekendRange = { from: new Date('2026-07-04T00:00:00'), to: new Date('2026-07-05T23:59:59.999') };

        const { records, total } = await findAttendanceList(corporateUser, employeeId, weekendRange);

        expect(total).toBe(0);
        expect(records).toEqual([]);
    });

    it('does not synthesize a declared company holiday as absent, even on a working weekday', async () => {
        // Jul 2, 2026 is a Thursday (working day) but declared a holiday here.
        holiyDay.getHolidaysInARange.mockResolvedValue([
            { start: new Date('2026-07-02T00:00:00'), end: new Date('2026-07-02T00:00:00') },
        ]);

        const { records, total } = await findAttendanceList(corporateUser, employeeId, range);

        expect(total).toBe(2);
        expect(records.some(r => r.date.toDateString() === new Date('2026-07-02').toDateString())).toBe(false);
    });

    it('still synthesizes "on-leave" on a weekend day covered by an approved leave', async () => {
        // Jul 4-5, 2026 are Sat/Sun; leave spans Fri 7/3 -> Sun 7/5.
        LeaveApplication.find.mockReturnValue(
            mockSelect([{ start: new Date('2026-07-03T00:00:00'), end: new Date('2026-07-05T00:00:00') }])
        );
        const weekendRange = { from: new Date('2026-07-04T00:00:00'), to: new Date('2026-07-05T23:59:59.999') };

        const { records, total } = await findAttendanceList(corporateUser, employeeId, weekendRange);

        expect(total).toBe(2);
        expect(records.every(r => r.status === 'on-leave')).toBe(true);
    });

    it('paginates the merged, sorted result', async () => {
        const { records, total } = await findAttendanceList(corporateUser, employeeId, { ...range, page: 2, limit: 2 });

        expect(total).toBe(3);
        expect(records).toHaveLength(1);
        expect(records[0].date.toDateString()).toEqual(new Date('2026-07-01').toDateString());
    });

    it('throws a wrapped error when a DB call fails', async () => {
        AttendanceRecord.find.mockRejectedValue(new Error('DB failure'));

        await expect(findAttendanceList(corporateUser, employeeId, range)).rejects.toThrow(
            'Failed to fetch attendance list: DB failure'
        );
    });
});
