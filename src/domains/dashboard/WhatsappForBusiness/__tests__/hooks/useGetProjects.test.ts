import { renderHook, act } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getAllProjects } from '../../api/index';
import GetAllProjects from '../../hooks/useGetProjects';

vi.mock('../../api/index', () => ({
    getAllProjects: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('GetAllProjects Hook', () => {
    const mockProjects = [
        { id: 'p1', name: 'Project One', status: 'active' },
        { id: 'p2', name: 'Project Two', status: 'inactive' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: 'user123' });
    });

    it('should initialize with isLoading as true and projectData as undefined', () => {
        const { result } = renderHook(() => GetAllProjects());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.projectData).toBeUndefined();
    });

    it('should fetch project details and update state', async () => {
        (getAllProjects as Mock).mockResolvedValue(mockProjects);

        const { result } = renderHook(() => GetAllProjects());

        await act(async () => {
            await result.current.projectData; // Ensure the API call is awaited
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.projectData).toEqual(mockProjects);
    });

    it('should handle API failure and set isLoading to false', async () => {
        (getAllProjects as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => GetAllProjects());

        await act(async () => {
            await result.current.projectData;
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.projectData).toBeUndefined();
    });

    it('should refetch data when refresh prop changes', async () => {
        (getAllProjects as Mock).mockResolvedValue(mockProjects);

        const { result, rerender } = renderHook(({ refresh }) => GetAllProjects(refresh), {
            initialProps: { refresh: false },
        });

        await act(async () => {
            await result.current.projectData;
        });

        expect(getAllProjects).toHaveBeenCalledTimes(1);

        rerender({ refresh: true });

        await act(async () => {
            await result.current.projectData;
        });

        expect(getAllProjects).toHaveBeenCalledTimes(2);
    });
});
