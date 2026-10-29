import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { verifyCustomerBankApi } from '../../../api/customers';
import useVerifyCustomerBank from '../../../hooks/customer/useVerifyCustomerBank';

vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: vi.fn() }));
vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'apiSlice/showToast', payload })),
}));
vi.mock('../../../api/customers', () => ({
    verifyCustomerBankApi: vi.fn(),
}));

const mockDispatch = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
    (useAppDispatch as any).mockReturnValue(mockDispatch);
});

describe('useVerifyCustomerBank', () => {
    const formValues: any = {
        accountNumber: '1234567890',
        ifscCode: 'HDFC0001234',
        accountHolderName: 'John Doe',
    };

    it('returns enriched values with verifyToken on success', async () => {
        (verifyCustomerBankApi as any).mockResolvedValueOnce({
            status: true,
            data: { verifyToken: 'token-1' },
        });

        const { result } = renderHook(() => useVerifyCustomerBank());

        let returned: any;
        await act(async () => {
            returned = await result.current.verifyBankAccount(formValues);
        });

        expect(verifyCustomerBankApi).toHaveBeenCalledWith({
            userId: 'u',
            userType: 'merchant',
            bank_account: '1234567890',
            ifsc: 'HDFC0001234',
            name: 'John Doe',
        });
        expect(returned).toEqual({ ...formValues, verifyToken: 'token-1' });
        expect(result.current.isVerifying).toBe(false);
    });

    it('shows API message when status false and returns null', async () => {
        (verifyCustomerBankApi as any).mockResolvedValueOnce({
            status: false,
            message: 'invalid IFSC',
        });

        const { result } = renderHook(() => useVerifyCustomerBank());

        let returned: any;
        await act(async () => {
            returned = await result.current.verifyBankAccount(formValues);
        });

        expect(showToast).toHaveBeenCalledWith({
            description: 'invalid IFSC',
            variant: 'error',
        });
        expect(returned).toBeNull();
    });

    it('shows generic error and returns null when API returns falsy', async () => {
        (verifyCustomerBankApi as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useVerifyCustomerBank());

        let returned: any;
        await act(async () => {
            returned = await result.current.verifyBankAccount(formValues);
        });

        expect(showToast).toHaveBeenCalledWith({
            description: 'Failed to verify bank account.',
            variant: 'error',
        });
        expect(returned).toBeNull();
    });

    it('always resets isVerifying after the call', async () => {
        (verifyCustomerBankApi as any).mockResolvedValueOnce({
            status: true,
            data: { verifyToken: 't' },
        });

        const { result } = renderHook(() => useVerifyCustomerBank());

        await act(async () => {
            await result.current.verifyBankAccount(formValues);
        });

        expect(result.current.isVerifying).toBe(false);
    });
});
