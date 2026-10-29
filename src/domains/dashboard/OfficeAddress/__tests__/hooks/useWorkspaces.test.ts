import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAppSelector } from '@hooks/store';

import { getAllWorkspaces } from '../../api/index';
import useWorkspacesApi from '../../hooks/useWorkspaces';

vi.mock('@hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../api/index', () => ({
    getAllWorkspaces: vi.fn(),
}));

describe('useWorkspacesApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock Redux store selector
        (useAppSelector as any).mockImplementation((selectorFn: any) =>
            selectorFn({
                reducer: {
                    auth: { id: 1, role: 'user' },
                },
            })
        );
    });

    it('fetches and sets workspaces correctly for a given planId', async () => {
        const mockResponse = {
            data: [
                { id: 1, planId: 101, name: 'Workspace A' },
                { id: 2, planId: 102, name: 'Workspace B' },
                { id: 3, planId: 101, name: 'Workspace C' },
            ],
        };

        (getAllWorkspaces as any).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useWorkspacesApi(101));

        expect(result.current.isLoading).toBe(true);

        await act(async () => {});

        expect(getAllWorkspaces).toHaveBeenCalledWith({
            userId: 1,
            userType: 'user',
        });

        expect(result.current.workspaces).toEqual([
            { id: 1, planId: 101, name: 'Workspace A' },
            { id: 3, planId: 101, name: 'Workspace C' },
        ]);

        expect(result.current.isLoading).toBe(false);
    });

    it('returns an empty array if no workspaces match the planId', async () => {
        const mockResponse = {
            data: [
                { id: 1, planId: 202, name: 'Workspace X' },
                { id: 2, planId: 203, name: 'Workspace Y' },
            ],
        };

        (getAllWorkspaces as any).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useWorkspacesApi(101));

        expect(result.current.isLoading).toBe(true);

        await act(async () => {});

        expect(result.current.workspaces).toEqual([]); // No matches for planId 101
        expect(result.current.isLoading).toBe(false);
    });

    it('handles API failure gracefully', async () => {
        (getAllWorkspaces as any).mockResolvedValue(false);

        const { result } = renderHook(() => useWorkspacesApi(101));

        expect(result.current.isLoading).toBe(true);

        await act(async () => {});

        expect(result.current.workspaces).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });
});
