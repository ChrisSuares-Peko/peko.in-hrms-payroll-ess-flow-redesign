import { CtcBreakdown } from './types';

// Adapts the backend's GET .../ctc-calculator/employee/:employeeId response (forward
// calculation from an employee's already-persisted components) into the same CtcBreakdown
// shape the reverse-solve frontend engine produces, so CtcBreakdownCard can render either.
export const adaptEmployeeCtcResponse = (response: any): CtcBreakdown => ({
    annualCTC: response?.annualCtc ?? 0,
    monthlyCTC: response?.costToCompany ?? 0,
    basicSalary: response?.basicSalary ?? 0,
    grossSalary: response?.grossSalary ?? 0,
    earnings: response?.earnings || [],
    employerPf: response?.employerPf ?? { pfWage: 0, ceiling: 0, employeeEpf: 0, employerEps: 0, employerEpf: 0, edli: 0, adminCharges: 0, employerTotal: 0, totalDeposit: 0, adminEdli: 0, total: 0 },
    epfPolicy: response?.epfPolicy,
    epfApplicable: response?.epfApplicable !== false,
    showPfInEarnings: response?.showPfInEarnings === true,
    esi: response?.esi,
    lwf: response?.lwf,
    costToCompany: response?.costToCompany ?? 0,
    deductions: response?.deductions || [],
    totalDeductions: response?.totalDeductions ?? 0,
    netTakeHome: response?.netTakeHome ?? 0,
    warnings: response?.warnings || [],
    // The backend doesn't return a dedicated flag for this — derived from its warnings
    // array, matching the same condition calculateCtcBreakdown.ts computes client-side
    // (see ctcCalculator.js's identical message for the specialAllowanceAmount < 0 case).
    isOverBudget: (response?.warnings || []).some((w: string) => w.includes('add up to more than this CTC allows')),
});
