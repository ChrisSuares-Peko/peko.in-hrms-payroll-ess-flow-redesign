const { findPayslipsForEmployee } = require('../../../use-cases/salary');
const Salary = require('../../../entities/salary');
const Employee = require('../../../entities/employee');
const HrSettings = require('../../../entities/hrSettings');
const { ObjectId } = require('mongoose').Types;

jest.mock('../../../entities/salary');
jest.mock('../../../entities/employee');
jest.mock('../../../entities/hrSettings');

describe('findPayslipsForEmployee Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return one row per month, synthesizing placeholder rows for months with no processed Salary record', async () => {
        const corporateUserID = 'corporateUserID';
        const employeeId = new ObjectId().toString();
        // Use a fully past year so every unprocessed month resolves to PENDING
        // (never UPCOMING), keeping the assertions independent of today's date.
        const pastYear = new Date().getFullYear() - 1;

        const mockSalaryRecord = {
            _id: 'salaryDocId1',
            month: 6,
            payingDate: new Date(pastYear, 5, 5),
            totalPayable: 45000,
            paymentStatus: 'PAID',
            salaryInformation: {
                basicPay: 30000,
                hraAmount: 5000,
                daAmount: 0,
                other: 0,
                deductionAmount: 2000,
            },
            totalIncentive: 500,
            totalBonus: 1000,
            totalOvertime: 200,
            totalReimbursement: 300,
            leaveDeduction: 100,
            totalOtherDeduction: 50,
            salaryCycleStart: new Date(pastYear, 5, 1),
            salaryCycleEnd: new Date(pastYear, 5, 30),
            salaryCycleDays: 30,
        };

        const mockEmployee = {
            _id: employeeId,
            employeeInformation: { dateOfJoin: null },
            offBoardingInformation: {},
        };

        const mockHrSettings = { payrollSettings: { payrollStartsFrom: null } };

        Salary.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([mockSalaryRecord]) });
        Employee.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockEmployee) });
        HrSettings.findOne.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockHrSettings),
        });

        const result = await findPayslipsForEmployee(corporateUserID, employeeId, pastYear);

        expect(Salary.find).toHaveBeenCalledWith({
            corporateUser: corporateUserID,
            employee: new ObjectId(employeeId),
            year: pastYear,
        });
        expect(Employee.findOne).toHaveBeenCalledWith({ _id: employeeId, corporateUser: corporateUserID });
        expect(HrSettings.findOne).toHaveBeenCalledWith({ corporateUser: corporateUserID });

        // One row per calendar month, newest-first.
        expect(result).toHaveLength(12);
        expect(result.map(r => r.month)).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);

        // The month with a real Salary doc gets a fully populated row.
        const realRow = result.find(r => r.month === 6);
        expect(realRow).toEqual({
            id: mockSalaryRecord._id,
            year: pastYear,
            month: 6,
            payingDate: mockSalaryRecord.payingDate,
            totalPayable: mockSalaryRecord.totalPayable,
            paymentStatus: mockSalaryRecord.paymentStatus,
            salaryInformation: mockSalaryRecord.salaryInformation,
            totalIncentive: 500,
            totalBonus: 1000,
            totalOvertime: 200,
            totalReimbursement: 300,
            leaveDeduction: 100,
            totalOtherDeduction: 50,
            nonWorkingDaysDeduction: 0,
        });

        // Every other month has no Salary doc, so it gets a placeholder row.
        const placeholderMonths = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12];
        placeholderMonths.forEach(month => {
            const placeholderRow = result.find(r => r.month === month);
            expect(placeholderRow).toEqual({
                id: null,
                year: pastYear,
                month,
                totalPayable: 0,
                paymentStatus: 'PENDING',
            });
        });
    });

    it('should mark the placeholder row for a future year as UPCOMING', async () => {
        const corporateUserID = 'corporateUserID';
        const employeeId = new ObjectId().toString();
        const futureYear = new Date().getFullYear() + 1;

        Salary.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
        Employee.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
        HrSettings.findOne.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(null),
        });

        const result = await findPayslipsForEmployee(corporateUserID, employeeId, futureYear);

        expect(result).toHaveLength(12);
        result.forEach(row => {
            expect(row.paymentStatus).toBe('UPCOMING');
            expect(row.id).toBeNull();
            expect(row.totalPayable).toBe(0);
        });
    });

    it('should throw/reject when the database query fails', async () => {
        const corporateUserID = 'corporateUserID';
        const employeeId = new ObjectId().toString();
        const dbError = new Error('Database error');

        Salary.find.mockReturnValue({ lean: jest.fn().mockRejectedValue(dbError) });
        Employee.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
        HrSettings.findOne.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(null),
        });

        await expect(findPayslipsForEmployee(corporateUserID, employeeId, 2024)).rejects.toThrow('Database error');
    });
});
