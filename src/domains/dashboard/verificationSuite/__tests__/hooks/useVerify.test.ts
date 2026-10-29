import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { verifyPan, verifyBankAccount } from '../../api';
import useVerifyApi from '../../hooks/useVerify';

vi.mock('../../api', () => ({
    verifyBankAccount: vi.fn(),
    verifyBankIfsc: vi.fn(),
    verifyPan: vi.fn(),
    verifyAdvancePan: vi.fn(),
    verifyLicense: vi.fn(),
    verifyGstPan: vi.fn(),
    verifyCin: vi.fn(),
    verifyVoterId: vi.fn(),
    verifyPassport: vi.fn(),
    verifyGst: vi.fn(),
    verifyCorporateEntity: vi.fn(),
    verifyDirector: vi.fn(),
    verifyDirectorDin: vi.fn(),
    verifyBusinessGst: vi.fn(),
    verifyGstReturn: vi.fn(),
}));

const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
}));

vi.mock('@src/slices/userSlice', () => ({
    setUserInfo: vi.fn((payload: any) => ({ type: 'user/setUserInfo', payload })),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) =>
        selector({
            reducer: {
                auth: { id: '123', role: 'corporate' },
                user: { user: { name: 'Test User', balance: 100 } },
            },
        }),
}));

describe('useVerifyApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls verifyPan for pan_verify and updates resp/balance on success', async () => {
        (verifyPan as any).mockResolvedValue({
            status: true,
            data: { panStatus: 'valid', corporateFinalBalance: '5000' },
        });

        const { result } = renderHook(() => useVerifyApi('pan_verify'));

        let returned;
        await act(async () => {
            returned = await result.current.verifyBank({ pan: 'ABCDE1234F' });
        });

        expect(verifyPan).toHaveBeenCalledWith({
            userId: '123',
            userType: 'corporate',
            values: { pan: 'ABCDE1234F' },
        });
        expect(returned).toEqual({ panStatus: 'valid', corporateFinalBalance: '5000' });
        expect(result.current.resp).toEqual({ panStatus: 'valid', corporateFinalBalance: '5000' });
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'user/setUserInfo',
            payload: { user: { name: 'Test User', balance: '5000' } },
        });
        expect(result.current.isLoading).toBe(false);
    });

    it('routes bank_account_verify to verifyBankAccount', async () => {
        (verifyBankAccount as any).mockResolvedValue({
            status: true,
            data: { accountHolderName: 'Test User', corporateFinalBalance: '4990' },
        });

        const { result } = renderHook(() => useVerifyApi('bank_account_verify'));

        await act(async () => {
            await result.current.verifyBank({ bank_account: '11400210001004' });
        });

        expect(verifyBankAccount).toHaveBeenCalledWith({
            userId: '123',
            userType: 'corporate',
            values: { bank_account: '11400210001004' },
        });
    });

    it('returns null and does not dispatch when the underlying API call fails', async () => {
        (verifyPan as any).mockResolvedValue(false);

        const { result } = renderHook(() => useVerifyApi('pan_verify'));

        let returned: any;
        await act(async () => {
            returned = await result.current.verifyBank({ pan: 'ABCDE1234F' });
        });

        expect(returned).toBeNull();
        expect(mockDispatch).not.toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
    });
});
