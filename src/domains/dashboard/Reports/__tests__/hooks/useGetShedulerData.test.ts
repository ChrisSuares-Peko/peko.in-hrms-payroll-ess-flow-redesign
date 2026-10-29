import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllShedulerData, updateSheduler } from '../../api/index';
import { useGetShedulerData } from '../../hooks/useGetShedulerData';

// Mock API calls
vi.mock('../../api/index', () => ({
    getAllShedulerData: vi.fn(),
    updateSheduler: vi.fn(),
}));

// Mock Redux dispatch and selector
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(() => ({
        reducer: { auth: { role: 'admin', id: '123' } },
    })),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));

describe('useGetShedulerData Hook', () => {
    const mockDispatch = vi.fn();
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as any).mockReturnValue(mockDispatch);
    });

    it('should fetch scheduler data on mount', async () => {
        const mockSchedulerData = {
            dailyReport: { email: ['test@example.com'], isActive: true, scheduledTime: '10:00' },
            weeklyReport: {
                email: ['weekly@example.com'],
                isActive: false,
                scheduledTime: '12:00',
                scheduledDay: 'Monday',
            },
            monthlyReport: { email: [], isActive: true, scheduledTime: '08:00' },
        };

        (getAllShedulerData as any).mockResolvedValue(mockSchedulerData);

        const { result } = renderHook(() => useGetShedulerData());

        await act(async () => {
            await result.current.getShedular();
        });

        expect(result.current.scheduler.daily.email).toEqual(['test@example.com']);
        expect(result.current.scheduler.weekly.scheduledDay).toBe('Monday');
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle API failure gracefully', async () => {
        (getAllShedulerData as any).mockResolvedValue(false);

        const { result } = renderHook(() => useGetShedulerData());

        await act(async () => {
            await result.current.getShedular();
        });

        expect(result.current.scheduler.daily.email).toEqual([]);
        expect(result.current.isLoading).toBe(false);
    });

    it('should update the scheduler and show toast on success', async () => {
        (updateSheduler as any).mockResolvedValue('Scheduler updated successfully');

        const { result } = renderHook(() => useGetShedulerData());

        await act(async () => {
            await result.current.handleUpdateBtn(
                'Daily Scheduler',
                ['updated@example.com'],
                '14:00',
                '',
                true
            );
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            showToast({ description: 'Scheduler updated successfully', variant: 'success' })
        );
    });

    it('should not update scheduler if no time is selected', async () => {
        const { result } = renderHook(() => useGetShedulerData());

        await act(async () => {
            await result.current.handleUpdateBtn(
                'Daily Scheduler',
                ['user@example.com'],
                '',
                '',
                true
            );
        });

        expect(updateSheduler).not.toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith(
            showToast({ description: 'Please select a time', variant: 'warning' })
        );
    });

    it('should update scheduler state after a successful update', async () => {
        (updateSheduler as any).mockResolvedValue('Scheduler updated successfully');

        const { result } = renderHook(() => useGetShedulerData());

        await act(async () => {
            await result.current.handleUpdateBtn(
                'Weekly Scheduler',
                ['weekly@example.com'],
                '18:00',
                'Friday',
                true
            );
        });

        expect(updateSheduler).toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith(
            showToast({ description: 'Scheduler updated successfully', variant: 'success' })
        );
    });

    it('should handle API failure when updating scheduler', async () => {
        (updateSheduler as any).mockResolvedValue(false);

        const { result } = renderHook(() => useGetShedulerData());

        await act(async () => {
            await result.current.handleUpdateBtn(
                'Monthly Scheduler',
                ['monthly@example.com'],
                '20:00',
                '',
                true
            );
        });

        expect(updateSheduler).toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalledWith(
            showToast({ description: 'Scheduler updated successfully', variant: 'success' })
        );
    });
});
