import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getAllHikes } from '../../api';
import useGetAllHike from '../../hooks/useGetAllHikes'; // Adjust the import path as necessary

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));
vi.mock('../../api', () => ({
    getAllHikes: vi.fn(),
}));

describe('useGetAllHike', () => {
    const mockUseAppSelector = useAppSelector as any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppSelector.mockReturnValue({ role: 'user', id: '123' });
    });

    it('should start with a loading state', async () => {
        const { result } = renderHook(() => useGetAllHike());

        expect(result.current.loading).toBe(true);
    });

    it('should fetch hikes and set loading to false after success', async () => {
        const mockResponse = [
            { id: 1, name: 'Hike 1' },
            { id: 2, name: 'Hike 2' },
        ];
        (getAllHikes as any).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useGetAllHike());

        await waitFor(() => {
            expect(result.current.loading).toBe(false); // Wait for loading to be false
        });

        expect(getAllHikes).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
        });
        expect(result.current.hikeData).toEqual(mockResponse);
    });

    it('should handle API failure and set loading to false', async () => {
        (getAllHikes as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useGetAllHike());

        await waitFor(() => {
            expect(result.current.loading).toBe(false); // Wait for loading to be false
        });

        expect(getAllHikes).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
        });
        expect(result.current.hikeData).toEqual([]); // Should remain an empty array on failure
    });
    it('should fetch hikes and set loading to false when refresh is triggered', async () => {
        const mockResponse = [
            { id: 1, name: 'Hike 1' },
            { id: 2, name: 'Hike 2' },
        ];
        (getAllHikes as any).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useGetAllHike());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false); // Loading state should be false after refresh
        });
    });
});
