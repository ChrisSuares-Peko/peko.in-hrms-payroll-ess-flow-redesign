import { renderHook, act } from '@testing-library/react';
import { describe, beforeEach, it, expect, vi, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { listingApi } from '../../api/listingApi';
import { useListingApi } from '../../hooks/useListingApi';

vi.mock('../../api/listingApi');
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('useListingApi hook', () => {
    const mockWorks = [
        { id: 1, name: 'Work 1' },
        { id: 2, name: 'Work 2' },
    ];
    const mockApiResponse = {
        data: {
            rows: mockWorks,
            count: 2,
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ id: 'user123', role: 'admin' });
    });

    it('should return initial state', () => {
        const { result } = renderHook(() => useListingApi(1, 10));

        expect(result.current.data).toEqual([]);
        expect(result.current.isLoading).toBe(true);
        expect(result.current.count).toBe(0);
    });

    it('should fetch and set works list on mount', async () => {
        (listingApi as Mock).mockResolvedValue(mockApiResponse);

        const { result } = renderHook(() => useListingApi(1, 10));

        expect(listingApi).toHaveBeenCalledWith({
            userId: 'user123',
            userType: 'admin',
            itemsPerPage: 10,
            page: 1,
        });

        await act(async () => {
            await result.current;
        });

        expect(result.current.data).toEqual(mockWorks);
        expect(result.current.count).toBe(2);
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
        (listingApi as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useListingApi(1, 10));

        await act(async () => {
            await result.current;
        });

        expect(result.current.data).toEqual([]);
        expect(result.current.count).toBe(0);
        expect(result.current.isLoading).toBe(false);
    });
});
