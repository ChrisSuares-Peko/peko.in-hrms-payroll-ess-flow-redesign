import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getMyPayslips } from '../../api/payslips';
import { useMyPayslips } from '../../hooks/useMyPayslips';

vi.mock('../../api/payslips', () => ({
    getMyPayslips: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 1, role: 'employee' })),
    useAppDispatch: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useMyPayslips', () => {
    it('starts in a loading state with empty rows', () => {
        (getMyPayslips as Mock).mockReturnValue(new Promise(() => {}));

        const { result } = renderHook(() => useMyPayslips('2024'));

        expect(result.current.loading).toBe(true);
        expect(result.current.rows).toEqual([]);
    });

    it('fetches payslips for the given year and sets rows on success', async () => {
        const mockRows = [
            { id: 'p1', month: 'January', netPay: 50000 },
            { id: 'p2', month: 'February', netPay: 51000 },
        ];
        (getMyPayslips as Mock).mockResolvedValueOnce({ rows: mockRows });

        const { result } = renderHook(() => useMyPayslips('2024'));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(getMyPayslips).toHaveBeenCalledWith(
            { userType: 'employee', userId: 1 },
            { year: '2024' }
        );
        expect(result.current.rows).toEqual(mockRows);
    });

    it('sets rows to an empty array when the API returns false', async () => {
        (getMyPayslips as Mock).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useMyPayslips('2024'));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.rows).toEqual([]);
    });

    it('refetches when the year argument changes', async () => {
        (getMyPayslips as Mock).mockResolvedValue({ rows: [] });

        const { result, rerender } = renderHook(({ year }) => useMyPayslips(year), {
            initialProps: { year: '2024' },
        });

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(getMyPayslips).toHaveBeenCalledTimes(1);
        expect(getMyPayslips).toHaveBeenLastCalledWith(
            { userType: 'employee', userId: 1 },
            { year: '2024' }
        );

        rerender({ year: '2025' });

        await waitFor(() => expect(getMyPayslips).toHaveBeenCalledTimes(2));
        expect(getMyPayslips).toHaveBeenLastCalledWith(
            { userType: 'employee', userId: 1 },
            { year: '2025' }
        );
    });
});
