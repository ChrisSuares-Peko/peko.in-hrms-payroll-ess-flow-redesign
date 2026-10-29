import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { plansApi } from '../../api/plansApi';
import { usePlansApi } from '../../hooks/usePlansApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));
vi.mock('../../api/plansApi', () => ({
    plansApi: vi.fn(),
}));

describe('usePlansApi', () => {
    const mockPlans = [
        { id: '1', name: 'Plan A', price: 100 },
        { id: '2', name: 'Plan B', price: 200 },
    ];
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ id: 'user123', role: 'admin' });
    });
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch and set plans correctly', async () => {
        (plansApi as Mock).mockResolvedValue({ data: mockPlans });

        const { result } = renderHook(() => usePlansApi('work123'));

        await act(async () => {
            await result.current;
        });

        expect(plansApi).toHaveBeenCalledWith({
            userId: expect.any(String),
            userType: expect.any(String),
            workId: 'work123',
        });

        expect(result.current.data).toEqual(mockPlans);
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
        (plansApi as Mock).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => usePlansApi('work123'));

        await act(async () => {
            await result.current;
        });

        expect(plansApi).toHaveBeenCalled();
        expect(result.current.data).toEqual([]); // Expect empty data on failure
        expect(result.current.isLoading).toBe(false);
    });

    it('should refetch data when workId changes', async () => {
        const { result, rerender } = renderHook(({ workId }) => usePlansApi(workId), {
            initialProps: { workId: '123' },
        });

        // Wait for initial API call
        await act(async () => {
            await result.current;
        });

        expect(plansApi).toHaveBeenCalledTimes(1);
        expect(plansApi).toHaveBeenCalledWith({
            userId: 'user123',
            userType: 'admin',
            workId: '123',
        });

        rerender({ workId: '456' });

        await act(async () => {
            await result.current;
        });

        expect(plansApi).toHaveBeenCalledTimes(2);
        expect(plansApi).toHaveBeenCalledWith({
            userId: 'user123',
            userType: 'admin',
            workId: '456',
        });
    });

    it('should handle empty API response', async () => {
        (plansApi as Mock).mockResolvedValue({ data: [] });

        const { result } = renderHook(() => usePlansApi('work123'));

        await act(async () => {
            await result.current;
        });

        expect(plansApi).toHaveBeenCalled();
        expect(result.current.data).toEqual([]); // Ensure it handles empty data
        expect(result.current.isLoading).toBe(false);
    });
});
