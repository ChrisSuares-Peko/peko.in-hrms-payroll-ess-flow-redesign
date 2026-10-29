import { renderHook, waitFor } from '@testing-library/react';
import { describe, beforeEach, it, expect, vi, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { detailsApi } from '../../api/detailsApi';
import { useDetailsApi } from '../../hooks/useDetailsApi';

vi.mock('../../api/detailsApi');
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('useDetailsApi', () => {
    const mockWorkId = '123';
    const mockUser = { id: 'user1', role: 'admin' };
    const mockData = { id: mockWorkId, title: 'Test Work' };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue(mockUser);
    });

    it('should initialize with isLoading as true', () => {
        const { result } = renderHook(() => useDetailsApi(mockWorkId));
        expect(result.current.isLoading).toBe(true);
    });

    it('should call detailsApi and update state on success', async () => {
        (detailsApi as Mock).mockResolvedValue(mockData);

        const { result } = renderHook(() => useDetailsApi(mockWorkId));

        await waitFor(() => {
            expect(detailsApi).toHaveBeenCalledWith({
                userId: mockUser.id,
                userType: mockUser.role,
                workId: mockWorkId,
            });
            expect(result.current.data).toEqual(mockData);
            expect(result.current.isLoading).toBe(false);
        });
    });

    it('should set isLoading to false if API returns false', async () => {
        (detailsApi as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useDetailsApi(mockWorkId));

        await waitFor(() => {
            expect(result.current.data).toBeUndefined();
            expect(result.current.isLoading).toBe(false);
        });
    });

    it('should handle API errors gracefully', async () => {
        (detailsApi as Mock).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useDetailsApi(mockWorkId));

        await waitFor(() => {
            expect(result.current.data).toBeUndefined();
            expect(result.current.isLoading).toBe(false);
        });
    });
});
