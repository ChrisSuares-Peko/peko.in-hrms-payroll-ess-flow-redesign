const { solveEarningsForCtc } = require('../../reviseSalary');

jest.mock('../../../entities/salaryStructureVersion');
jest.mock('../../../entities/salary');
jest.mock('../../../entities/arrears');
jest.mock('../../../entities/salaryComponent');
jest.mock('../../../entities/deductionComponent');
jest.mock('../../../entities/complianceSettings');
jest.mock('../../../entities/employee');

describe('solveEarningsForCtc — EPF enabled/disabled', () => {
    // Basic 50% of Gross, HRA 50% of Basic, Other Allowance balancing — the default org setup.
    const components = [
        { _id: 'basic', componentName: 'Basic Salary', calculationType: 'PERCENTAGE', calculationBasis: 'GROSS_SALARY', amountPercentage: 50 },
        { _id: 'hra', componentName: 'House Rent Allowance', calculationType: 'PERCENTAGE', calculationBasis: 'BASIC_SALARY', amountPercentage: 50 },
        { _id: 'other', componentName: 'Other Allowance', calculationType: 'BALANCING', amountPercentage: 0 },
    ];
    const monthlyCTC = 30000; // ₹3,60,000 annual

    const amountOf = (solved, name) => solved.earnings.find((e) => e.componentName === name).calculatedAmount;

    it('nets employer PF out of Gross when EPF is active (default)', () => {
        const solved = solveEarningsForCtc(components, monthlyCTC, 'CAPPED_15000', new Map(), null, 10, 2026);

        // Gross + 13% of Basic (= 6.5% of Gross, under the ₹25,000 ceiling) = CTC
        expect(solved.grossSalary).toBe(28170);
        expect(solved.basicSalary).toBe(14085);
    });

    it('keeps the full CTC as Gross when EPF is disabled', () => {
        const solved = solveEarningsForCtc(components, monthlyCTC, 'CAPPED_15000', new Map(), null, 10, 2026, false);

        expect(solved.grossSalary).toBe(30000);
        expect(solved.basicSalary).toBe(15000);
        expect(amountOf(solved, 'House Rent Allowance')).toBe(7500);
        expect(amountOf(solved, 'Other Allowance')).toBe(7500);
        expect(solved.specialAllowanceAmount).toBe(7500);
    });

    it('still nets employer ESI out of Gross when EPF is disabled', () => {
        const esiContext = { continuing: false, ceiling: 21000, disabled: false };
        const solved = solveEarningsForCtc(components, 20000, 'CAPPED_15000', new Map(), esiContext, 10, 2026, false);

        // Gross + ceil(3.25% of Gross) = CTC
        expect(solved.grossSalary + Math.ceil(solved.grossSalary * 0.0325)).toBeCloseTo(20000, 0);
    });
});

describe('solveEarningsForCtc — Basic as % of CTC', () => {
    const components = [
        { _id: 'basic', componentName: 'Basic Salary', calculationType: 'PERCENTAGE', calculationBasis: 'CTC', amountPercentage: 50 },
        { _id: 'hra', componentName: 'House Rent Allowance', calculationType: 'PERCENTAGE', calculationBasis: 'BASIC_SALARY', amountPercentage: 50 },
        { _id: 'other', componentName: 'Other Allowance', calculationType: 'BALANCING', amountPercentage: 0 },
    ];
    const amountOf = (solved, name) => solved.earnings.find((e) => e.componentName === name).calculatedAmount;

    it('resolves Basic straight off the CTC, with Gross absorbing what employer PF leaves', () => {
        const solved = solveEarningsForCtc(components, 30000, 'CAPPED_15000', new Map(), null, 10, 2026);

        expect(solved.basicSalary).toBe(15000);
        expect(amountOf(solved, 'House Rent Allowance')).toBe(7500);
        // Gross = CTC − employer PF on a ₹15,000 Basic; Balancing takes the rest of Gross.
        expect(solved.grossSalary).toBeLessThan(30000);
        expect(amountOf(solved, 'Other Allowance')).toBeCloseTo(solved.grossSalary - 15000 - 7500, 2);
    });

    it('keeps the full CTC as Gross when EPF is disabled', () => {
        const solved = solveEarningsForCtc(components, 30000, 'CAPPED_15000', new Map(), null, 10, 2026, false);

        expect(solved.grossSalary).toBe(30000);
        expect(solved.basicSalary).toBe(15000);
        expect(solved.specialAllowanceAmount).toBe(7500);
    });

    it('re-solves from a CTC-basis global template, not the frozen override', () => {
        // The template has no calculationBasedOn — must not be misread as "% of Basic".
        const template = { _id: 'g-basic', componentName: 'Basic Salary', calculationType: 'PERCENTAGE', calculationBasis: 'CTC', amountPercentage: 40 };
        const override = { _id: 'basic', componentName: 'Basic Salary', calculationType: 'FIXED', amountPercentage: 9999, globalComponentId: 'g-basic' };
        const solved = solveEarningsForCtc([override, components[2]], 50000, 'CAPPED_15000', new Map([['g-basic', template]]), null, 10, 2026, false);

        expect(solved.basicSalary).toBe(20000);
    });

    it('resolves a non-Basic "% of CTC" earning off the CTC too', () => {
        const withConveyance = [
            { _id: 'basic', componentName: 'Basic Salary', calculationType: 'PERCENTAGE', calculationBasis: 'GROSS_SALARY', amountPercentage: 50 },
            { _id: 'conv', componentName: 'Conveyance Allowance', calculationType: 'PERCENTAGE', calculationBasis: 'CTC', amountPercentage: 10 },
            components[2],
        ];
        const solved = solveEarningsForCtc(withConveyance, 40000, 'CAPPED_15000', new Map(), null, 10, 2026, false);

        expect(amountOf(solved, 'Conveyance Allowance')).toBe(4000);
        expect(solved.basicSalary).toBe(20000);
        expect(amountOf(solved, 'Other Allowance')).toBe(16000);
    });

    it('reports a negative remainder when Basic alone exceeds Gross', () => {
        const heavy = [{ ...components[0], amountPercentage: 100 }, components[2]];
        const solved = solveEarningsForCtc(heavy, 30000, 'CAPPED_15000', new Map(), null, 10, 2026);

        expect(solved.specialAllowanceAmount).toBeLessThan(0);
    });
});
