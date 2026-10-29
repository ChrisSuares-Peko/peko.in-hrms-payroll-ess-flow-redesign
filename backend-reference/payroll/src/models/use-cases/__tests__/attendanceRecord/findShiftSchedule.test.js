const mongoose = require('mongoose');
const { findShiftSchedule } = require('../../attendanceRecord');
const Employee = require('../../../entities/employee');
const AttendanceRecord = require('../../../entities/attendanceRecord');

jest.mock('../../../entities/employee', () => ({
    find: jest.fn(),
    countDocuments: jest.fn(),
}));
jest.mock('../../../entities/attendanceRecord', () => ({
    find: jest.fn(),
}));

describe('findShiftSchedule Use-Case', () => {
    const corporateUser = 'corporateUserId';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-07-31T12:00:00'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const mockEmployeeFindChain = (resolvedEmployees) => {
        const lean = jest.fn().mockResolvedValue(resolvedEmployees);
        const limit = jest.fn().mockReturnValue({ lean });
        const skip = jest.fn().mockReturnValue({ limit });
        const sort = jest.fn().mockReturnValue({ skip });
        const populate = jest.fn().mockReturnValue({ sort });
        Employee.find.mockReturnValue({ populate });
        return { populate, sort, skip, limit, lean };
    };

    it('excludes suspended/resigned-in-the-past employees, keeping only active statuses or resigned-with-a-future-last-working-day', async () => {
        mockEmployeeFindChain([]);
        Employee.countDocuments.mockResolvedValue(0);

        const from = new Date('2026-07-01');
        const to = new Date('2026-07-31');

        await findShiftSchedule(corporateUser, { from, to, page: 1, limit: 30 });

        const expectedQuery = {
            corporateUser,
            isEmployeeDeleted: false,
            $or: [
                { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'INPROBATION', 'CONFIRMED'] } },
                { 'employeeInformation.employeeStatus': 'RESIGNED', 'offBoardingInformation.lastWorkingDay': { $gte: new Date('2026-07-31T12:00:00') } },
            ],
        };

        expect(Employee.find).toHaveBeenCalledWith(
            expectedQuery,
            'personalInformation.fullName personalInformation.email profileImage employeeInformation workSchedule'
        );
        expect(Employee.countDocuments).toHaveBeenCalledWith(expectedQuery);
    });

    it('returns employees, total and an empty attMap when no employees match', async () => {
        mockEmployeeFindChain([]);
        Employee.countDocuments.mockResolvedValue(0);

        const result = await findShiftSchedule(corporateUser, {
            from: new Date('2026-07-01'),
            to: new Date('2026-07-31'),
        });

        expect(result).toEqual({ employees: [], total: 0, attMap: {} });
        expect(AttendanceRecord.find).not.toHaveBeenCalled();
    });

    it('builds attMap keyed by employee and local date from matching attendance records', async () => {
        const empId = new mongoose.Types.ObjectId();
        const employees = [{ _id: empId, personalInformation: { fullName: 'Alice' } }];
        mockEmployeeFindChain(employees);
        Employee.countDocuments.mockResolvedValue(1);

        const attLean = jest.fn().mockResolvedValue([
            { employee: empId, date: new Date('2026-07-15'), status: 'present' },
        ]);
        AttendanceRecord.find.mockReturnValue({ lean: attLean });

        const result = await findShiftSchedule(corporateUser, {
            from: new Date('2026-07-01'),
            to: new Date('2026-07-31'),
        });

        expect(result.employees).toEqual(employees);
        expect(result.total).toBe(1);
        expect(result.attMap[empId.toString()]['2026-07-15']).toEqual(
            expect.objectContaining({ status: 'present' })
        );
    });

    it('scopes to specific employeeIds and applies the dateOfJoin filter when datesProvided is true', async () => {
        mockEmployeeFindChain([]);
        Employee.countDocuments.mockResolvedValue(0);
        const employeeIds = ['emp1', 'emp2'];
        const to = new Date('2026-07-31');

        await findShiftSchedule(corporateUser, {
            from: new Date('2026-07-01'),
            to,
            employeeIds,
            datesProvided: true,
        });

        const calledQuery = Employee.find.mock.calls[0][0];
        expect(calledQuery._id).toEqual({ $in: employeeIds });
        expect(calledQuery['employeeInformation.dateOfJoin']).toEqual({ $lte: to });
    });

    it('throws a wrapped error when a DB call fails', async () => {
        Employee.find.mockImplementation(() => {
            throw new Error('DB failure');
        });

        await expect(
            findShiftSchedule(corporateUser, { from: new Date(), to: new Date() })
        ).rejects.toThrow('Failed to fetch shift schedule: DB failure');
    });
});
