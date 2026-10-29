import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import {
    addBankAccountApi,
    deleteBankAccountApi,
    editBankAccountApi,
    getBankAccountsApi,
    sendBankAccountOtpApi,
    setPrimaryBankAccountApi,
} from '../../../api/manageBankAccount';
import useDomesticAccounts from '../../../hooks/manageBankAccounts/useDomesticAccounts';

vi.mock('../../../api/manageBankAccount', () => ({
    addBankAccountApi: vi.fn(),
    deleteBankAccountApi: vi.fn(),
    editBankAccountApi: vi.fn(),
    getBankAccountsApi: vi.fn(),
    sendBankAccountOtpApi: vi.fn(),
    setPrimaryBankAccountApi: vi.fn(),
}));

const dispatchMock = vi.fn();

vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'user123', role: 'admin' })),
}));

describe('useDomesticAccounts', () => {
    const mockAccounts = [{ id: 1, accountNumber: '123', default: 1 }];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch accounts on mount', async () => {
        (getBankAccountsApi as Mock).mockResolvedValue({ status: true, data: mockAccounts });
        const { result } = renderHook(() => useDomesticAccounts());

        await waitFor(() => expect(result.current.isLoading).toBeFalsy());
        expect(result.current.accounts).toEqual(mockAccounts);
    });

    it('should show error toast when fetch fails', async () => {
        (getBankAccountsApi as Mock).mockResolvedValue({ status: false, message: 'err' });
        renderHook(() => useDomesticAccounts());

        await waitFor(() =>
            expect(dispatchMock).toHaveBeenCalledWith(
                showToast({ description: 'err', variant: 'error' })
            )
        );
    });

    it('should add account and refetch on success', async () => {
        (getBankAccountsApi as Mock).mockResolvedValue({ status: true, data: [] });
        (addBankAccountApi as Mock).mockResolvedValue({ status: true });

        const { result } = renderHook(() => useDomesticAccounts());
        await waitFor(() => expect(result.current.isLoading).toBeFalsy());

        const onSuccess = vi.fn();
        let ok = false;
        await act(async () => {
            ok = await result.current.addDomesticAccount(
                { accountNumber: '123' } as any,
                '1234',
                onSuccess
            );
        });

        expect(ok).toBe(true);
        expect(onSuccess).toHaveBeenCalled();
        expect(getBankAccountsApi).toHaveBeenCalledTimes(2);
    });

    it('should edit account and dispatch success toast', async () => {
        (getBankAccountsApi as Mock).mockResolvedValue({ status: true, data: mockAccounts });
        (editBankAccountApi as Mock).mockResolvedValue({ status: true });

        const { result } = renderHook(() => useDomesticAccounts());
        await waitFor(() => expect(result.current.isLoading).toBeFalsy());

        let ok = false;
        await act(async () => {
            ok = await result.current.editDomesticAccount('1', {} as any, '1234');
        });

        expect(ok).toBe(true);
        expect(editBankAccountApi).toHaveBeenCalledWith(
            expect.objectContaining({ accountId: '1', isDefault: true, otp: '1234' })
        );
    });

    it('setAsPrimary returns false when account id not found', async () => {
        (getBankAccountsApi as Mock).mockResolvedValue({ status: true, data: mockAccounts });

        const { result } = renderHook(() => useDomesticAccounts());
        await waitFor(() => expect(result.current.isLoading).toBeFalsy());

        let ok = true;
        await act(async () => {
            ok = await result.current.setAsPrimary('missing', '1234');
        });

        expect(ok).toBe(false);
        expect(setPrimaryBankAccountApi).not.toHaveBeenCalled();
    });

    it('sendOtpForBankAccount returns true on success', async () => {
        (getBankAccountsApi as Mock).mockResolvedValue({ status: true, data: [] });
        (sendBankAccountOtpApi as Mock).mockResolvedValue({ status: true });

        const { result } = renderHook(() => useDomesticAccounts());
        await waitFor(() => expect(result.current.isLoading).toBeFalsy());

        let ok = false;
        await act(async () => {
            ok = await result.current.sendOtpForBankAccount('123', '1', 'sms');
        });

        expect(ok).toBe(true);
    });

    it('deleteDomesticAccount success path', async () => {
        (getBankAccountsApi as Mock).mockResolvedValue({ status: true, data: [] });
        (deleteBankAccountApi as Mock).mockResolvedValue({ status: true });

        const { result } = renderHook(() => useDomesticAccounts());
        await waitFor(() => expect(result.current.isLoading).toBeFalsy());

        let ok = false;
        await act(async () => {
            ok = await result.current.deleteDomesticAccount('1', '1234');
        });
        expect(ok).toBe(true);
    });
});
