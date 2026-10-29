import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CtcBreakdownCard from '../../../components/ctcCalculator/CtcBreakdownCard';
import { CtcBreakdown } from '../../../utils/ctcCalculator/types';

const breakdown: CtcBreakdown = {
    annualCTC: 1200000,
    monthlyCTC: 100000,
    basicSalary: 48375,
    grossSalary: 96750,
    earnings: [
        { id: 'basic', componentName: 'Basic Salary', calculationType: 'PERCENTAGE', calculatedAmount: 48375 },
        { id: 'other', componentName: 'Other Allowance', calculationType: 'BALANCING', calculatedAmount: 48375 },
    ],
    employerPf: {
        pfWage: 25000,
        ceiling: 25000,
        employeeEpf: 3000,
        employerEps: 2083,
        employerEpf: 917,
        edli: 125,
        adminCharges: 125,
        employerTotal: 3250,
        totalDeposit: 6250,
        adminEdli: 250,
        total: 3250,
    },
    costToCompany: 100000,
    deductions: [
        { id: 'pf', deductionName: 'Provident Fund (PF)', calculationType: 'FIXED', calculatedAmount: 3000 },
    ],
    totalDeductions: 3000,
    netTakeHome: 93750,
    warnings: [],
    isOverBudget: false,
};

describe('CtcBreakdownCard — Income Tax (TDS) row (Old Tax Regime only)', () => {
    it('shows no TDS row and keeps "before income tax" when no incomeTax is passed', () => {
        render(<CtcBreakdownCard breakdown={breakdown} editable lockStatutoryDeductions hideNote />);
        expect(screen.queryByText('Income Tax (TDS)')).toBeNull();
        expect(screen.getByText('Net Take-Home (before income tax)')).toBeTruthy();
        expect(screen.getByText('₹ 93,750 / month')).toBeTruthy();
    });

    it('adds the HR-entered TDS to Total Deductions and shows take-home after income tax', () => {
        render(
            <CtcBreakdownCard
                breakdown={breakdown}
                editable
                lockStatutoryDeductions
                hideNote
                incomeTax={{ amount: 18000, badge: 'Old Tax Regime — entered by HR', onEdit: vi.fn() }}
            />
        );
        expect(screen.getByText('Income Tax (TDS)')).toBeTruthy();
        expect(screen.getByText('₹ 21,000 / month')).toBeTruthy(); // 3,000 PF + 18,000 TDS
        expect(screen.getByText('Net Take-Home (after income tax)')).toBeTruthy();
        expect(screen.getByText('₹ 75,750 / month')).toBeTruthy(); // 93,750 − 18,000
    });

    it('shows the row at ₹0 without changing totals before an amount is entered', () => {
        render(
            <CtcBreakdownCard
                breakdown={breakdown}
                editable
                lockStatutoryDeductions
                hideNote
                incomeTax={{ amount: 0, badge: 'Old Tax Regime — not entered yet', onEdit: vi.fn() }}
            />
        );
        expect(screen.getByText('Income Tax (TDS)')).toBeTruthy();
        expect(screen.getByText('Net Take-Home (before income tax)')).toBeTruthy();
        expect(screen.getByText('₹ 93,750 / month')).toBeTruthy();
    });
});
