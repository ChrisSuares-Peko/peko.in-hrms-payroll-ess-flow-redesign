import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllCustomers, getCustomerDashboard } from '../../../api/customers';
import useCustomerData from '../../../hooks/customer/useCustomerData';

vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: vi.fn() }));
vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'apiSlice/showToast', payload })),
}));
vi.mock('../../../api/customers', () => ({
    getAllCustomers: vi.fn(),
    getCustomerDashboard: vi.fn(),
}));

const mockDispatch = vi.fn();
const baseFilters = {
    page: 1,
    itemsPerPage: 10,
    searchText: '',
    sort: 'DESC' as const,
    sortField: '',
};

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
    (useAppDispatch as any).mockReturnValue(mockDispatch);
});

describe('useCustomerData', () => {
    it('fetches list and dashboard on mount', async () => {
        (getAllCustomers as any).mockResolvedValueOnce({
            status: true,
            data: { customers: [{ id: 1, name: 'A' }], recordsTotal: 1 },
        });
        (getCustomerDashboard as any).mockResolvedValueOnce({
            status: true,
            data: {
                totalCustomers: 5,
                activeCustomers: 4,
                totalRevenue: 1000,
                avgTransaction: 200,
                topByRevenue: [{ id: '1', name: 'A' }],
                topByTransactions: [{ id: '2', name: 'B' }],
            },
        });

        const { result } = renderHook(() => useCustomerData(baseFilters));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.isDashboardLoading).toBe(false);
        });

        expect(getAllCustomers).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 'u', userType: 'merchant', page: 1 })
        );
        expect(result.current.customerList).toEqual({
            customers: [{ id: 1, name: 'A' }],
            recordsTotal: 1,
        });
        expect(result.current.stats).toEqual({
            totalCustomers: 5,
            activeCustomers: 4,
            totalRevenue: 1000,
            avgTransaction: 200,
        });
        expect(result.current.topByRevenue).toHaveLength(1);
        expect(result.current.topByTxn).toHaveLength(1);
    });

    it('shows error toast when list API status is false', async () => {
        (getAllCustomers as any).mockResolvedValueOnce({ status: false, message: 'list-err' });
        (getCustomerDashboard as any).mockResolvedValueOnce({ status: false, message: 'd-err' });

        const { result } = renderHook(() => useCustomerData(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(showToast).toHaveBeenCalledWith({ description: 'list-err', variant: 'error' });
        expect(showToast).toHaveBeenCalledWith({ description: 'd-err', variant: 'error' });
    });

    it('shows generic error toast when list API returns falsy', async () => {
        (getAllCustomers as any).mockResolvedValueOnce(false);
        (getCustomerDashboard as any).mockResolvedValueOnce({
            status: true,
            data: {
                totalCustomers: 0,
                activeCustomers: 0,
                totalRevenue: 0,
                avgTransaction: 0,
                topByRevenue: [],
                topByTransactions: [],
            },
        });

        const { result } = renderHook(() => useCustomerData(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(showToast).toHaveBeenCalledWith({
            description: 'Something went wrong while fetching customers.',
            variant: 'error',
        });
    });

    it('refetches when setRefresh(true) is called', async () => {
        (getAllCustomers as any).mockResolvedValue({
            status: true,
            data: { customers: [], recordsTotal: 0 },
        });
        (getCustomerDashboard as any).mockResolvedValue({
            status: true,
            data: {
                totalCustomers: 0,
                activeCustomers: 0,
                totalRevenue: 0,
                avgTransaction: 0,
                topByRevenue: [],
                topByTransactions: [],
            },
        });

        const { result } = renderHook(() => useCustomerData(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        const initialListCalls = (getAllCustomers as any).mock.calls.length;

        await act(async () => {
            result.current.setRefresh(true);
        });

        await waitFor(() => {
            expect((getAllCustomers as any).mock.calls.length).toBeGreaterThan(initialListCalls);
        });
    });
});
