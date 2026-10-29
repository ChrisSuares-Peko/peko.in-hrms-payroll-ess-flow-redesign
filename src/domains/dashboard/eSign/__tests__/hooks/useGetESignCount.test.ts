import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getESignCount } from '../../api';
import useGetESignCount from '../../hooks/useGetESignCount';
import { eSignResponse } from '../../types';

// Mock the API
vi.mock('../../api', () => ({
    getESignCount: vi.fn(),
}));

// Mock Redux selector
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('useGetESignCount Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock Redux selector
        (useAppSelector as any).mockImplementation((selectorFn: any) =>
            selectorFn({
                reducer: {
                    auth: { id: 1, role: 'user' },
                },
            })
        );
    });

    it('should fetch and set eSign counts correctly', async () => {
        const mockResponse: eSignResponse = {
            count: 5,
            pendingCount: 2,
            completedCount: 3,
            lastESignAddedDate: '2024-02-13',
        };

        (getESignCount as any).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useGetESignCount());

        expect(result.current.isLoading).toBe(true);

        await act(async () => {});

        expect(getESignCount).toHaveBeenCalledWith({
            userId: 1,
            userType: 'user',
        });

        expect(result.current.count).toBe(5);
        expect(result.current.pendingCount).toBe(2);
        expect(result.current.completedCount).toBe(3);
        expect(result.current.lastAdded).toBe('2024-02-13');
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle API failure and set loading state correctly', async () => {
        (getESignCount as any).mockResolvedValue(false);

        const { result } = renderHook(() => useGetESignCount());

        expect(result.current.isLoading).toBe(true);

        await act(async () => {});

        expect(result.current.count).toBeUndefined();
        expect(result.current.pendingCount).toBeUndefined();
        expect(result.current.completedCount).toBeUndefined();
        expect(result.current.lastAdded).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });

    it('should refresh data when setRefresh is called', async () => {
        const mockResponse: eSignResponse = {
            count: 10,
            pendingCount: 5,
            completedCount: 5,
            lastESignAddedDate: '2024-02-14',
        };

        (getESignCount as any).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useGetESignCount());

        await act(async () => {});

        expect(result.current.count).toBe(10);

        (getESignCount as any).mockResolvedValue({
            count: 15,
            pendingCount: 7,
            completedCount: 8,
            lastESignAddedDate: '2024-02-15',
        });

        await act(async () => {
            result.current.setRefresh(true);
        });

        expect(result.current.count).toBe(15);
        expect(result.current.pendingCount).toBe(7);
        expect(result.current.completedCount).toBe(8);
        expect(result.current.lastAdded).toBe('2024-02-15');
    });
});
