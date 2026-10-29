import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getDeduction } from '../../../api/employeeProfileApi';
import { useGetAllDeduction } from '../../../hooks/employeeProfileHooks/useGetEmployeeDeductionApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../../api/employeeProfileApi', () => ({
    getDeduction: vi.fn(),
}));

describe('useGetAllDeduction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
            fn({ reducer: { auth: { role: 'admin', id: 5 } } })
        );
    });

    it('surfaces totalDeductions as "amount" — the sum of active deductions, not an unrelated field', async () => {
        (getDeduction as Mock).mockResolvedValue({
            data: [
                {
                    deductionName: 'Provident Fund (PF)',
                    calculationType: 'FIXED',
                    amountPercentage: 1800,
                    calculationBasis: 'MONTHLY',
                    status: 'ACTIVE',
                    isGlobal: false,
                    id: '1',
                    salaryDeductionType: 'BASIC_SALARY',
                },
            ],
            totalCount: 1,
            totalDeductions: 1800,
        });

        const { result } = renderHook(() =>
            useGetAllDeduction('emp-1', 1, 10, 2026, 7, false)
        );

        await waitFor(() => expect(result.current.tableLoading).toBe(false));

        expect(result.current.amount).toBe(1800);
        expect(result.current.count).toBe(1);
        expect(result.current.data).toEqual([
            {
                deductionName: 'Provident Fund (PF)',
                deductionType: '',
                calculationType: 'FIXED',
                amountPercentage: 1800,
                calculationBasis: 'MONTHLY',
                isGlobal: false,
                status: 'ACTIVE',
                id: '1',
                salaryDeductionType: 'BASIC_SALARY',
            },
        ]);
    });

    it('skips the API call and stops loading when no employeeId is provided', async () => {
        const { result } = renderHook(() => useGetAllDeduction(undefined, 1, 10, 2026, 7, false));

        await waitFor(() => expect(result.current.tableLoading).toBe(false));

        expect(getDeduction).not.toHaveBeenCalled();
        expect(result.current.data).toEqual([]);
    });

    it('does not update amount/data when the API call fails', async () => {
        (getDeduction as Mock).mockResolvedValue(false);

        const { result } = renderHook(() =>
            useGetAllDeduction('emp-1', 1, 10, 2026, 7, false)
        );

        await waitFor(() => expect(result.current.tableLoading).toBe(false));

        expect(result.current.amount).toBeUndefined();
        expect(result.current.data).toEqual([]);
    });
});
