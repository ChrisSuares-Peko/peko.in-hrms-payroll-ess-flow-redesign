import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import {
    getPaymentOnboardingStatus,
    savePaymentOnboardingBankApi,
    savePaymentOnboardingPanApi,
    savePaymentOnboardingStep1Api,
    savePaymentOnboardingStep2Api,
    verifyBankApi,
} from '../../api/onboarding';
import useOnboarding from '../../hooks/useOnboarding';

vi.mock('../../api/onboarding', () => ({
    getPaymentOnboardingStatus: vi.fn(),
    savePaymentOnboardingBankApi: vi.fn(),
    savePaymentOnboardingPanApi: vi.fn(),
    savePaymentOnboardingStep1Api: vi.fn(),
    savePaymentOnboardingStep2Api: vi.fn(),
    verifyBankApi: vi.fn(),
}));

const dispatchMock = vi.fn();

vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'user123', role: 'admin' })),
}));

describe('useOnboarding', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should save step 1 details and return true on success', async () => {
        (savePaymentOnboardingStep1Api as Mock).mockResolvedValue({ status: true });

        const { result } = renderHook(() => useOnboarding());
        let ok = false;
        await act(async () => {
            ok = await result.current.saveStep1({
                businessName: 'Acme',
                bankName: 'Bank',
                accountNumber: '123',
                ifsc: 'IFSC001',
            } as any);
        });

        expect(ok).toBe(true);
        expect(savePaymentOnboardingStep1Api).toHaveBeenCalled();
    });

    it('should show error toast and return false when step 1 network fails', async () => {
        (savePaymentOnboardingStep1Api as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useOnboarding());
        let ok = true;
        await act(async () => {
            ok = await result.current.saveStep1({
                businessName: 'Acme',
                bankName: 'Bank',
                accountNumber: '123',
                ifsc: 'IFSC001',
            } as any);
        });

        expect(ok).toBe(false);
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Failed to save business details.', variant: 'error' })
        );
    });

    it('should save PAN step and return non-null on success', async () => {
        (savePaymentOnboardingPanApi as Mock).mockResolvedValue({ status: true });

        const { result } = renderHook(() => useOnboarding());
        let ok: string | null = null;
        await act(async () => {
            ok = await result.current.savePanStep('ABCDE1234F');
        });

        expect(ok).not.toBeNull();
        expect(savePaymentOnboardingPanApi).toHaveBeenCalledWith({
            userId: 'user123',
            userType: 'admin',
            pan: 'ABCDE1234F',
        });
    });

    it('should save bank step and return verified bank data on success', async () => {
        (savePaymentOnboardingBankApi as Mock).mockResolvedValue({
            status: true,
            data: {
                bankName: 'Server Bank',
                accountNumber: '999',
                ifsc: 'IFSC999',
                accountHolderName: 'Verified',
                phone: '999',
            },
        });

        const { result } = renderHook(() => useOnboarding());
        let returned: any;
        await act(async () => {
            returned = await result.current.saveBankStep({
                bankName: 'Bank',
                accountNumber: '123',
                ifsc: 'IFSC001',
                name: 'Arshid',
                phone: '888',
            } as any);
        });

        expect(returned).toEqual({
            bankName: 'Server Bank',
            accountNumber: '999',
            ifsc: 'IFSC999',
            accountHolderName: 'Verified',
            phone: '999',
        });
    });

    it('should return null from saveBankStep when api fails', async () => {
        (savePaymentOnboardingBankApi as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useOnboarding());
        let returned: any = 'x';
        await act(async () => {
            returned = await result.current.saveBankStep({
                bankName: 'Bank',
                accountNumber: '123',
                ifsc: 'IFSC001',
                name: 'Arshid',
                phone: '888',
            } as any);
        });

        expect(returned).toBeNull();
    });

    it('should activate and return virtualAccountNumber', async () => {
        (savePaymentOnboardingStep2Api as Mock).mockResolvedValue({
            status: true,
            data: { virtualAccountNumber: 'VA1234' },
        });

        const { result } = renderHook(() => useOnboarding());
        let va: string | null = null;
        await act(async () => {
            va = await result.current.activateNow({} as any);
        });

        expect(va).toBe('VA1234');
    });

    it('should verify bank (quick path) and return true', async () => {
        (verifyBankApi as Mock).mockResolvedValue({ status: true });

        const { result } = renderHook(() => useOnboarding());
        let ok = false;
        await act(async () => {
            ok = await result.current.verifyBankStep({
                accountNumber: '123',
                ifsc: 'IFSC001',
                name: 'Arshid',
            } as any);
        });

        expect(ok).toBe(true);
    });

    it('should report onboarded when status is active and vendor is nupay', async () => {
        (getPaymentOnboardingStatus as Mock).mockResolvedValue({
            status: true,
            data: {
                id: 42,
                status: 'active',
                activatedAt: '2024-01-01',
                vendor: 'nupay',
                businessName: 'Acme',
                bankName: 'Bank',
                virtualAccountNumber: 'VA42',
                ifsc: 'IFSC42',
            },
        });

        const { result } = renderHook(() => useOnboarding());
        let status: any;
        await act(async () => {
            status = await result.current.checkOnboardingStatus();
        });

        expect(status.isOnboarded).toBe(true);
        expect(status.bankDetails).toEqual({
            id: '42',
            name: 'Acme',
            bankName: 'Bank',
            accountNumber: 'VA42',
            ifsc: 'IFSC42',
            currency: 'INR',
            type: 'Domestic',
        });
    });

    it('should report not onboarded when activatedAt missing', async () => {
        (getPaymentOnboardingStatus as Mock).mockResolvedValue({
            status: true,
            data: { id: 1, businessName: 'Acme' },
        });

        const { result } = renderHook(() => useOnboarding());
        let status: any;
        await act(async () => {
            status = await result.current.checkOnboardingStatus();
        });

        expect(status.isOnboarded).toBe(false);
        expect(status.bankDetails).toBeNull();
    });

    it('should report not onboarded for a legacy decentro merchant', async () => {
        (getPaymentOnboardingStatus as Mock).mockResolvedValue({
            status: true,
            data: { id: 1, status: 'active', activatedAt: '2024-01-01', vendor: 'decentro', businessName: 'Acme' },
        });

        const { result } = renderHook(() => useOnboarding());
        let status: any;
        await act(async () => {
            status = await result.current.checkOnboardingStatus();
        });

        expect(status.isOnboarded).toBe(false);
        expect(status.bankDetails).toBeNull();
    });

    it('should report not onboarded while nupay onboarding is still pending (stale activatedAt)', async () => {
        (getPaymentOnboardingStatus as Mock).mockResolvedValue({
            status: true,
            data: { id: 1, status: 'approval-pending', activatedAt: '2024-01-01', vendor: 'nupay', businessName: 'Acme' },
        });

        const { result } = renderHook(() => useOnboarding());
        let status: any;
        await act(async () => {
            status = await result.current.checkOnboardingStatus();
        });

        expect(status.isOnboarded).toBe(false);
        expect(status.bankDetails).toBeNull();
    });

    it('should short-circuit non payment-link flows by returning true/null', async () => {
        const { result } = renderHook(() => useOnboarding('currency-account'));

        const step1 = await result.current.saveStep1({} as any);
        const pan = await result.current.savePanStep('');
        const bank = await result.current.saveBankStep({ name: 'x' } as any);
        const activate = await result.current.activateNow({} as any);
        const verify = await result.current.verifyBankStep({} as any);

        expect(step1).toBe(true);
        expect(pan).toBe('');
        expect(bank).toMatchObject({ accountHolderName: 'x' });
        expect(activate).toBe('');
        expect(verify).toBe(true);
        await waitFor(() => expect(savePaymentOnboardingStep1Api).not.toHaveBeenCalled());
    });
});
