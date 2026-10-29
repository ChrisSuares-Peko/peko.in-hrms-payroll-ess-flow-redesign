import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { employeeSalaryListing } from '../../../../api/employeeSalaryApi/employeeSalary';
import { useGetEmployeeSalaryApi } from '../../../../hooks/employeeSalaryHooks/salaryTableHooks/useGetAllEmployeeSalaryApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../../../api/employeeSalaryApi/employeeSalary', () => ({
    employeeSalaryListing: vi.fn(),
}));

const buildRow = (overrides: Record<string, any> = {}) => ({
    id: 'salary-1',
    employee: {
        id: 'emp-1',
        personalInformation: { fullName: 'Arjun Mehta', email: 'arjun@example.com' },
        employeeInformation: { employeeId: 'EMP001', designation: 'Software Engineer', employeeStatus: 'ACTIVE' },
        profileImage: '',
        offBoardingInformation: {},
    },
    department: { departmentName: 'Sales' },
    salaryInformation: {
        basicPay: 20000,
        hraAmount: 5000,
        daAmount: 0,
        bonus: 0,
        incentiveAmount: 0,
        increamentAmount: 0,
        overtimeAmount: 0,
        other: 1000,
        deductionAmount: 1800,
        leavesAmount: 0,
    },
    paymentStatus: 'PENDING',
    totalPayable: 24200,
    ...overrides,
});

describe('useGetEmployeeSalaryApi — Total Earning column', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
            fn({ reducer: { auth: { role: 'admin', id: 5 } } })
        );
    });

    it('sums Basic Pay plus every allowance key into "monthlySalary" (the Total Earning column)', async () => {
        (employeeSalaryListing as Mock).mockResolvedValue({
            rows: [buildRow()],
            count: 1,
            salaryCycle: null,
        });

        const { result } = renderHook(() =>
            useGetEmployeeSalaryApi('', 'ASC', 1, 10, '', 2026, 7, false)
        );

        await waitFor(() => expect(result.current.tableLoading).toBe(false));

        // 20000 (basic) + 5000 (HRA) + 1000 (other) = 26000 — matches the reported example.
        // "monthlySalary" backs the Total Earning column but isn't declared on salarytableType.
        expect((result.current.tableDatas[0] as any).monthlySalary).toBe('₹ 26,000.00');
        expect(result.current.tableDatas[0].basicSalary).toBe('₹ 20,000.00');
    });

    it('does not double-count Basic Pay when every allowance key is zero', async () => {
        (employeeSalaryListing as Mock).mockResolvedValue({
            rows: [
                buildRow({
                    salaryInformation: {
                        basicPay: 20000,
                        hraAmount: 0,
                        daAmount: 0,
                        bonus: 0,
                        incentiveAmount: 0,
                        increamentAmount: 0,
                        overtimeAmount: 0,
                        other: 0,
                        deductionAmount: 0,
                        leavesAmount: 0,
                    },
                }),
            ],
            count: 1,
            salaryCycle: null,
        });

        const { result } = renderHook(() =>
            useGetEmployeeSalaryApi('', 'ASC', 1, 10, '', 2026, 7, false)
        );

        await waitFor(() => expect(result.current.tableLoading).toBe(false));

        expect((result.current.tableDatas[0] as any).monthlySalary).toBe('₹ 20,000.00');
    });

    it('resets to an empty, zeroed state when the API call fails', async () => {
        (employeeSalaryListing as Mock).mockResolvedValue(false);

        const { result } = renderHook(() =>
            useGetEmployeeSalaryApi('', 'ASC', 1, 10, '', 2026, 7, false)
        );

        await waitFor(() => expect(result.current.tableLoading).toBe(false));

        expect(result.current.tableDatas).toEqual([]);
        expect(result.current.orderCount).toBe(0);
    });
});
