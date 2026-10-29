const { lwfFor } = require('../lwfCalc');

describe('lwfFor — opt-IN convention for Labour Welfare Fund', () => {
    it('is not applicable for an employee who has never had this field touched (undefined, not false)', () => {
        const result = lwfFor({
            employee: { otherConfigurations: {} },
            month: 6,
            year: 2026,
            complianceSettings: {},
            grossSalary: 50000,
        });
        expect(result.configured).toBe(false);
        expect(result.employeeAmount).toBe(0);
        expect(result.employerAmount).toBe(0);
    });

    it('is not applicable when otherConfigurations itself is missing entirely', () => {
        const result = lwfFor({ employee: {}, month: 6, year: 2026, complianceSettings: {}, grossSalary: 50000 });
        expect(result.configured).toBe(false);
    });

    it('is not applicable when explicitly opted out (false)', () => {
        const result = lwfFor({
            employee: { otherConfigurations: { laborWelfareFund: false } },
            month: 6,
            year: 2026,
            complianceSettings: {},
            grossSalary: 50000,
        });
        expect(result.configured).toBe(false);
    });

    it('is configured and resolves amounts when explicitly opted in (true)', () => {
        const result = lwfFor({
            employee: {
                otherConfigurations: {
                    laborWelfareFund: true,
                    lwf: { workState: 'Maharashtra', employeeShareType: 'FLAT', employeeShareValue: 12, employerShareType: 'FLAT', employerShareValue: 6 },
                },
            },
            month: 6,
            year: 2026,
            complianceSettings: {},
            grossSalary: 50000,
        });
        expect(result.configured).toBe(true);
        expect(result.employeeAmount).toBe(12);
        expect(result.employerAmount).toBe(6);
    });
});
