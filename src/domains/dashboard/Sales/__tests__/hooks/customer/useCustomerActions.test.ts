import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { addNewCustomer, deleteCustomerApi, editCustomerApi } from '../../../api/customers';
import useCustomerActions from '../../../hooks/customer/useCustomerActions';

vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: vi.fn() }));
vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'apiSlice/showToast', payload })),
}));
vi.mock('../../../api/customers', () => ({
    addNewCustomer: vi.fn(),
    editCustomerApi: vi.fn(),
    deleteCustomerApi: vi.fn(),
}));

const mockDispatch = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
    (useAppDispatch as any).mockReturnValue(mockDispatch);
});

describe('useCustomerActions - addCustomer', () => {
    it('returns true and triggers onSuccess when API succeeds', async () => {
        const onSuccess = vi.fn();
        (addNewCustomer as any).mockResolvedValueOnce({ status: true });

        const { result } = renderHook(() => useCustomerActions(onSuccess));

        let returned: any;
        await act(async () => {
            returned = await result.current.addCustomer({ name: 'A' } as any);
        });

        expect(addNewCustomer).toHaveBeenCalledWith({
            userId: 'u',
            userType: 'merchant',
            name: 'A',
        });
        expect(showToast).toHaveBeenCalledWith({
            description: 'Customer added successfully',
            variant: 'success',
        });
        expect(onSuccess).toHaveBeenCalled();
        expect(returned).toBe(true);
    });

    it('returns false and shows error toast on status false', async () => {
        (addNewCustomer as any).mockResolvedValueOnce({ status: false, message: 'bad' });

        const { result } = renderHook(() => useCustomerActions());

        let returned: any;
        await act(async () => {
            returned = await result.current.addCustomer({} as any);
        });

        expect(showToast).toHaveBeenCalledWith({ description: 'bad', variant: 'error' });
        expect(returned).toBe(false);
    });

    it('returns false silently when API returns falsy', async () => {
        (addNewCustomer as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useCustomerActions());

        let returned: any;
        await act(async () => {
            returned = await result.current.addCustomer({} as any);
        });

        expect(showToast).not.toHaveBeenCalled();
        expect(returned).toBe(false);
    });
});

describe('useCustomerActions - editCustomer', () => {
    it('returns true and shows success toast', async () => {
        const onSuccess = vi.fn();
        (editCustomerApi as any).mockResolvedValueOnce({ status: true });

        const { result } = renderHook(() => useCustomerActions(onSuccess));

        let returned: any;
        await act(async () => {
            returned = await result.current.editCustomer('c-1', { name: 'B' } as any);
        });

        expect(editCustomerApi).toHaveBeenCalledWith('c-1', {
            userId: 'u',
            userType: 'merchant',
            name: 'B',
        });
        expect(showToast).toHaveBeenCalledWith({
            description: 'Customer updated successfully',
            variant: 'success',
        });
        expect(onSuccess).toHaveBeenCalled();
        expect(returned).toBe(true);
    });

    it('returns false and shows error toast on failure', async () => {
        (editCustomerApi as any).mockResolvedValueOnce({ status: false, message: 'nope' });

        const { result } = renderHook(() => useCustomerActions());

        let returned: any;
        await act(async () => {
            returned = await result.current.editCustomer('c', {} as any);
        });

        expect(showToast).toHaveBeenCalledWith({ description: 'nope', variant: 'error' });
        expect(returned).toBe(false);
    });
});

describe('useCustomerActions - deleteCustomer', () => {
    it('shows success toast and triggers onSuccess', async () => {
        const onSuccess = vi.fn();
        (deleteCustomerApi as any).mockResolvedValueOnce({ status: true });

        const { result } = renderHook(() => useCustomerActions(onSuccess));

        await act(async () => {
            await result.current.deleteCustomer('c-1');
        });

        expect(deleteCustomerApi).toHaveBeenCalledWith({
            userId: 'u',
            userType: 'merchant',
            customerId: 'c-1',
        });
        expect(showToast).toHaveBeenCalledWith({
            description: 'Customer deleted successfully',
            variant: 'success',
        });
        expect(onSuccess).toHaveBeenCalled();
    });

    it('shows error toast on failure', async () => {
        (deleteCustomerApi as any).mockResolvedValueOnce({ status: false, message: 'err' });

        const { result } = renderHook(() => useCustomerActions());

        await act(async () => {
            await result.current.deleteCustomer('c');
        });

        expect(showToast).toHaveBeenCalledWith({ description: 'err', variant: 'error' });
    });
});
