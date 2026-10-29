import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getEmailDomainPlans } from '../../api';
import useEmailDomainPlansApi from '../../hooks/useEmailDomainPlansApi';

const mockDispatch = vi.fn();
vi.mock('../../api/index', () => ({
    getEmailDomainPlans: vi.fn(),
}));
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn(),
}));
const mockGetEmailDomainPlans = getEmailDomainPlans as Mock;
const mockUseAppSelector = useAppSelector as Mock;

describe('useEmailDomainPlansApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
        mockUseAppSelector.mockReturnValue({ role: 'admin', id: '123' });
    });

    it('should set loading to true initially and fetch plans data successfully', async () => {
        const mockResponse = {
            planDatas: [{ id: '1', name: 'Plan A', price: '10' }],
            productData: { id: '1', name: 'Email Product' },
        };
        mockGetEmailDomainPlans.mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useEmailDomainPlansApi(1));

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.plansData).toEqual([{ id: '1', name: 'Plan A', price: '10' }]);
            expect(result.current.productData).toEqual({ id: '1', name: 'Email Product' });
        });
    });
    it('should handle API failure gracefully', async () => {
        mockGetEmailDomainPlans.mockResolvedValue(false);

        const { result } = renderHook(() => useEmailDomainPlansApi(1));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.plansData).toEqual([]);
            expect(result.current.productData).toBe(null);
        });
    });

    it('should refetch data when productId changes', async () => {
        const mockResponse1 = {
            planDatas: [{ id: '1', name: 'Plan A', price: '10' }],
            productData: { id: '1', name: 'Email Product' },
        };
        const mockResponse2 = {
            planDatas: [{ id: '2', name: 'Plan B', price: '20' }],
            productData: { id: '2', name: 'Other Product' },
        };

        mockGetEmailDomainPlans
            .mockResolvedValueOnce(mockResponse1)
            .mockResolvedValueOnce(mockResponse2);

        const { result, rerender } = renderHook(
            ({ productId }) => useEmailDomainPlansApi(productId),
            { initialProps: { productId: 1 } }
        );

        await waitFor(() => {
            expect(result.current.plansData).toEqual([{ id: '1', name: 'Plan A', price: '10' }]);
            expect(result.current.productData).toEqual({ id: '1', name: 'Email Product' });
        });
        rerender({ productId: 2 });

        await waitFor(() => {
            expect(result.current.plansData).toEqual([{ id: '2', name: 'Plan B', price: '20' }]);
            expect(result.current.productData).toEqual({ id: '2', name: 'Other Product' });
        });
    });
});
