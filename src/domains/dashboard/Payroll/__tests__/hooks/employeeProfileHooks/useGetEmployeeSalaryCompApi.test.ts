import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getEmployeeSalaryComp } from '../../../api/employeeProfileApi/index';
import { useGetEmployeeSalaryComp } from '../../../hooks/employeeProfileHooks/useGetEmployeeSalaryCompApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../../api/employeeProfileApi/index', () => ({
    getEmployeeSalaryComp: vi.fn(),
}));

describe('useGetEmployeeSalaryComp', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
            fn({
                reducer: {
                    auth: { role: 'admin', id: 5 },
                    orgSettings: { refreshSalaryComp: false },
                },
            })
        );
    });

    it("surfaces totalEarnings as \"amount\" — not the unrelated (and misleadingly-named) grossSalary field", async () => {
        (getEmployeeSalaryComp as Mock).mockResolvedValue({
            componentData: [
                { id: '1', componentName: 'Basic Salary', calculationType: 'FIXED', amountPercentage: 10000, status: 'ACTIVE', isGlobal: true },
            ],
            totalCount: 1,
            totalEarnings: 16000,
            grossSalary: 14500, // net-of-deductions figure — must NOT be what "amount" surfaces
        });

        const { result } = renderHook(() => useGetEmployeeSalaryComp('emp-1', 1, 10, false));

        await waitFor(() => expect(result.current.tableLoading).toBe(false));

        expect(result.current.amount).toBe(16000);
        expect(result.current.count).toBe(1);
        expect(result.current.data).toEqual([
            {
                componentName: 'Basic Salary',
                calculationType: 'FIXED',
                amountPercentage: 10000,
                calculationBasedOn: '',
                status: 'ACTIVE',
                isGlobal: true,
                id: '1',
                action: '',
            },
        ]);
    });

    it('leaves data empty and amount undefined when the API call fails', async () => {
        (getEmployeeSalaryComp as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useGetEmployeeSalaryComp('emp-1', 1, 10, false));

        await waitFor(() => expect(result.current.tableLoading).toBe(false));

        expect(result.current.amount).toBeUndefined();
        expect(result.current.data).toEqual([]);
    });

    it('refetches when the page, limit, or employeeId changes', async () => {
        (getEmployeeSalaryComp as Mock).mockResolvedValue({
            componentData: [],
            totalCount: 0,
            totalEarnings: 0,
        });

        const { rerender } = renderHook(
            ({ employeeId, page }) => useGetEmployeeSalaryComp(employeeId, page, 10, false),
            { initialProps: { employeeId: 'emp-1', page: 1 } }
        );
        await waitFor(() => expect(getEmployeeSalaryComp).toHaveBeenCalledTimes(1));

        rerender({ employeeId: 'emp-1', page: 2 });
        await waitFor(() => expect(getEmployeeSalaryComp).toHaveBeenCalledTimes(2));
        expect(getEmployeeSalaryComp).toHaveBeenLastCalledWith(
            expect.objectContaining({ page: 2 })
        );
    });
});
