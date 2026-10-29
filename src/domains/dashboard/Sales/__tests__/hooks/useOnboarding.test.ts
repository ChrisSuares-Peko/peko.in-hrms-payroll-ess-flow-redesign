import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getPaymentOnboardingStatus,
    savePaymentOnboardingStep1Api,
    savePaymentOnboardingStep2Api,
} from '../../api/onboarding';
import useOnboarding from '../../hooks/useOnboarding';

vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: vi.fn() }));
vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'apiSlice/showToast', payload })),
}));
vi.mock('../../api/onboarding', () => ({
    getPaymentOnboardingStatus: vi.fn(),
    savePaymentOnboardingStep1Api: vi.fn(),
    savePaymentOnboardingStep2Api: vi.fn(),
}));

const mockDispatch = vi.fn();
const businessData: any = {
    businessName: 'Acme',
    bankName: 'HDFC',
    accountNumber: '123',
    ifsc: 'HDFC0001234',
};

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
    (useAppDispatch as any).mockReturnValue(mockDispatch);
});

describe('useOnboarding', () => {
    it('saveStep1 returns true and forwards the form payload on success', async () => {
        (savePaymentOnboardingStep1Api as any).mockResolvedValueOnce({ status: true });

        const { result } = renderHook(() => useOnboarding());

        let returned: any;
        await act(async () => {
            returned = await result.current.saveStep1(businessData);
        });

        expect(savePaymentOnboardingStep1Api).toHaveBeenCalledWith({
            userId: 'u',
            userType: 'merchant',
            businessName: 'Acme',
            bankName: 'HDFC',
            accountNumber: '123',
            ifsc: 'HDFC0001234',
        });
        expect(returned).toBe(true);
    });

    it('saveStep1 returns false without toast when API status is false', async () => {
        (savePaymentOnboardingStep1Api as any).mockResolvedValueOnce({
            status: false,
            message: 'invalid',
        });

        const { result } = renderHook(() => useOnboarding());

        let returned: any;
        await act(async () => {
            returned = await result.current.saveStep1(businessData);
        });

        expect(showToast).not.toHaveBeenCalled();
        expect(returned).toBe(false);
    });

    it('saveStep1 returns false with fallback message when API returns falsy', async () => {
        (savePaymentOnboardingStep1Api as any).mockResolvedValueOnce(null);

        const { result } = renderHook(() => useOnboarding());

        let returned: any;
        await act(async () => {
            returned = await result.current.saveStep1(businessData);
        });

        expect(showToast).toHaveBeenCalledWith({
            description: 'Failed to save business details.',
            variant: 'error',
        });
        expect(returned).toBe(false);
    });

    it('saveStep1 short-circuits to true for currency-account type', async () => {
        const { result } = renderHook(() => useOnboarding('currency-account'));

        let returned: any;
        await act(async () => {
            returned = await result.current.saveStep1(businessData);
        });

        expect(returned).toBe(true);
        expect(savePaymentOnboardingStep1Api).not.toHaveBeenCalled();
    });

    it('activateNow returns virtualAccountNumber on success', async () => {
        (savePaymentOnboardingStep2Api as any).mockResolvedValueOnce({
            status: true,
            data: { virtualAccountNumber: 'VA-123' },
        });

        const { result } = renderHook(() => useOnboarding());

        let returned: any;
        await act(async () => {
            returned = await result.current.activateNow(businessData);
        });

        expect(returned).toBe('VA-123');
    });

    it('activateNow returns null without toast when API status is false', async () => {
        (savePaymentOnboardingStep2Api as any).mockResolvedValueOnce({
            status: false,
            message: 'denied',
        });

        const { result } = renderHook(() => useOnboarding());

        let returned: any;
        await act(async () => {
            returned = await result.current.activateNow(businessData);
        });

        expect(showToast).not.toHaveBeenCalled();
        expect(returned).toBe(null);
    });

    it('checkOnboardingStatus returns true when status is active and vendor is nupay', async () => {
        (getPaymentOnboardingStatus as any).mockResolvedValueOnce({
            status: true,
            data: { status: 'active', vendor: 'nupay' },
        });

        const { result } = renderHook(() => useOnboarding());

        const isActivated = await result.current.checkOnboardingStatus();
        expect(isActivated).toBe(true);
    });

    it('checkOnboardingStatus returns false for a legacy decentro merchant', async () => {
        (getPaymentOnboardingStatus as any).mockResolvedValueOnce({
            status: true,
            data: { status: 'active', activatedAt: '2026-01-01', vendor: 'decentro' },
        });

        const { result } = renderHook(() => useOnboarding());

        const isActivated = await result.current.checkOnboardingStatus();
        expect(isActivated).toBe(false);
    });

    it('checkOnboardingStatus returns false while nupay onboarding is still pending (stale activatedAt)', async () => {
        (getPaymentOnboardingStatus as any).mockResolvedValueOnce({
            status: true,
            data: { status: 'approval-pending', activatedAt: '2026-01-01', vendor: 'nupay' },
        });

        const { result } = renderHook(() => useOnboarding());

        const isActivated = await result.current.checkOnboardingStatus();
        expect(isActivated).toBe(false);
    });
});
