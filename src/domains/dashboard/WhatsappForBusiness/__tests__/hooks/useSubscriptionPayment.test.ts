import { renderHook, act, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';

import { setPaymentData } from '../../../payments/slices/payment';
import useCheckProjectExist from '../../hooks/useCheckProjectExist';
import useWhatsAppSubscriptionPayment from '../../hooks/useSubscriptionPayment';
import GetSurcharge from '../../hooks/useSurchargeApi';
import { resetWhatsappBusinessState } from '../../slices/paymentSlice';
import { PlanMode, PlanType } from '../../types';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

vi.mock('../../hooks/useCheckProjectExist', () => ({
    default: vi.fn(() => ({
        checkProject: vi.fn().mockResolvedValue(true), // Adjust the mock return value as needed
    })),
}));

// Mock useSurchargeApi
vi.mock('../../hooks/useSurchargeApi', () => ({
    default: vi.fn(() => ({
        getSurchargeData: vi.fn().mockResolvedValue({ surcharge: '10' }),
    })),
}));

describe('useWhatsAppSubscriptionPayment Hook', () => {
    const dispatch = vi.fn();
    const navigate = vi.fn();

    const mockAuthState = {
        role: 'admin',
        id: 'user-123',
    };

    beforeEach(() => {
        (useAppDispatch as Mock).mockReturnValue(dispatch);
        (useAppSelector as Mock).mockImplementation(selector =>
            selector({ reducer: { auth: mockAuthState } })
        );
        (useNavigate as Mock).mockReturnValue(navigate);
        (GetSurcharge as Mock).mockReturnValue({
            getSurchargeData: vi
                .fn()
                .mockResolvedValue({ surcharge: '10', corporateCashback: '5' }),
        });
        (useCheckProjectExist as Mock).mockReturnValue({
            checkProject: vi.fn().mockResolvedValue(false),
        });

        vi.clearAllMocks();
    });

    it('should return handleSubmission function and isLoading state', () => {
        const { result } = renderHook(() => useWhatsAppSubscriptionPayment());
        expect(result.current.handleSubmission).toBeInstanceOf(Function);
        expect(result.current.isLoading).toBe(false);
    });

    it('should call checkProject API with correct parameters', async () => {
        const { result } = renderHook(() => useWhatsAppSubscriptionPayment());

        await act(async () => {
            await result.current.handleSubmission(
                PlanMode.Basic,
                PlanType.Monthly,
                1,
                100,
                1,
                'additionalParam1',
                1,
                false
            );
        });

        expect(useCheckProjectExist().checkProject).toHaveBeenCalledWith({
            userId: 'user-123',
            userType: 'admin',
        });
    });

    it('should not proceed if project does not exist', async () => {
        (useCheckProjectExist as Mock).mockReturnValue({
            checkProject: vi.fn().mockResolvedValue(true), // Project does not exist
        });

        const { result } = renderHook(() => useWhatsAppSubscriptionPayment());

        await act(async () => {
            await result.current.handleSubmission(
                PlanMode.Basic,
                PlanType.Monthly,
                1,
                100,
                10,
                'gold',
                7,
                false
            );
        });

        expect(dispatch).not.toHaveBeenCalled();
        expect(navigate).not.toHaveBeenCalled();
    });

    it('should call getSurchargeData with the correct amount', async () => {
        const getSurchargeDataMock = vi
            .fn()
            .mockResolvedValue({ surcharge: '10', corporateCashback: '5' });

        (GetSurcharge as Mock).mockReturnValue({ getSurchargeData: getSurchargeDataMock });

        const { result } = renderHook(() => useWhatsAppSubscriptionPayment());

        await act(async () => {
            await result.current.handleSubmission(
                PlanMode.Basic,
                PlanType.Monthly,
                1,
                100,
                1,
                'additionalParam1',
                1,
                false
            );
        });

        expect(getSurchargeDataMock).toHaveBeenCalledWith('100');
    });

    it('should dispatch setPaymentData with expected payload', async () => {
        const { result } = renderHook(() => useWhatsAppSubscriptionPayment());

        await act(async () => {
            await result.current.handleSubmission(
                PlanMode.Basic,
                PlanType.Monthly,
                1,
                100,
                1,
                'additionalParam1',
                1,
                false
            );
        });

        expect(dispatch).toHaveBeenCalledWith(
            setPaymentData({
                billSummary: [
                    { key: 'Service name', value: 'WhatsApp for Business' },
                    { key: 'Plan name', value: 'WhatsApp Basic' },
                    { key: 'Billing cycle', value: 'Monthly' },
                    { key: 'Amount', value: '100.00' },
                ],
                paymentSummary: [{ key: 'Platform fee (inclusive of GST)', value: '₹ 10.00' }],
                totalAmount: 110,
                title: 'Bill Summary',
                payload: {
                    amount: '100',
                    pgAmount: '100',
                    subscriptionPlan: 'WhatsApp Basic',
                    isSubscription: true,
                    subscriptionDuration: 'monthly',
                    packageId: 1,
                    accessKey: accessKeys.whatsappBasic,
                    currentUrl: window.location.href,
                    successUrl: `${paths.dashboard.whatsappForBusiness}/${paths.whatsappForBusiness.paymentsuccess}`,
                    isWhatsAppSubscription: true,
                },
                url: '',
                earningCashbackAmount: 5,
            })
        );
    });

    it('should navigate to payments page on success', async () => {
        const { result } = renderHook(() => useWhatsAppSubscriptionPayment());

        await act(async () => {
            await result.current.handleSubmission(
                PlanMode.Basic,
                PlanType.Monthly,
                1,
                100,
                1,
                'additionalParam1',
                1,
                false
            );
        });

        expect(navigate).toHaveBeenCalledWith(paths.dashboard.payments);
    });

    it('should dispatch resetWhatsappBusinessState after navigation', async () => {
        const { result } = renderHook(() => useWhatsAppSubscriptionPayment());

        await act(async () => {
            await result.current.handleSubmission(
                PlanMode.Basic,
                PlanType.Monthly,
                1,
                100,
                1,
                'additionalParam1',
                1,
                false
            );
        });

        expect(dispatch).toHaveBeenCalledWith(resetWhatsappBusinessState());
    });

    it('should handle errors gracefully', async () => {
        (GetSurcharge as Mock).mockReturnValue({
            getSurchargeData: vi.fn().mockRejectedValue(new Error('API Error')),
        });

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useWhatsAppSubscriptionPayment());

        await act(async () => {
            await result.current.handleSubmission(
                PlanMode.Basic,
                PlanType.Monthly,
                1,
                100,
                1,
                'additionalParam1',
                1,
                false
            );
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error in handleSubmission:',
            expect.any(Error)
        );
        consoleErrorSpy.mockRestore();
    });

    it('should update isLoading state correctly', async () => {
        const { result } = renderHook(() => useWhatsAppSubscriptionPayment());

        expect(result.current.isLoading).toBe(false);

        act(() => {
            result.current.handleSubmission(
                PlanMode.Basic,
                PlanType.Monthly,
                1,
                100,
                1,
                'additionalParam1',
                1,
                false
            );
        });

        await waitFor(async () => {
            expect(result.current.isLoading).toBe(true);

            await act(async () => {
                await result.current.handleSubmission(
                    PlanMode.Basic,
                    PlanType.Monthly,
                    1,
                    100,
                    120,
                    '',
                    10
                );
            });

            expect(result.current.isLoading).toBe(false);
        });
    });
});
