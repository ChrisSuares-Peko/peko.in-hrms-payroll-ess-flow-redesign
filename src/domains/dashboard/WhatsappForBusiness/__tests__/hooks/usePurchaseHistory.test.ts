import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getPurchaseHistory } from '../../api/orderHistory';
import usePurchaseHistory from '../../hooks/usePurchaseHistory';
import { PackageStatus, PackageType } from '../../types/orderHistory';

vi.mock('../../api/orderHistory', () => ({
    getPurchaseHistory: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('usePurchaseHistory Hook', () => {
    const mockResponse = {
        activeSubscriptions: {
            rows: [
                { id: 'sub1', name: 'Basic Plan', status: 'active' },
                { id: 'sub2', name: 'Premium Plan', status: 'inactive' },
            ],
            count: 2,
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: 'user123' });
    });

    it('should initialize with isLoading as true and data as an empty array', () => {
        const { result } = renderHook(() =>
            usePurchaseHistory({
                itemsPerPage: 10,
                page: 1,
                packageType: PackageType.Individual,
                status: PackageStatus.Due,
            })
        );

        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toEqual([]);
    });

    it('should fetch purchase history and update state', async () => {
        (getPurchaseHistory as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() =>
            usePurchaseHistory({
                itemsPerPage: 10,
                page: 1,
                packageType: PackageType.Individual,
                status: PackageStatus.Due,
            })
        );

        await act(async () => {
            await result.current.refetch();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toEqual(mockResponse.activeSubscriptions.rows);
        expect(result.current.count).toBe(mockResponse.activeSubscriptions.count);
    });

    it('should set currentSubscription if packageType is provided and data is available', async () => {
        (getPurchaseHistory as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() =>
            usePurchaseHistory({
                itemsPerPage: 10,
                page: 1,
                packageType: PackageType.Individual,
                status: PackageStatus.Due,
            })
        );

        await act(async () => {
            await result.current.refetch();
        });

        expect(result.current.currentSubscription).toEqual(
            mockResponse.activeSubscriptions.rows[0]
        );
    });

    it('should handle API failure and set isLoading to false', async () => {
        (getPurchaseHistory as Mock).mockResolvedValue(false);

        const { result } = renderHook(() =>
            usePurchaseHistory({
                itemsPerPage: 10,
                page: 1,
                packageType: PackageType.Individual,
                status: PackageStatus.Due,
            })
        );

        await act(async () => {
            await result.current.refetch();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toEqual([]);
        expect(result.current.count).toBeUndefined();
        expect(result.current.currentSubscription).toBeUndefined();
    });

    it('should refetch data when refetch function is called', async () => {
        (getPurchaseHistory as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() =>
            usePurchaseHistory({
                itemsPerPage: 10,
                page: 1,
                packageType: PackageType.Individual,
                status: PackageStatus.Due,
            })
        );

        await act(async () => {
            await result.current.refetch();
        });

        expect(getPurchaseHistory).toHaveBeenCalledTimes(2); // First from useEffect, second from refetch
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toEqual(mockResponse.activeSubscriptions.rows);
    });
});
