import { useMemo, useState } from 'react';

import { calculateCtcBreakdown } from '../../utils/ctcCalculator/calculateCtcBreakdown';
import { CtcDeductionComponent, CtcEarningComponent, PfWagePolicy } from '../../utils/ctcCalculator/types';

// Shared session-local editing state for the CTC Calculator's earnings/deductions —
// used by both the standalone Dashboard Calculator page and the Add Employee Salary
// Information step. Edits here never write back to org Salary/Deduction Components;
// call hydrate() once the org's real components have loaded to seed the starting structure.
export function useCtcCalculatorState(epfPolicy: PfWagePolicy, epfApplicable = true, showPfInEarnings = false) {
    const [annualCTC, setAnnualCTC] = useState<number>(0);
    const [earnings, setEarnings] = useState<CtcEarningComponent[]>([]);
    const [deductions, setDeductions] = useState<CtcDeductionComponent[]>([]);
    const [hydrated, setHydrated] = useState(false);

    const hydrate = (
        nextEarnings: CtcEarningComponent[],
        nextDeductions: CtcDeductionComponent[],
        nextAnnualCTC?: number
    ) => {
        setEarnings(nextEarnings);
        setDeductions(nextDeductions);
        if (nextAnnualCTC != null) setAnnualCTC(nextAnnualCTC);
        setHydrated(true);
    };

    const upsertEarning = (earning: CtcEarningComponent) => {
        setEarnings(prev => {
            const exists = prev.some(e => e.id === earning.id);
            return exists ? prev.map(e => (e.id === earning.id ? earning : e)) : [...prev, earning];
        });
    };
    const removeEarning = (earning: CtcEarningComponent) => {
        setEarnings(prev => prev.filter(e => e.id !== earning.id));
    };
    const upsertDeduction = (deduction: CtcDeductionComponent) => {
        setDeductions(prev => {
            const exists = prev.some(d => d.id === deduction.id);
            return exists ? prev.map(d => (d.id === deduction.id ? deduction : d)) : [...prev, deduction];
        });
    };
    const removeDeduction = (deduction: CtcDeductionComponent) => {
        setDeductions(prev => prev.filter(d => d.id !== deduction.id));
    };

    const breakdown = useMemo(
        () => calculateCtcBreakdown({ annualCTC, epfPolicy, epfApplicable, showPfInEarnings, earnings, deductions }),
        [annualCTC, epfPolicy, epfApplicable, showPfInEarnings, earnings, deductions]
    );

    const hasBalancingEarning = earnings.some(e => e.calculationType === 'BALANCING');

    return {
        annualCTC,
        setAnnualCTC,
        earnings,
        deductions,
        hydrated,
        hydrate,
        upsertEarning,
        removeEarning,
        upsertDeduction,
        removeDeduction,
        breakdown,
        hasBalancingEarning,
    };
}
