const DeductionComponent = require('../../../entities/deductionComponent');
const ComplianceSettings = require('../../../entities/complianceSettings');
const { getEmployeeDeductionComponentsList } = require('../../deductionComponent');
const { getEmployeeGrossSalary } = require('../../salaryComponent');
const { resolvePfMonthlyCap } = require('../../../../services/calculateEmployerPf');

// This function auto-freezes a LIVE component override based on TODAY's cap (₹1,800/month
// through August 2026, ₹3,000/month from September 2026) — not tied to a specific payroll
// month — so tests exercise it via the real cap for "now", never a hardcoded 1,800.
const CURRENT_PF_MONTHLY_CAP = resolvePfMonthlyCap();
// A basic salary whose 12% is guaranteed to exceed the current cap, whichever it is.
const OVER_CAP_BASIC_SALARY = Math.ceil((CURRENT_PF_MONTHLY_CAP / 0.12 + 1000) / 1000) * 1000;

jest.mock('../../../entities/deductionComponent');
jest.mock('../../../entities/complianceSettings');

// Keep the real PF_MONTHLY_CAP / isProvidentFundDeduction / calculateSingleDeductionAmount —
// they're pure business logic and the whole point of these tests is to verify them for real.
// Only getEmployeeGrossSalary hits the DB, so that's the one function we mock out.
jest.mock('../../salaryComponent', () => {
    const actual = jest.requireActual('../../salaryComponent');
    return {
        ...actual,
        getEmployeeGrossSalary: jest.fn(),
    };
});

const params = { corporateUserID: 'corp-1', employeeId: 'emp-1' };

const globalPfComponent = {
    _id: 'global-pf-id',
    toObject() {
        return {
            _id: 'global-pf-id',
            deductionName: 'Provident Fund (PF)',
            calculationType: 'PERCENTAGE',
            amountPercentage: 12,
            calculationBasis: 'MONTHLY',
            salaryDeductionType: 'BASIC_SALARY',
            status: 'ACTIVE',
            isGlobal: true,
        };
    },
};

describe('getEmployeeDeductionComponentsList', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // All existing tests below exercise the CAPPED_15000 (default) PF-cap behavior —
        // see pfWagesPolicy.test.js for the FULL_BASIC (no-cap) policy's own coverage.
        ComplianceSettings.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue({ epf: { pfWagesPolicy: 'CAPPED_15000' } }),
        });
    });

    it("auto-creates a FIXED employee override at the current statutory cap the first time 12% of basic salary exceeds it", async () => {
        DeductionComponent.find
            .mockResolvedValueOnce([globalPfComponent]) // global components query
            .mockResolvedValueOnce([]); // employee-specific components query (none yet)
        getEmployeeGrossSalary.mockResolvedValue({ basicSalary: OVER_CAP_BASIC_SALARY, totalEarnings: OVER_CAP_BASIC_SALARY + 6000 });

        const createdOverrideDoc = {
            toObject: () => ({
                deductionName: 'Provident Fund (PF)',
                calculationType: 'FIXED',
                amountPercentage: CURRENT_PF_MONTHLY_CAP,
                calculationBasis: 'MONTHLY',
                salaryDeductionType: 'BASIC_SALARY',
                status: 'ACTIVE',
                isGlobal: false,
                globalComponentId: 'global-pf-id',
            }),
        };
        DeductionComponent.create.mockResolvedValue(createdOverrideDoc);

        const result = await getEmployeeDeductionComponentsList(params);

        expect(DeductionComponent.create).toHaveBeenCalledWith(
            expect.objectContaining({
                corporateUser: 'corp-1',
                employee: 'emp-1',
                deductionName: 'Provident Fund (PF)',
                calculationType: 'FIXED',
                amountPercentage: CURRENT_PF_MONTHLY_CAP,
                isGlobal: false,
                globalComponentId: 'global-pf-id',
            })
        );
        expect(result.componentData).toHaveLength(1);
        expect(result.componentData[0]).toMatchObject({
            calculationType: 'FIXED',
            amountPercentage: CURRENT_PF_MONTHLY_CAP,
            calculatedAmount: CURRENT_PF_MONTHLY_CAP,
        });
        expect(result.totalCount).toBe(1);
    });

    it('does not auto-create an override when 12% of basic salary is already within the current cap', async () => {
        DeductionComponent.find
            .mockResolvedValueOnce([globalPfComponent])
            .mockResolvedValueOnce([]);
        // 12% of 10,000 = 1,200 — under the cap.
        getEmployeeGrossSalary.mockResolvedValue({ basicSalary: 10000, totalEarnings: 15000 });

        const result = await getEmployeeDeductionComponentsList(params);

        expect(DeductionComponent.create).not.toHaveBeenCalled();
        expect(result.componentData).toHaveLength(1);
        expect(result.componentData[0]).toMatchObject({
            calculationType: 'PERCENTAGE',
            amountPercentage: 12,
            calculatedAmount: 1200,
        });
    });

    it('does not apply the PF cap to a non-PF percentage component even when it exceeds ₹1,800', async () => {
        const globalProfessionalTax = {
            _id: 'global-pt-id',
            toObject: () => ({
                _id: 'global-pt-id',
                deductionName: 'Professional Tax',
                calculationType: 'PERCENTAGE',
                amountPercentage: 12,
                calculationBasis: 'MONTHLY',
                salaryDeductionType: 'BASIC_SALARY',
                status: 'ACTIVE',
                isGlobal: true,
            }),
        };
        DeductionComponent.find
            .mockResolvedValueOnce([globalProfessionalTax]) // no PF among the org's globals
            .mockResolvedValueOnce([]);
        // ensureProvidentFundDeductionExists's atomic upsert (this org has no PF at all
        // yet) — findOneAndUpdate rather than a separate findOne+create, so two
        // concurrent callers can't both see "missing" and each insert a duplicate.
        DeductionComponent.findOneAndUpdate.mockResolvedValue({
            _id: 'global-pf-id',
            toObject: () => ({
                _id: 'global-pf-id',
                deductionName: 'Provident Fund (PF)',
                calculationType: 'PERCENTAGE',
                amountPercentage: 12,
                calculationBasis: 'MONTHLY',
                status: 'ACTIVE',
                isGlobal: true,
            }),
        });
        getEmployeeGrossSalary.mockResolvedValue({ basicSalary: 20000, totalEarnings: 26000 });

        const result = await getEmployeeDeductionComponentsList(params);

        // PF didn't exist for this org at all — ensureProvidentFundDeductionExists auto-
        // creates it (see getEmployeeDeductionComponentsList) so it's never silently
        // missing from payroll, regardless of Professional Tax's own PF-cap exemption.
        expect(DeductionComponent.findOneAndUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ deductionName: 'Provident Fund (PF)', isGlobal: true }),
            expect.objectContaining({
                $setOnInsert: expect.objectContaining({ deductionName: 'Provident Fund (PF)' }),
            }),
            expect.objectContaining({ upsert: true })
        );
        const professionalTax = result.componentData.find(c => c.deductionName === 'Professional Tax');
        expect(professionalTax).toMatchObject({
            calculationType: 'PERCENTAGE',
            calculatedAmount: 2400, // uncapped — 12% of 20,000
        });
    });

    it('does not re-trigger auto-creation once an employee-specific PF override already exists', async () => {
        const employeeOverride = {
            _id: 'emp-pf-id',
            toObject: () => ({
                _id: 'emp-pf-id',
                deductionName: 'Provident Fund (PF)',
                calculationType: 'FIXED',
                amountPercentage: 1800,
                calculationBasis: 'MONTHLY',
                salaryDeductionType: 'BASIC_SALARY',
                status: 'ACTIVE',
                isGlobal: false,
                globalComponentId: 'global-pf-id',
            }),
            globalComponentId: 'global-pf-id',
        };
        DeductionComponent.find
            .mockResolvedValueOnce([globalPfComponent]) // still returned by the global query...
            .mockResolvedValueOnce([employeeOverride]); // ...but excluded since it's overridden
        getEmployeeGrossSalary.mockResolvedValue({ basicSalary: 20000, totalEarnings: 26000 });

        const result = await getEmployeeDeductionComponentsList(params);

        expect(DeductionComponent.create).not.toHaveBeenCalled();
        expect(result.componentData).toHaveLength(1);
        expect(result.componentData[0]).toMatchObject({
            calculationType: 'FIXED',
            amountPercentage: 1800,
            isGlobal: false,
        });
    });

    it('merges global and employee-specific components, excluding globals the employee has overridden', async () => {
        const globalHra = {
            _id: 'global-hra-id',
            toObject: () => ({
                _id: 'global-hra-id',
                deductionName: 'HRA Deduction',
                calculationType: 'FIXED',
                amountPercentage: 500,
                calculationBasis: 'MONTHLY',
                status: 'ACTIVE',
                isGlobal: true,
            }),
        };
        const employeeSpecificOnly = {
            _id: 'emp-only-id',
            toObject: () => ({
                _id: 'emp-only-id',
                deductionName: 'Advance Recovery',
                calculationType: 'FIXED',
                amountPercentage: 300,
                calculationBasis: 'MONTHLY',
                status: 'ACTIVE',
                isGlobal: false,
                globalComponentId: null,
            }),
            globalComponentId: null,
        };
        DeductionComponent.find
            .mockResolvedValueOnce([globalPfComponent, globalHra])
            .mockResolvedValueOnce([employeeSpecificOnly]);
        getEmployeeGrossSalary.mockResolvedValue({ basicSalary: 20000, totalEarnings: 26000 });
        DeductionComponent.create.mockResolvedValue({
            toObject: () => ({
                deductionName: 'Provident Fund (PF)',
                calculationType: 'FIXED',
                amountPercentage: 1800,
                calculationBasis: 'MONTHLY',
                isGlobal: false,
            }),
        });

        const result = await getEmployeeDeductionComponentsList(params);

        const names = result.componentData.map(c => c.deductionName);
        expect(names).toEqual(
            expect.arrayContaining(['Provident Fund (PF)', 'HRA Deduction', 'Advance Recovery'])
        );
        expect(result.totalCount).toBe(3);
    });

    it('does not auto-cap or auto-create an override when the org policy is FULL_BASIC, even when 12% of basic salary exceeds ₹1,800', async () => {
        ComplianceSettings.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue({ epf: { pfWagesPolicy: 'FULL_BASIC' } }),
        });
        DeductionComponent.find
            .mockResolvedValueOnce([globalPfComponent])
            .mockResolvedValueOnce([]);
        // 12% of 20,000 = 2,400 — would exceed the cap under CAPPED_15000.
        getEmployeeGrossSalary.mockResolvedValue({ basicSalary: 20000, totalEarnings: 26000 });

        const result = await getEmployeeDeductionComponentsList(params);

        expect(DeductionComponent.create).not.toHaveBeenCalled();
        expect(result.componentData[0]).toMatchObject({
            calculationType: 'PERCENTAGE',
            isGlobal: true,
            calculatedAmount: 2400,
        });
    });
});
