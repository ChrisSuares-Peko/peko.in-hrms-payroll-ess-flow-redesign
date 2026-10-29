import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SalaryProfileTab from '../../../components/EmployeeSalary/SalaryProfileTab';

const baseProps = {
    salaryRows: [{ key: 'basic', componentName: 'Basic Salary', category: 'Earning', amount: 50000 }],
    totals: { totalEarnings: 100000, totalDeductions: 5000, netSalary: 95000 },
    tableLoading: false,
    month: 10,
    year: 2026,
    status: 'UPCOMING',
    deductions: [
        { componentName: "PF Employee's Contribution", badge: 'Statutory', amount: 3000 },
        { componentName: 'Income Tax (TDS)', badge: 'Section 192', amount: 2000 },
    ],
};

describe('SalaryProfileTab — Edit TDS (Old Tax Regime only)', () => {
    it('shows no Edit TDS action when editing is not allowed (New Tax Regime / locked month)', () => {
        render(<SalaryProfileTab {...baseProps} tdsEdit={{ allowed: false, effectiveFrom: null, applyToFutureMonths: null }} onSaveTds={vi.fn()} />);
        expect(screen.queryByTestId('edit-tds-button')).toBeNull();
    });

    it('shows Edit TDS when allowed, and where the HR-entered amount applies from', () => {
        render(
            <SalaryProfileTab
                {...baseProps}
                tdsEdit={{ allowed: true, effectiveFrom: { month: 10, year: 2026 }, applyToFutureMonths: true }}
                onSaveTds={vi.fn()}
            />
        );
        expect(screen.getByTestId('edit-tds-button')).toBeTruthy();
        expect(screen.getByText(/Entered by HR, applies from Oct 2026/)).toBeTruthy();
    });

    it('saves the entered amount for this month only by default', { timeout: 15000 }, async () => {
        const onSaveTds = vi.fn().mockResolvedValue(true);
        render(<SalaryProfileTab {...baseProps} tdsEdit={{ allowed: true, effectiveFrom: null, applyToFutureMonths: null }} onSaveTds={onSaveTds} />);

        fireEvent.click(screen.getByTestId('edit-tds-button'));
        const input = await screen.findByTestId('tds-amount-input', {}, { timeout: 5000 });
        fireEvent.change(input, { target: { value: '18000' } });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        });

        await waitFor(() => expect(onSaveTds).toHaveBeenCalledWith(18000, false), { timeout: 5000 });
    });

    it('saves for all future months when the checkbox is ticked', { timeout: 15000 }, async () => {
        const onSaveTds = vi.fn().mockResolvedValue(true);
        render(<SalaryProfileTab {...baseProps} tdsEdit={{ allowed: true, effectiveFrom: null, applyToFutureMonths: null }} onSaveTds={onSaveTds} />);

        fireEvent.click(screen.getByTestId('edit-tds-button'));
        const input = await screen.findByTestId('tds-amount-input', {}, { timeout: 5000 });
        fireEvent.change(input, { target: { value: '18000' } });
        fireEvent.click(screen.getByTestId('tds-apply-future'));
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        });

        await waitFor(() => expect(onSaveTds).toHaveBeenCalledWith(18000, true), { timeout: 5000 });
    });

    it('labels a this-month-only entry', () => {
        render(
            <SalaryProfileTab
                {...baseProps}
                tdsEdit={{ allowed: true, effectiveFrom: { month: 10, year: 2026 }, applyToFutureMonths: false }}
                onSaveTds={vi.fn()}
            />
        );
        expect(screen.getByText('Entered by HR for Oct 2026 only')).toBeTruthy();
    });
});
