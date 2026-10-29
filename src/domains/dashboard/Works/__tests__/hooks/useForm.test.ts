import { renderHook, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { vi, describe, beforeEach, it, expect, Mock } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { getSurcharge } from '@src/services/surcharge';
import { setPaymentData } from '@src/slices/payment';

import useForm from '../../hooks/useForm';

vi.mock('react-router-dom', () => ({ useNavigate: vi.fn() }));
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));
vi.mock('@src/services/surcharge', () => ({ getSurcharge: vi.fn() }));
vi.mock('../../payments/slices/payment', () => ({ setPaymentData: vi.fn() }));

describe('useForm hook', () => {
    const mockDispatch = vi.fn();
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        (useNavigate as Mock).mockReturnValue(mockNavigate);
        (useAppSelector as Mock).mockReturnValue({ id: '123', role: 'user' });
    });

    it('should call getSurcharge and dispatch payment data on successful response', async () => {
        const surchargeResponse = { surcharge: '10', corporateCashback: '5' };
        (getSurcharge as Mock).mockResolvedValue(surchargeResponse);

        const { result } = renderHook(() => useForm());

        await act(async () => {
            await result.current.handleSubmission({
                pocName: 'John Doe',
                email: 'john@example.com',
                requirement: 'Service Requirement',
                planId: 'plan123',
                workId: 456,
                price: '100',
                planName: 'Premium Plan',
                mobile: undefined,
                workName: ''
            });
        });

        expect(getSurcharge).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            amount: 100,
            accessKey: 'peko_works',
        });
        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({ type: setPaymentData.type })
        );
        expect(mockNavigate).toHaveBeenCalledWith(paths.dashboard.payments);
    });

    it('should not dispatch or navigate if surcharge response is false', async () => {
        (getSurcharge as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useForm());

        await act(async () => {
            await result.current.handleSubmission({
                pocName: 'John Doe',
                email: 'john@example.com',
                requirement: 'Service Requirement',
                planId: 'plan123',
                workId: 456,
                price: '100',
                planName: 'Premium Plan',
                mobile: undefined,
                workName: ''
            });
        });

        expect(getSurcharge).toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
        (getSurcharge as Mock).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useForm());

        await act(async () => {
            await result.current.handleSubmission({
                pocName: 'John Doe',
                email: 'john@example.com',
                requirement: 'Service Requirement',
                planId: 'plan123',
                workId: 456,
                price: '100',
                planName: 'Premium Plan',
                mobile: undefined,
                workName: ''
            });
        });

        expect(getSurcharge).toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
