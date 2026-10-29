import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { verifyCustomerBankApi } from '../../../api/customers';
import useVerifyCustomerBank from '../../../hooks/customer/useVerifyCustomerBank';

vi.mock('../../../api/customers', () => ({
    verifyCustomerBankApi: vi.fn(),
}));

const dispatchMock = vi.fn();

vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'user123', role: 'admin' })),
}));

describe('useVerifyCustomerBank', () => {
    const values = {
        accountNumber: '123',
        ifscCode: 'IFSC001',
        accountHolderName: 'Arshid',
    } as any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return verified values with verifyToken on success', async () => {
        (verifyCustomerBankApi as Mock).mockResolvedValue({
            status: true,
            data: { verifyToken: 'tok_123' },
        });

        const { result } = renderHook(() => useVerifyCustomerBank());
        let returned: any = null;
        await act(async () => {
            returned = await result.current.verifyBankAccount(values);
        });

        expect(verifyCustomerBankApi).toHaveBeenCalledWith({
            userId: 'user123',
            userType: 'admin',
            bank_account: '123',
            ifsc: 'IFSC001',
            name: 'Arshid',
        });
        expect(returned).toEqual({ ...values, verifyToken: 'tok_123' });
    });

    it('should return null and dispatch error toast when API returns non-success', async () => {
        (verifyCustomerBankApi as Mock).mockResolvedValue({ status: false, message: 'invalid' });

        const { result } = renderHook(() => useVerifyCustomerBank());
        let returned: any = 'x';
        await act(async () => {
            returned = await result.current.verifyBankAccount(values);
        });

        expect(returned).toBeNull();
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'invalid', variant: 'error' })
        );
    });

    it('should return null and dispatch default error toast when API resolves falsy', async () => {
        (verifyCustomerBankApi as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useVerifyCustomerBank());
        let returned: any = 'x';
        await act(async () => {
            returned = await result.current.verifyBankAccount(values);
        });

        expect(returned).toBeNull();
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Failed to verify bank account.', variant: 'error' })
        );
    });
});
