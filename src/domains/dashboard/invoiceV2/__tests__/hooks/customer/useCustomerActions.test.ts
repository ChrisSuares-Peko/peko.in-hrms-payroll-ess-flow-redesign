import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { addNewCustomer, deleteCustomerApi, editCustomerApi } from '../../../api/customers';
import useCustomerActions from '../../../hooks/customer/useCustomerActions';

vi.mock('../../../api/customers', () => ({
    addNewCustomer: vi.fn(),
    deleteCustomerApi: vi.fn(),
    editCustomerApi: vi.fn(),
}));

const dispatchMock = vi.fn();

vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'user123', role: 'admin' })),
}));

describe('useCustomerActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('addCustomer returns true and dispatches success toast', async () => {
        (addNewCustomer as Mock).mockResolvedValue({ status: true });
        const onSuccess = vi.fn();

        const { result } = renderHook(() => useCustomerActions(onSuccess));
        let ok = false;
        await act(async () => {
            ok = await result.current.addCustomer({ name: 'Arshid' } as any);
        });

        expect(ok).toBe(true);
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Customer added successfully', variant: 'success' })
        );
        expect(onSuccess).toHaveBeenCalled();
    });

    it('addCustomer shows error toast on failure', async () => {
        (addNewCustomer as Mock).mockResolvedValue({ status: false, message: 'dup' });

        const { result } = renderHook(() => useCustomerActions());
        let ok = true;
        await act(async () => {
            ok = await result.current.addCustomer({ name: 'x' } as any);
        });

        expect(ok).toBe(false);
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'dup', variant: 'error' })
        );
    });

    it('editCustomer returns true on success', async () => {
        (editCustomerApi as Mock).mockResolvedValue({ status: true });

        const { result } = renderHook(() => useCustomerActions());
        let ok = false;
        await act(async () => {
            ok = await result.current.editCustomer('5', { name: 'Arshid' } as any);
        });

        expect(ok).toBe(true);
        expect(editCustomerApi).toHaveBeenCalledWith('5', {
            userId: 'user123',
            userType: 'admin',
            name: 'Arshid',
        });
    });

    it('deleteCustomer calls API and shows success toast', async () => {
        (deleteCustomerApi as Mock).mockResolvedValue({ status: true });
        const onSuccess = vi.fn();

        const { result } = renderHook(() => useCustomerActions(onSuccess));
        await act(async () => {
            await result.current.deleteCustomer('5');
        });

        expect(deleteCustomerApi).toHaveBeenCalledWith({
            userId: 'user123',
            userType: 'admin',
            customerId: '5',
        });
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Customer deleted successfully', variant: 'success' })
        );
        expect(onSuccess).toHaveBeenCalled();
    });

    it('deleteCustomer shows error toast on failure', async () => {
        (deleteCustomerApi as Mock).mockResolvedValue({ status: false, message: 'no' });

        const { result } = renderHook(() => useCustomerActions());
        await act(async () => {
            await result.current.deleteCustomer('5');
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'no', variant: 'error' })
        );
    });
});
