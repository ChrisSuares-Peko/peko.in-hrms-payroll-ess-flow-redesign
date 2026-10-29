const mongoose = require('mongoose');
const { findMonthlySummary } = require('../../attendanceRecord');
const AttendanceRecord = require('../../../entities/attendanceRecord');
const Overtime = require('../../../entities/overTime');
const Employee = require('../../../entities/employee');
const OrganizationSettings = require('../../../entities/organizationSettings');
const LeaveApplication = require('../../../entities/leaveApplication');
const holiyDay = require('../../holiyDay');

jest.mock('../../../entities/attendanceRecord', () => ({
    aggregate: jest.fn(),
}));
jest.mock('../../../entities/overTime', () => ({
    aggregate: jest.fn(),
}));
jest.mock('../../../entities/employee', () => ({
    find: jest.fn(),
}));
jest.mock('../../../entities/organizationSettings', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/leaveApplication', () => ({
    find: jest.fn(),
}));
jest.mock('../../holiyDay', () => ({
    getHolidaysInARange: jest.fn(),
}));

describe('findMonthlySummary Use-Case', () => {
    const corporateUser = 'corporateUserId';
    const now = new Date('2026-07-15T12:00:00');
    const oidA = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
    const oidB = new mongoose.Types.ObjectId('507f1f77bcf86cd799439022');

    const activeEmployeeFilter = {
        corporateUser,
        isEmployeeDeleted: false,
        $or: [
            { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'INPROBATION', 'CONFIRMED'] } },
            { 'employeeInformation.employeeStatus': 'RESIGNED', 'offBoardingInformation.lastWorkingDay': { $gte: now } },
        ],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(now);
        holiyDay.getHolidaysInARange.mockResolvedValue([]);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const mockLean = (value) => ({ lean: jest.fn().mockResolvedValue(value) });
    const mockFindSelectLean = (value) => ({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }) });
    const mockSelectLean = mockFindSelectLean;

    const mockActiveEmployees = (ids) => {
        Employee.find.mockReturnValueOnce({ select: jest.fn().mockResolvedValue(ids.map(_id => ({ _id }))) });
    };

    it('should compute absent/onLeave/attendancePercentage per employee and enrich rows from Employee.find', async () => {
        const monthStart = new Date(2026, 6, 1);
        const monthEnd = new Date(2026, 6, 31, 23, 59, 59, 999);

        mockActiveEmployees([oidA, oidB]);
        AttendanceRecord.aggregate.mockResolvedValue([
            {
                data: [
                    { _id: oidA, present: 15, late: 2, halfDay: 1, totalHours: 120, totalLateMinutes: 30 },
                    { _id: oidB, present: 5, late: 0, halfDay: 0, totalHours: 40, totalLateMinutes: 0 },
                ],
                totalCount: [{ count: 2 }],
            },
        ]);
        Overtime.aggregate.mockResolvedValue([{ _id: oidA, otHours: 3 }]);
        OrganizationSettings.findOne.mockReturnValue(mockSelectLean(null));
        Employee.find.mockReturnValue(mockLean([
            {
                _id: oidA,
                personalInformation: { fullName: 'Alice', email: 'alice@example.com' },
                profileImage: 'alice.png',
                employeeInformation: { employeeId: 'E1', designation: 'Engineer' },
            },
            {
                _id: oidB,
                personalInformation: { fullName: 'Bob', email: 'bob@example.com' },
                profileImage: null,
                employeeInformation: { employeeId: 'E2', designation: 'Designer' },
            },
        ]));
        // Bob is on leave Mon 7/6 -> Wed 7/8 (3 working days) under default Mon-Fri.
        LeaveApplication.find.mockReturnValue(
            mockFindSelectLean([{ employee: oidB, start: new Date(2026, 6, 6), end: new Date(2026, 6, 8) }])
        );

        const result = await findMonthlySummary(corporateUser, { monthStart, monthEnd, page: 1, limit: 30 });

        expect(Employee.find).toHaveBeenNthCalledWith(1, activeEmployeeFilter);
        expect(AttendanceRecord.aggregate).toHaveBeenCalledWith([
            { $match: { corporateUser, date: { $gte: monthStart, $lte: monthEnd }, employee: { $in: [oidA, oidB] } } },
            {
                $group: {
                    _id: '$employee',
                    present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                    late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
                    halfDay: { $sum: { $cond: [{ $eq: ['$status', 'half-day'] }, 1, 0] } },
                    totalHours: { $sum: '$totalHours' },
                    totalLateMinutes: { $sum: '$lateMinutes' },
                },
            },
            { $sort: { _id: 1 } },
            { $facet: { data: [{ $skip: 0 }, { $limit: 30 }], totalCount: [{ $count: 'count' }] } },
        ]);
        expect(Overtime.aggregate).toHaveBeenCalledWith([
            { $match: { corporateUser, status: 'approved', overTimeDate: { $gte: monthStart, $lte: monthEnd }, employee: { $in: [oidA, oidB] } } },
            { $group: { _id: '$employee', otHours: { $sum: '$extraHours' } } },
        ]);
        expect(OrganizationSettings.findOne).toHaveBeenCalledWith({ corporateUser });
        expect(Employee.find).toHaveBeenNthCalledWith(
            2,
            { _id: { $in: [oidA, oidB] } },
            'personalInformation.fullName personalInformation.email profileImage employeeInformation'
        );
        expect(LeaveApplication.find).toHaveBeenCalledWith({
            corporateUser,
            employee: { $in: [oidA, oidB] },
            status: 'approved',
            start: { $lte: monthEnd },
            end: { $gte: monthStart },
        });

        // workingDaysElapsed (Mon-Fri, July 1 -> July 15 2026) = 11
        // Alice: absent = max(0, 11 - 15 - 2 - 0) = 0; totalRecorded = 15+2+0+0+1 = 18; pct = round(18/18*100) = 100
        // Bob:   absent = max(0, 11 - 5 - 0 - 3) = 3; totalRecorded = 5+0+3+3+0 = 11; pct = round(5/11*100) = 45
        expect(result).toEqual({
            total: 2,
            records: [
                {
                    employee: {
                        _id: oidA,
                        employeeId: 'E1',
                        fullName: 'Alice',
                        email: 'alice@example.com',
                        profileImage: 'alice.png',
                        designation: 'Engineer',
                    },
                    present: 15,
                    late: 2,
                    absent: 0,
                    onLeave: 0,
                    halfDay: 1,
                    totalHours: 120,
                    totalLateMinutes: 30,
                    otHours: 3,
                    attendancePercentage: 100,
                },
                {
                    employee: {
                        _id: oidB,
                        employeeId: 'E2',
                        fullName: 'Bob',
                        email: 'bob@example.com',
                        profileImage: null,
                        designation: 'Designer',
                    },
                    present: 5,
                    late: 0,
                    absent: 3,
                    onLeave: 3,
                    halfDay: 0,
                    totalHours: 40,
                    totalLateMinutes: 0,
                    otHours: 0,
                    attendancePercentage: 45,
                },
            ],
        });
    });

    it('should scope the active-employee lookup and both aggregation pipelines to the given employeeIds', async () => {
        const monthStart = new Date(2026, 6, 1);
        const monthEnd = new Date(2026, 6, 31, 23, 59, 59, 999);
        const employeeIds = [oidA.toString(), oidB.toString()];

        mockActiveEmployees([oidA, oidB]);
        AttendanceRecord.aggregate.mockResolvedValue([{ data: [], totalCount: [] }]);
        Overtime.aggregate.mockResolvedValue([]);
        OrganizationSettings.findOne.mockReturnValue(mockSelectLean(null));
        Employee.find.mockReturnValue(mockLean([]));
        LeaveApplication.find.mockReturnValue(mockFindSelectLean([]));

        const result = await findMonthlySummary(corporateUser, { monthStart, monthEnd, employeeIds, page: 1, limit: 30 });

        expect(Employee.find).toHaveBeenNthCalledWith(1, expect.objectContaining({ _id: { $in: [oidA, oidB] } }));
        expect(AttendanceRecord.aggregate).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    $match: expect.objectContaining({ employee: { $in: [oidA, oidB] } }),
                }),
            ])
        );
        expect(Overtime.aggregate).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    $match: expect.objectContaining({ employee: { $in: [oidA, oidB] } }),
                }),
            ])
        );
        expect(result).toEqual({ total: 0, records: [] });
    });

    it('should default absent to 0 and attendancePercentage to 0 when there are no working days elapsed', async () => {
        // A single Saturday: 0 working days under the default Mon-Fri set.
        const monthStart = new Date(2026, 6, 4);
        const monthEnd = new Date(2026, 6, 4, 23, 59, 59, 999);

        mockActiveEmployees([oidA]);
        AttendanceRecord.aggregate.mockResolvedValue([
            {
                data: [{ _id: oidA, present: 0, late: 0, halfDay: 0, totalHours: 0, totalLateMinutes: 0 }],
                totalCount: [{ count: 1 }],
            },
        ]);
        Overtime.aggregate.mockResolvedValue([]);
        OrganizationSettings.findOne.mockReturnValue(mockSelectLean(null));
        Employee.find.mockReturnValue(mockLean([
            { _id: oidA, personalInformation: { fullName: 'Alice' }, employeeInformation: {} },
        ]));
        LeaveApplication.find.mockReturnValue(mockFindSelectLean([]));

        const result = await findMonthlySummary(corporateUser, { monthStart, monthEnd, page: 1, limit: 30 });

        expect(result.records[0]).toMatchObject({ present: 0, late: 0, absent: 0, onLeave: 0, attendancePercentage: 0 });
    });

    it('should fall back to a bare employee shape when no Employee document matches the row', async () => {
        const monthStart = new Date(2026, 6, 1);
        const monthEnd = new Date(2026, 6, 31, 23, 59, 59, 999);

        mockActiveEmployees([oidA]);
        AttendanceRecord.aggregate.mockResolvedValue([
            {
                data: [{ _id: oidA, present: 1, late: 0, halfDay: 0, totalHours: 8, totalLateMinutes: 0 }],
                totalCount: [{ count: 1 }],
            },
        ]);
        Overtime.aggregate.mockResolvedValue([]);
        OrganizationSettings.findOne.mockReturnValue(mockSelectLean(null));
        Employee.find.mockReturnValue(mockLean([])); // no matching employee doc
        LeaveApplication.find.mockReturnValue(mockFindSelectLean([]));

        const result = await findMonthlySummary(corporateUser, { monthStart, monthEnd, page: 1, limit: 30 });

        expect(result.records[0].employee).toEqual({
            _id: oidA,
            employeeId: null,
            fullName: null,
            email: null,
            profileImage: null,
            designation: null,
        });
    });

    it("should count working days per employee from their own joining date, not a shared month start", async () => {
        const monthStart = new Date(2026, 6, 1);
        const monthEnd = new Date(2026, 6, 31, 23, 59, 59, 999);

        mockActiveEmployees([oidA, oidB]);
        AttendanceRecord.aggregate.mockResolvedValue([
            {
                data: [
                    { _id: oidA, present: 0, late: 0, halfDay: 0, totalHours: 0, totalLateMinutes: 0 },
                    { _id: oidB, present: 0, late: 0, halfDay: 0, totalHours: 0, totalLateMinutes: 0 },
                ],
                totalCount: [{ count: 2 }],
            },
        ]);
        Overtime.aggregate.mockResolvedValue([]);
        OrganizationSettings.findOne.mockReturnValue(mockSelectLean(null));
        Employee.find.mockReturnValue(mockLean([
            // Alice has been on the books since before the month started.
            {
                _id: oidA,
                personalInformation: { fullName: 'Alice' },
                employeeInformation: { dateOfJoin: new Date(2026, 5, 1) },
            },
            // Bob joined mid-month, on Wed 2026-07-15 — the same day "now" is frozen at.
            {
                _id: oidB,
                personalInformation: { fullName: 'Bob' },
                employeeInformation: { dateOfJoin: new Date(2026, 6, 15) },
            },
        ]));
        LeaveApplication.find.mockReturnValue(mockFindSelectLean([]));

        const result = await findMonthlySummary(corporateUser, { monthStart, monthEnd, page: 1, limit: 30 });

        // Alice: full Mon-Fri range July 1 -> July 15 2026 = 11 working days elapsed -> absent 11.
        // Bob: only July 15 (Wed) itself has elapsed since he joined that day -> absent 1.
        expect(result.records.find(r => r.employee._id === oidA).absent).toBe(11);
        expect(result.records.find(r => r.employee._id === oidB).absent).toBe(1);
    });

    it('should exclude a declared company holiday from workingDaysElapsed and onLeave', async () => {
        const monthStart = new Date(2026, 6, 1);
        const monthEnd = new Date(2026, 6, 31, 23, 59, 59, 999);

        mockActiveEmployees([oidA]);
        AttendanceRecord.aggregate.mockResolvedValue([
            {
                data: [{ _id: oidA, present: 5, late: 0, halfDay: 0, totalHours: 0, totalLateMinutes: 0 }],
                totalCount: [{ count: 1 }],
            },
        ]);
        Overtime.aggregate.mockResolvedValue([]);
        OrganizationSettings.findOne.mockReturnValue(mockSelectLean(null));
        Employee.find.mockReturnValue(mockLean([
            { _id: oidA, personalInformation: { fullName: 'Alice' }, employeeInformation: {} },
        ]));
        // Mon 2026-07-13 is a working day but declared a holiday here.
        LeaveApplication.find.mockReturnValue(mockFindSelectLean([]));
        holiyDay.getHolidaysInARange.mockResolvedValue([
            { start: new Date(2026, 6, 13), end: new Date(2026, 6, 13) },
        ]);

        const result = await findMonthlySummary(corporateUser, { monthStart, monthEnd, page: 1, limit: 30 });

        // Mon-Fri range July 1 -> July 15 2026 = 11 working days, minus the 7/13 holiday = 10.
        // absent = max(0, 10 - present(5) - late(0) - onLeave(0)) = 5.
        expect(result.records[0].absent).toBe(5);
    });

    it('should throw a wrapped error when a DB call fails', async () => {
        const monthStart = new Date(2026, 6, 1);
        const monthEnd = new Date(2026, 6, 31, 23, 59, 59, 999);

        mockActiveEmployees([oidA]);
        AttendanceRecord.aggregate.mockRejectedValue(new Error('DB failure'));

        await expect(findMonthlySummary(corporateUser, { monthStart, monthEnd })).rejects.toThrow(
            'Failed to fetch monthly summary: DB failure'
        );
    });
});
