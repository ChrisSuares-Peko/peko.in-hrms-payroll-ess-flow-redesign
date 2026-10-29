import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllCustomers } from '../../../api/customers';
import useCustomers from '../../../hooks/agreement/useCustomers';

vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: vi.fn() }));
vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'apiSlice/showToast', payload })),
}));
vi.mock('../../../api/customers', () => ({
    getAllCustomers: vi.fn(),
}));

const mockDispatch = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
    (useAppDispatch as any).mockReturnValue(mockDispatch);
});

describe('useCustomers', () => {
    it('fetches customers and builds dropdown options on success', async () => {
        (getAllCustomers as any).mockResolvedValueOnce({
            status: true,
            data: {
                customers: [
                    { id: '1', name: 'Acme' },
                    { id: '2', name: 'Beta' },
                ],
            },
        });

        const { result } = renderHook(() => useCustomers());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getAllCustomers).toHaveBeenCalledWith({
            userId: 'u',
            userType: 'merchant',
            itemsPerPage: undefined,
            searchText: undefined,
        });
        expect(result.current.customers).toHaveLength(2);
        expect(result.current.options).toEqual([
            { label: 'Acme', value: 1 },
            { label: 'Beta', value: 2 },
        ]);
    });

    it('passes searchText and itemsPerPage when provided', async () => {
        (getAllCustomers as any).mockResolvedValueOnce({
            status: true,
            data: { customers: [] },
        });

        renderHook(() => useCustomers('foo', 50));

        await waitFor(() =>
            expect(getAllCustomers).toHaveBeenCalledWith(
                expect.objectContaining({ searchText: 'foo', itemsPerPage: 50 })
            )
        );
    });

    it('shows error toast on status false', async () => {
        (getAllCustomers as any).mockResolvedValueOnce({ status: false, message: 'err' });

        const { result } = renderHook(() => useCustomers());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(showToast).toHaveBeenCalledWith({ description: 'err', variant: 'error' });
        expect(result.current.customers).toEqual([]);
        expect(result.current.options).toEqual([]);
    });

    it('keeps state empty when API returns falsy', async () => {
        (getAllCustomers as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useCustomers());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(showToast).not.toHaveBeenCalled();
        expect(result.current.customers).toEqual([]);
    });

    it('refetch invokes the API again', async () => {
        (getAllCustomers as any).mockResolvedValue({
            status: true,
            data: { customers: [] },
        });

        const { result } = renderHook(() => useCustomers());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getAllCustomers).toHaveBeenCalledTimes(1);

        await result.current.refetch();
        expect(getAllCustomers).toHaveBeenCalledTimes(2);
    });
});
