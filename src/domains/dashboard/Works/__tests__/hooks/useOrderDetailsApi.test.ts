import { renderHook, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { getTransactionDetailsApi } from '../../api/orderHistory';
import { useOrderDetailsApi } from '../../hooks/useOrderDetailsApi';
import { setOrderDetails } from '../../slices/worksSlice';

vi.mock('../../api/orderHistory', () => ({
    getTransactionDetailsApi: vi.fn(),
}));
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));
vi.mock('../../slices/orderDetailsSlice', () => ({
    setOrderDetails: vi.fn(),
}));

describe('useOrderDetailsApi hook', () => {
    const mockDispatch = vi.fn();
    const mockNavigate = vi.fn();

    const mockApiResponse = {
        orderResponse: JSON.stringify({
            planDetails: {
                name: 'Premium Plan',
                description: 'Full access',
                price: 1000,
                billingCycle: 'Monthly',
                features: ['Feature 1', 'Feature 2'],
                work: {
                    contactName: 'John Doe',
                    contactEmail: 'john@example.com',
                    contactMobile: '1234567890',
                },
            },
        }),
        workspaceOrderStatus: 'Completed',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ id: 'user123', role: 'admin' });
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        (useNavigate as Mock).mockReturnValue(mockNavigate);
    });

    it('should start with loading state', () => {
        const { result } = renderHook(() => useOrderDetailsApi('order123'));
        expect(result.current.isLoading).toBe(true);
    });

    it('should fetch order details and dispatch setOrderDetails on success', async () => {
        (getTransactionDetailsApi as Mock).mockResolvedValue(mockApiResponse);

        const { result } = renderHook(() => useOrderDetailsApi('order123'));

        await act(async () => {
            await result.current;
        });

        expect(getTransactionDetailsApi).toHaveBeenCalledWith({
            userId: 'user123',
            userType: 'admin',
            orderId: 'order123',
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            setOrderDetails({
                planDetails: {
                    name: 'Premium Plan',
                    description: 'Full access',
                    price: '1000',
                    billingCycle: 'Monthly',
                    features: 'Feature 1',
                },
                name: 'John Doe',
                email: 'john@example.com',
                mobile: '1234567890',
                status: 'Completed',
            })
        );

        expect(result.current.isLoading).toBe(false);
    });

    it('should handle API failure and redirect', async () => {
        (getTransactionDetailsApi as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useOrderDetailsApi('order123'));

        await act(async () => {
            await result.current;
        });

        expect(mockNavigate).toHaveBeenCalledWith(`/${paths.works.index}`);
        expect(result.current.isLoading).toBe(false);
    });
});
