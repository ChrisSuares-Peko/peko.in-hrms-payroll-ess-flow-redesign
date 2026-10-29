import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { setPaymentData } from '@src/domains/dashboard/payments/slices/payment';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';

import usePaymentApi from '../../hooks/usePaymentApi';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/services/surcharge', () => ({
    getSurcharge: vi.fn(),
}));

vi.mock('@src/domains/dashboard/payments/slices/payment', () => ({
    setPaymentData: vi.fn((payload) => ({ type: 'payment/setPaymentData', payload })),
}));

const mockDispatch = vi.fn();

const mockSurcharge = {
    surcharge: '50',
    corporateCashback: '10',
};

// serviceId 9 is MSME which should have an accessKey in serviceAccessKeyMap
const MSME_SERVICE_ID = 9;

describe('usePaymentApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: '123' });
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        (getSurcharge as Mock).mockResolvedValue(mockSurcharge);
    });

    describe('fetchSurcharge', () => {
        it('calls getSurcharge with userId, userType, and amount', async () => {
            const { result } = renderHook(() => usePaymentApi());

            await act(async () => {
                await result.current.fetchSurcharge(MSME_SERVICE_ID, 1000);
            });

            expect(getSurcharge).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: '123',
                    userType: 'admin',
                    amount: 1000,
                })
            );
        });

        it('does nothing when amount is 0', async () => {
            const { result } = renderHook(() => usePaymentApi());

            await act(async () => {
                await result.current.fetchSurcharge(MSME_SERVICE_ID, 0);
            });

            expect(getSurcharge).not.toHaveBeenCalled();
        });

        it('does nothing when serviceId has no accessKey mapping', async () => {
            const { result } = renderHook(() => usePaymentApi());

            await act(async () => {
                await result.current.fetchSurcharge(999999, 1000);
            });

            expect(getSurcharge).not.toHaveBeenCalled();
        });

        it('sets isSurchargeLoading false after fetch completes', async () => {
            (getSurcharge as Mock).mockResolvedValue(mockSurcharge);

            const { result } = renderHook(() => usePaymentApi());

            await act(async () => {
                await result.current.fetchSurcharge(MSME_SERVICE_ID, 1000);
            });

            expect(result.current.isSurchargeLoading).toBe(false);
        });

        it('stores surchargeData after successful fetch', async () => {
            (getSurcharge as Mock).mockResolvedValue(mockSurcharge);

            const { result } = renderHook(() => usePaymentApi());

            await act(async () => {
                await result.current.fetchSurcharge(MSME_SERVICE_ID, 1000);
            });

            expect(result.current.surchargeData).toEqual(mockSurcharge);
        });
    });

    describe('handleSubmission', () => {
        it('dispatches setPaymentData and navigates to payment page', async () => {
            const { result } = renderHook(() => usePaymentApi());

            await act(async () => {
                await result.current.handleSubmission({
                    serviceId: MSME_SERVICE_ID,
                    dbServiceId: 'msme-1',
                    serviceName: 'MSME Registration',
                    governmentFee: 0,
                    pekoFee: 999,
                    applicationId: 1,
                });
            });

            expect(mockDispatch).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalled();
        });

        it('includes serviceName and pekoFee in bill summary', async () => {
            const { result } = renderHook(() => usePaymentApi());

            await act(async () => {
                await result.current.handleSubmission({
                    serviceId: MSME_SERVICE_ID,
                    dbServiceId: 'msme-1',
                    serviceName: 'MSME Registration',
                    governmentFee: 500,
                    pekoFee: 999,
                    applicationId: null,
                });
            });

            expect(setPaymentData).toHaveBeenCalledWith(
                expect.objectContaining({
                    billSummary: expect.arrayContaining([
                        expect.objectContaining({ key: 'Service name', value: 'MSME Registration' }),
                        expect.objectContaining({ key: 'Peko Service Fee' }),
                    ]),
                })
            );
        });

        it('shows "Free" for government fee when governmentFee is "Free"', async () => {
            const { result } = renderHook(() => usePaymentApi());

            await act(async () => {
                await result.current.handleSubmission({
                    serviceId: MSME_SERVICE_ID,
                    dbServiceId: 'msme-1',
                    serviceName: 'MSME Registration',
                    governmentFee: 'Free',
                    pekoFee: 999,
                    applicationId: null,
                });
            });

            expect(setPaymentData).toHaveBeenCalledWith(
                expect.objectContaining({
                    billSummary: expect.arrayContaining([
                        expect.objectContaining({ key: 'Government Fee', value: 'Free' }),
                    ]),
                })
            );
        });

        it('sets loading to false after submission completes', async () => {
            const { result } = renderHook(() => usePaymentApi());

            await act(async () => {
                await result.current.handleSubmission({
                    serviceId: MSME_SERVICE_ID,
                    dbServiceId: 'msme-1',
                    serviceName: 'MSME Registration',
                    governmentFee: 'Free',
                    pekoFee: 999,
                    applicationId: null,
                });
            });

            expect(result.current.loading).toBe(false);
        });
    });
});
