import { renderHook, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { vi, describe, beforeEach, it, expect, Mock } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { paymentLink } from '../../api/index';
import useGetPaymentlink from '../../hooks/useGetPaymentlinkApi';
import { setPaymentLink, setpaymentLinkForm } from '../../slices/InvoicesSlices';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('@src/routes/paths', () => ({
    paths: {
        dashboard: {
            home: '/dashboard',
        },
        invoice: {
            index: 'invoice',
            success: 'success',
        },
    },
}));

vi.mock('../../api/index', () => ({
    paymentLink: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

describe('useGetPaymentlink', () => {
    let mockDispatch: Mock;
    let mockNavigate: Mock;

    beforeEach(() => {
        mockDispatch = vi.fn();
        mockNavigate = vi.fn();

        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        (useAppSelector as Mock).mockReturnValue({ id: 'user123', role: 'admin' });
        (useNavigate as Mock).mockReturnValue(mockNavigate);

        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useGetPaymentlink());

        expect(result.current.getData).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });

    it('should call `paymentLink` API and update state on success', async () => {
        const mockResponse = {
            paymentLink: 'https://mockpaymentlink.com',
            id: 'mockPaymentId',
        };

        (paymentLink as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useGetPaymentlink());

        await act(async () => {
            const response = await result.current.getPaymentLink({ amount: 100 });
            expect(response).toEqual(mockResponse);
        });

        expect(paymentLink).toHaveBeenCalledWith({
            userId: 'user123',
            userType: 'admin',
            amount: 100,
        });

        expect(mockDispatch).toHaveBeenCalledWith(setPaymentLink(mockResponse.paymentLink));
        expect(mockDispatch).toHaveBeenCalledWith(setpaymentLinkForm(mockResponse));
        expect(mockNavigate).toHaveBeenCalledWith('/invoice/success');
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle API failure and not update state', async () => {
        (paymentLink as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useGetPaymentlink());

        await act(async () => {
            const response = await result.current.getPaymentLink({ amount: 100 });
            expect(response).toBe(false);
        });

        expect(paymentLink).toHaveBeenCalledWith({
            userId: 'user123',
            userType: 'admin',
            amount: 100,
        });

        expect(mockDispatch).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
    });

    it('should set `isLoading` state correctly', async () => {
        const mockResponse = {
            paymentLink: 'https://mockpaymentlink.com',
            id: 'mockPaymentId',
        };

        (paymentLink as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useGetPaymentlink());

        act(() => {
            result.current.getPaymentLink({ amount: 100 });
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {});

        expect(result.current.isLoading).toBe(false);
    });
});
