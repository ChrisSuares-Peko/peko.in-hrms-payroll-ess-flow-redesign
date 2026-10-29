import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import { getRequests } from '../../api/index';
import { useGetRequests } from '../../hooks/useGetRequests';

// Mock API function
vi.mock('../../api/index', () => ({
    getRequests: vi.fn(),
}));

describe('useGetRequests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch and return pending requests', async () => {
        const mockRequests = [
            { id: 1, status: 'PENDING', name: 'Request 1' },
            { id: 2, status: 'APPROVED', name: 'Request 2' },
            { id: 3, status: 'PENDING', name: 'Request 3' },
        ];
        (getRequests as Mock).mockResolvedValue(mockRequests);

        const { result } = renderHook(() => useGetRequests());

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.requests).toEqual([
                { id: 1, status: 'PENDING', name: 'Request 1' },
                { id: 3, status: 'PENDING', name: 'Request 3' },
            ]);
        });
    });

    it('should handle API errors and set requests to null', async () => {
        (getRequests as Mock).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useGetRequests());

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.requests).toBe(null);
        });
    });

    it('should refresh requests when refresh function is called', async () => {
        const mockRequests = [{ id: 1, status: 'PENDING', name: 'Request 1' }];
        (getRequests as Mock).mockResolvedValue(mockRequests);

        const { result } = renderHook(() => useGetRequests());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.requests).toEqual(mockRequests);

        // Mock new data on refresh
        const updatedRequests = [{ id: 2, status: 'PENDING', name: 'Request 2' }];
        (getRequests as Mock).mockResolvedValue(updatedRequests);

        act(() => {
            result.current.refresh();
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.requests).toEqual(updatedRequests);
        });
    });
});
