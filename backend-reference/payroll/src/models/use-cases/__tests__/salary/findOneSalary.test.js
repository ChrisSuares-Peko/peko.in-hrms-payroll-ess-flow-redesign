const { findOneSalary } = require('../../../use-cases/salary');
const Salary = require('../../../entities/salary');
const HrSettings = require('../../../entities/hrSettings');
const Employee = require('../../../entities/employee');
const OrganizationSettings = require('../../../entities/organizationSettings');
const BankDetails = require('../../../entities/bankDetails');
const { getEmployeeCtcBreakdown } = require('../../../use-cases/ctcCalculator');
const { fetchArrearsForPayout } = require('../../../use-cases/reviseSalary');
const { fetchPendingDeductionsForPayout } = require('../../../use-cases/deductions');
const SalaryStructureVersion = require('../../../entities/salaryStructureVersion');
const { ObjectId } = require('mongoose').Types;

jest.mock('../../../entities/salary');
jest.mock('../../../entities/hrSettings');
jest.mock('../../../entities/employee');
jest.mock('../../../entities/organizationSettings');
jest.mock('../../../entities/bankDetails');
jest.mock('../../../use-cases/ctcCalculator');
jest.mock('../../../use-cases/reviseSalary');
jest.mock('../../../use-cases/deductions');
jest.mock('../../../entities/salaryStructureVersion');

describe('findOneSalary Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
        // Drives the per-component split for "other" earnings/deductions — resolving to
        // null here (as it would for an employee whose live CTC can't be resolved) keeps
        // these tests on the pre-existing single lump-sum fallback path.
        getEmployeeCtcBreakdown.mockResolvedValue(null);
        // A mock Salary record with no paymentStatus isn't PAID/APPROVED/COMPLETED, so
        // findOneSalary treats it as not-yet-locked-in and looks up live pending arrears —
        // resolving to none here keeps these tests on the pre-existing no-arrears path.
        fetchArrearsForPayout.mockResolvedValue({ totalArrearsPay: 0, arrearsIds: [] });
        // Same not-yet-locked-in live re-fetch as arrears above, for one-off deductions —
        // resolving to none here keeps these tests on the pre-existing no-extra-deductions
        // path.
        fetchPendingDeductionsForPayout.mockResolvedValue({ totalDeductionsPay: 0, items: [] });
        // No structure version on record for these tests' employees — findSupersededHistoricalCtc
        // (findOneSalary's guard against a later CTC revision overwriting an earlier,
        // already-superseded month) resolves to null here, keeping these tests on the
        // pre-existing "not superseded" path.
        SalaryStructureVersion.findOne.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(null),
        });
    });

    it('should return salary details for valid params', async () => {
        const employeeId = new ObjectId().toString();
        const corporateUserID = 'corporateUserID';
        const month = 7;
        const year = 2023;
        const params = { corporateUserID, employeeId, month, year };

        const cycleStart = new Date(2023, 6, 1);
        const cycleEnd = new Date(2023, 7, 1);

        const mockEmployee = {
            _id: new ObjectId(employeeId),
            corporateUser: corporateUserID,
            isEmployeeDeleted: false,
            employeeInformation: { dateOfJoin: null },
            offBoardingInformation: {}
        };

        const mockSalaryRecord = {
            corporateUser: corporateUserID,
            employee: new ObjectId(employeeId),
            year,
            month,
            salaryCycleStart: cycleStart,
            salaryCycleEnd: cycleEnd,
            salaryCycleDays: 31,
            salaryInformation: {
                basicPay: 30000,
                hraAmount: 5000,
                daAmount: 0,
                other: 0,
                deductionAmount: 2000,
                epfAmount: 2000,
                esiAmount: 0,
                lwfAmount: 0,
                tdsAmount: 0
            },
            totalBonus: 0,
            totalIncentive: 0,
            totalOvertime: 0,
            totalReimbursement: 0,
            leaveCount: 0,
            leaveDeduction: 0,
            totalPayable: 33000
        };

        const mockOrgSettings = { corporateUser: corporateUserID };
        const mockHrSettings = { payrollSettings: { payrollStartsFrom: null } };

        Employee.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockEmployee) });
        OrganizationSettings.findOne.mockResolvedValue(mockOrgSettings);
        Salary.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockSalaryRecord) });
        HrSettings.findOne.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockHrSettings)
        });
        BankDetails.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const result = await findOneSalary(params);

        expect(Employee.findOne).toHaveBeenCalledWith({
            _id: employeeId,
            corporateUser: corporateUserID,
            isEmployeeDeleted: false
        });
        expect(Salary.findOne).toHaveBeenCalledWith({
            corporateUser: corporateUserID,
            employee: new ObjectId(employeeId),
            year: Number(year),
            month: Number(month)
        });
        expect(HrSettings.findOne).toHaveBeenCalledWith({ corporateUser: corporateUserID });

        expect(result).toMatchObject({
            employee: mockEmployee,
            month,
            year,
            grossSalary: expect.any(Number),
            totalDeductions: expect.any(Number),
            netSalary: 33000,
            organizationSettings: mockOrgSettings
        });
    });

    it('should throw an error if employee is not found', async () => {
        const employeeId = new ObjectId().toString();
        const params = { corporateUserID: 'corporateUserID', employeeId, month: 7, year: 2023 };

        Employee.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
        OrganizationSettings.findOne.mockResolvedValue({});
        Salary.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({}) });
        HrSettings.findOne.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue({})
        });
        BankDetails.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        await expect(findOneSalary(params)).rejects.toThrow('Employee not found');
    });

    it('should throw an error if salary record is not found', async () => {
        const employeeId = new ObjectId().toString();
        const params = { corporateUserID: 'corporateUserID', employeeId, month: 7, year: 2023 };

        const mockEmployee = {
            _id: new ObjectId(employeeId),
            employeeInformation: { dateOfJoin: null },
            offBoardingInformation: {}
        };

        Employee.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockEmployee) });
        OrganizationSettings.findOne.mockResolvedValue({});
        Salary.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
        HrSettings.findOne.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue({})
        });
        BankDetails.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        await expect(findOneSalary(params)).rejects.toThrow('Salary is not processed for this month');
    });

    it('should handle database errors', async () => {
        const employeeId = new ObjectId().toString();
        const params = { corporateUserID: 'corporateUserID', employeeId, month: 7, year: 2023 };
        const mockError = new Error('Database error');

        Employee.findOne.mockReturnValue({ lean: jest.fn().mockRejectedValue(mockError) });
        OrganizationSettings.findOne.mockResolvedValue({});
        Salary.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({}) });
        HrSettings.findOne.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue({})
        });
        BankDetails.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        await expect(findOneSalary(params)).rejects.toThrow('Database error');
    });
});
