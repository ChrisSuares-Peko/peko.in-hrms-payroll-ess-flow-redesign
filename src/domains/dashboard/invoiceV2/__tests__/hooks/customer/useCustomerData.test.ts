import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { getAllCustomers, getCustomerDashboard } from '../../../api/customers';
import useCustomerData from '../../../hooks/customer/useCustomerData';

vi.mock('../../../api/customers', () => ({
    getAllCustomers: vi.fn(),
    getCustomerDashboard: vi.fn(),
}));

const dispatchMock = vi.fn();

vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'user123', role: 'admin' })),
}));

describe('useCustomerData', () => {
    const filters = { searchText: '', page: 1, itemsPerPage: 10, sort: 'DESC' as const };

    const dashboard = {
        totalCustomers: 10,
        activeCustomers: 8,
        totalRevenue: 100,
        avgTransaction: 10,
        topByRevenue: [{ id: 1 }],
        topByTransactions: [{ id: 2 }],
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch customer list and dashboard on mount', async () => {
        (getAllCustomers as Mock).mockResolvedValue({
            status: true,
            data: { customers: [{ id: 1 }], recordsTotal: 1 },
        });
        (getCustomerDashboard as Mock).mockResolvedValue({ status: true, data: dashboard });

        const { result } = renderHook(() => useCustomerData(filters));

        await waitFor(() => expect(result.current.isLoading).toBeFalsy());
        await waitFor(() => expect(result.current.isDashboardLoading).toBeFalsy());

        expect(result.current.customerList).toEqual({ customers: [{ id: 1 }], recordsTotal: 1 });
        expect(result.current.stats.totalCustomers).toBe(10);
        expect(result.current.topByRevenue).toEqual([{ id: 1 }]);
        expect(result.current.topByTxn).toEqual([{ id: 2 }]);
    });

    it('should show error toast when list API returns failure', async () => {
        (getAllCustomers as Mock).mockResolvedValue({ status: false, message: 'err' });
        (getCustomerDashboard as Mock).mockResolvedValue({ status: true, data: dashboard });

        renderHook(() => useCustomerData(filters));

        await waitFor(() =>
            expect(dispatchMock).toHaveBeenCalledWith(
                showToast({ description: 'err', variant: 'error' })
            )
        );
    });

    it('should show generic error toast when list API resolves falsy', async () => {
        (getAllCustomers as Mock).mockResolvedValue(false);
        (getCustomerDashboard as Mock).mockResolvedValue({ status: true, data: dashboard });

        renderHook(() => useCustomerData(filters));

        await waitFor(() =>
            expect(dispatchMock).toHaveBeenCalledWith(
                showToast({
                    description: 'Something went wrong while fetching customers.',
                    variant: 'error',
                })
            )
        );
    });

    it('should show error toast when dashboard API returns failure', async () => {
        (getAllCustomers as Mock).mockResolvedValue({ status: true, data: { customers: [] } });
        (getCustomerDashboard as Mock).mockResolvedValue({ status: false, message: 'dash-err' });

        renderHook(() => useCustomerData(filters));

        await waitFor(() =>
            expect(dispatchMock).toHaveBeenCalledWith(
                showToast({ description: 'dash-err', variant: 'error' })
            )
        );
    });
});
