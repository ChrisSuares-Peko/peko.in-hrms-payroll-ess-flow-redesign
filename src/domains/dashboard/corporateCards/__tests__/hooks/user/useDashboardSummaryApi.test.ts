import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';

import { getDashboardSummary } from '../../../api/user/dashboardApi';
import { useDashboardSummaryApi } from '../../../hooks/user/useDashboardSummaryApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/user/dashboardApi', () => ({
    getDashboardSummary: vi.fn(),
}));

const mockAuthState = {
    role: 'user',
    id: 1,
    roleName: 'user',
    username: 'testuser',
    subCorporateId: null,
};

const mockSummaryData = {
    totalSpend: 5000,
    availableBalance: 15000,
    activeCards: 3,
    pendingTransactions: 2,
};

describe('useDashboardSummaryApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
            fn({ reducer: { auth: mockAuthState } })
        );
        (useAppDispatch as unknown as Mock).mockReturnValue(vi.fn());
    });

    it('should have initial state with isLoading=true and summary=null', () => {
        (getDashboardSummary as Mock).mockReturnValue(new Promise(() => {}));

        const { result } = renderHook(() => useDashboardSummaryApi());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.summary).toBeNull();
    });

    it('should set summary and isLoading=false on successful fetch', async () => {
        (getDashboardSummary as Mock).mockResolvedValue({ data: mockSummaryData });

        const { result } = renderHook(() => useDashboardSummaryApi());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.summary).toEqual(mockSummaryData);
    });

    it('should keep summary=null and set isLoading=false when fetch returns false', async () => {
        (getDashboardSummary as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useDashboardSummaryApi());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.summary).toBeNull();
    });

    it('should keep summary=null and set isLoading=false when fetch returns null', async () => {
        (getDashboardSummary as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useDashboardSummaryApi());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.summary).toBeNull();
    });

    it('should keep summary=null and set isLoading=false when fetch returns response without data', async () => {
        (getDashboardSummary as Mock).mockResolvedValue({ data: null });

        const { result } = renderHook(() => useDashboardSummaryApi());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.summary).toBeNull();
    });

    it('should call getDashboardSummary with role and id from auth state', async () => {
        (getDashboardSummary as Mock).mockResolvedValue({ data: mockSummaryData });

        renderHook(() => useDashboardSummaryApi());

        await waitFor(() => {
            expect(getDashboardSummary).toHaveBeenCalledWith(mockAuthState.role, mockAuthState.id);
        });
    });

    it('should call getDashboardSummary exactly once on initial mount', async () => {
        (getDashboardSummary as Mock).mockResolvedValue({ data: mockSummaryData });

        renderHook(() => useDashboardSummaryApi());

        await waitFor(() => {
            expect(getDashboardSummary).toHaveBeenCalledTimes(1);
        });
    });

    it('should not update state after unmount (active=false guard)', async () => {
        let resolvePromise!: (value: any) => void;
        const pendingPromise = new Promise(resolve => {
            resolvePromise = resolve;
        });

        (getDashboardSummary as Mock).mockReturnValue(pendingPromise);

        const { result, unmount } = renderHook(() => useDashboardSummaryApi());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.summary).toBeNull();

        unmount();

        await act(async () => {
            resolvePromise({ data: mockSummaryData });
            await Promise.resolve();
        });

        expect(result.current.isLoading).toBe(true);
        expect(result.current.summary).toBeNull();
    });

    it('should re-fetch when role changes', async () => {
        (getDashboardSummary as Mock).mockResolvedValue({ data: mockSummaryData });

        (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
            fn({ reducer: { auth: { ...mockAuthState, role: 'admin' } } })
        );

        const { result, rerender } = renderHook(() => useDashboardSummaryApi());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(getDashboardSummary).toHaveBeenCalledWith('admin', mockAuthState.id);

        const updatedSummary = {
            totalSpend: 99999,
            availableBalance: 50000,
            activeCards: 10,
            pendingTransactions: 5,
        };
        (getDashboardSummary as Mock).mockResolvedValue({ data: updatedSummary });

        (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
            fn({ reducer: { auth: { ...mockAuthState, role: 'superadmin' } } })
        );

        rerender();

        await waitFor(() => {
            expect(getDashboardSummary).toHaveBeenCalledWith('superadmin', mockAuthState.id);
        });

        await waitFor(() => {
            expect(result.current.summary).toEqual(updatedSummary);
        });
    });

    it('should re-fetch when id changes', async () => {
        (getDashboardSummary as Mock).mockResolvedValue({ data: mockSummaryData });

        const { result, rerender } = renderHook(() => useDashboardSummaryApi());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        const updatedSummary = {
            totalSpend: 1234,
            availableBalance: 9876,
            activeCards: 1,
            pendingTransactions: 0,
        };
        (getDashboardSummary as Mock).mockResolvedValue({ data: updatedSummary });

        (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
            fn({ reducer: { auth: { ...mockAuthState, id: 42 } } })
        );

        rerender();

        await waitFor(() => {
            expect(getDashboardSummary).toHaveBeenCalledWith(mockAuthState.role, 42);
        });

        await waitFor(() => {
            expect(result.current.summary).toEqual(updatedSummary);
        });
    });

    it('should set isLoading=true at the start of each fetch', async () => {
        const loadingStates: boolean[] = [];

        (getDashboardSummary as Mock).mockResolvedValue({ data: mockSummaryData });

        const { result } = renderHook(() => {
            const hookResult = useDashboardSummaryApi();
            loadingStates.push(hookResult.isLoading);
            return hookResult;
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(loadingStates[0]).toBe(true);
    });

    it('should handle re-fetch keeping previous summary until new data arrives', async () => {
        (getDashboardSummary as Mock).mockResolvedValueOnce({ data: mockSummaryData });

        const { result, rerender } = renderHook(() => useDashboardSummaryApi());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.summary).toEqual(mockSummaryData);
        });

        const newSummaryData = {
            totalSpend: 8000,
            availableBalance: 12000,
            activeCards: 5,
            pendingTransactions: 1,
        };

        let resolveSecond!: (value: any) => void;
        (getDashboardSummary as Mock).mockReturnValue(
            new Promise(resolve => {
                resolveSecond = resolve;
            })
        );

        (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
            fn({ reducer: { auth: { ...mockAuthState, id: 99 } } })
        );

        rerender();

        await waitFor(() => {
            expect(result.current.isLoading).toBe(true);
        });

        await act(async () => {
            resolveSecond({ data: newSummaryData });
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.summary).toEqual(newSummaryData);
        });
    });
});
