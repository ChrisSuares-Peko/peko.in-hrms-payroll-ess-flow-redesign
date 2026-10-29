const { undoLatestRevision } = require('../../reviseSalary');
const SalaryStructureVersion = require('../../../entities/salaryStructureVersion');
const Salary = require('../../../entities/salary');
const Arrears = require('../../../entities/arrears');
const SalaryComponent = require('../../../entities/salaryComponent');
const DeductionComponent = require('../../../entities/deductionComponent');
const { mergeGlobalAndEmployeeComponents } = require('../../mergeComponents');

jest.mock('../../../entities/salaryStructureVersion');
jest.mock('../../../entities/salary');
jest.mock('../../../entities/arrears');
jest.mock('../../../entities/salaryComponent');
jest.mock('../../../entities/deductionComponent');
jest.mock('../../../entities/complianceSettings');
jest.mock('../../../entities/employee');
jest.mock('../../mergeComponents', () => ({
    ...jest.requireActual('../../mergeComponents'),
    mergeGlobalAndEmployeeComponents: jest.fn(),
}));

describe('undoLatestRevision — consumedByPayroll gate', () => {
    const corporateUserID = 'corp1';
    const employeeId = 'emp1';
    const revisionCreatedAt = new Date('2026-09-01T00:00:00Z');

    const basicComponentDoc = {
        _id: 'basicId',
        componentName: 'Basic Salary',
        calculationType: 'FIXED',
        employee: employeeId,
        save: jest.fn().mockResolvedValue(true),
    };
    const balancingComponentDoc = {
        _id: 'balancingId',
        componentName: 'Special Allowance',
        calculationType: 'BALANCING',
        employee: employeeId,
        save: jest.fn().mockResolvedValue(true),
    };

    const baseVersion = {
        _id: 'versionId',
        effectiveFrom: new Date('2026-02-01T00:00:00Z'),
        createdAt: revisionCreatedAt,
        previousAnnualCTC: 900000,
        arrears: null,
        previousEarnings: [
            { componentName: 'Basic Salary', calculationType: 'FIXED', calculatedAmount: 30000 },
            { componentName: 'Special Allowance', calculationType: 'BALANCING', calculatedAmount: 5000 },
        ],
        save: jest.fn().mockResolvedValue(true),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Two distinct SalaryStructureVersion.findOne calls: one chains .sort() to find the
        // latest version to undo, the other chains .lean() directly to check whether an
        // EARLIER version exists (delete-vs-replace branch in undoLatestRevision) — mocked
        // as existing here so these tests keep exercising the historical "delete" path they
        // were written against, since none of them are about that branch specifically.
        SalaryStructureVersion.findOne.mockReturnValue({
            sort: jest.fn().mockResolvedValue(baseVersion),
            lean: jest.fn().mockResolvedValue({ _id: 'earlierVersionId', effectiveFrom: new Date('2026-01-01T00:00:00Z') }),
        });
        SalaryComponent.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
        DeductionComponent.findOne.mockResolvedValue(null);
        Arrears.deleteOne.mockResolvedValue({});
        SalaryStructureVersion.deleteOne.mockResolvedValue({});
        mergeGlobalAndEmployeeComponents.mockResolvedValue([basicComponentDoc, balancingComponentDoc]);
    });

    it('allows Undo when a paid month at/after effectiveFrom was created BEFORE the revision existed (old structure)', async () => {
        Salary.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue([
                {
                    month: 7, year: 2026,
                    paymentStatus: 'PAID',
                    createdAt: new Date('2026-07-01T00:00:00Z'), // before revisionCreatedAt
                    salaryInformation: { basicPay: 30000 },
                },
            ]),
        });

        const result = await undoLatestRevision({ corporateUserID, employeeId });

        expect(result.undone).toBe(true);
        expect(SalaryStructureVersion.deleteOne).toHaveBeenCalledWith({ _id: 'versionId' });
    });

    it('blocks Undo when a paid month at/after effectiveFrom was created AFTER the revision (reflects the new structure)', async () => {
        Salary.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue([
                {
                    month: 9, year: 2026,
                    paymentStatus: 'PAID',
                    createdAt: new Date('2026-09-05T00:00:00Z'), // after revisionCreatedAt
                    salaryInformation: { basicPay: 40000 },
                },
            ]),
        });

        await expect(undoLatestRevision({ corporateUserID, employeeId })).rejects.toThrow(
            'This revision cannot be undone — a payroll run has already been recorded using its revised salary structure.'
        );
        expect(SalaryStructureVersion.deleteOne).not.toHaveBeenCalled();
    });

    it('allows Undo when the only paid month is entirely before effectiveFrom, regardless of when it was created', async () => {
        Salary.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue([
                {
                    month: 1, year: 2026, // before Feb 2026 effectiveFrom
                    paymentStatus: 'PAID',
                    createdAt: new Date('2026-09-10T00:00:00Z'), // created after the revision, but irrelevant — month is pre-effective
                    salaryInformation: { basicPay: 30000 },
                },
            ]),
        });

        const result = await undoLatestRevision({ corporateUserID, employeeId });

        expect(result.undone).toBe(true);
    });
});

describe('undoLatestRevision — restores the component\'s calculation type/rule, not just the amount', () => {
    const corporateUserID = 'corp1';
    const employeeId = 'emp1';

    it('restores Basic Salary as PERCENTAGE (e.g. "50% of Gross") when that is its current global-template rule, instead of freezing it as FIXED', async () => {
        const basicComponentDoc = {
            _id: 'basicId',
            componentName: 'Basic Salary',
            calculationType: 'FIXED', // left in this state by the revision being undone
            employee: employeeId,
            save: jest.fn().mockResolvedValue(true),
        };
        const balancingComponentDoc = {
            _id: 'balancingId',
            componentName: 'Special Allowance',
            calculationType: 'BALANCING',
            employee: employeeId,
            save: jest.fn().mockResolvedValue(true),
        };
        const version = {
            _id: 'versionId',
            effectiveFrom: new Date('2026-02-01T00:00:00Z'),
            createdAt: new Date('2026-09-01T00:00:00Z'),
            previousAnnualCTC: 900000,
            arrears: null,
            previousEarnings: [
                { componentName: 'Basic Salary', calculationType: 'PERCENTAGE', calculatedAmount: 36525 },
                { componentName: 'Special Allowance', calculationType: 'BALANCING', calculatedAmount: 13262.5 },
            ],
            save: jest.fn().mockResolvedValue(true),
        };

        SalaryStructureVersion.findOne.mockReturnValue({
            sort: jest.fn().mockResolvedValue(version),
            lean: jest.fn().mockResolvedValue({ _id: 'earlierVersionId', effectiveFrom: new Date('2026-01-01T00:00:00Z') }),
        });
        Salary.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
        // The global template says Basic Salary is 50% of Gross — the live "source of
        // truth" undoLatestRevision must re-derive the restore rule from, same as
        // reviseSalary's own forward persist does via effectiveRule.
        SalaryComponent.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue([
                { _id: 'templateBasicId', componentName: 'Basic Salary', calculationType: 'PERCENTAGE', calculationBasis: 'GROSS_SALARY', amountPercentage: 50 },
            ]),
        });
        mergeGlobalAndEmployeeComponents.mockResolvedValue([basicComponentDoc, balancingComponentDoc]);
        DeductionComponent.findOne.mockResolvedValue(null);
        Arrears.deleteOne.mockResolvedValue({});
        SalaryStructureVersion.deleteOne.mockResolvedValue({});

        const result = await undoLatestRevision({ corporateUserID, employeeId });

        expect(result.undone).toBe(true);
        expect(basicComponentDoc.calculationType).toBe('PERCENTAGE');
        expect(basicComponentDoc.amountPercentage).toBe(50);
        expect(basicComponentDoc.calculationBasis).toBe('GROSS_SALARY');
        expect(basicComponentDoc.save).toHaveBeenCalled();
    });
});
