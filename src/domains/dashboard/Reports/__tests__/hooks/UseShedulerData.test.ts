import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';

import UseShedulerData from '../../hooks/UseShedulerData';

// Mock useAppDispatch
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));

describe('UseShedulerData Hook', () => {
    let dispatchMock: any;
    let handleUpdateBtnMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        dispatchMock = vi.fn();
        handleUpdateBtnMock = vi.fn();
        (useAppDispatch as any).mockReturnValue(dispatchMock);
    });

    it('should initialize with correct default values', () => {
        const { result } = renderHook(() =>
            UseShedulerData({
                handleUpdateBtn: handleUpdateBtnMock,
                title: 'Test Scheduler',
                isActive: true,
                email: ['test@example.com'],
                scheduledTime: '10:00',
                scheduledDay: 'Monday',
            })
        );

        expect(result.current.active).toBe(true);
        expect(result.current.timeVal).toBe('10:00');
        expect(result.current.values).toEqual(['test@example.com']);
        expect(result.current.WeekVal).toBe('Monday');
    });

    it('should handle email input change', () => {
        const { result } = renderHook(() =>
            UseShedulerData({
                handleUpdateBtn: handleUpdateBtnMock,
                title: 'Test Scheduler',
                isActive: true,
                email: [],
                scheduledTime: '10:00',
                scheduledDay: 'Monday',
            })
        );

        act(() => {
            result.current.handleInputChange({ target: { value: 'new@example.com' } });
        });

        expect(result.current.inputValue).toBe('new@example.com');
    });

    it('should validate and add email', () => {
        const { result } = renderHook(() =>
            UseShedulerData({
                handleUpdateBtn: handleUpdateBtnMock,
                title: 'Test Scheduler',
                isActive: true,
                email: [],
                scheduledTime: '10:00',
                scheduledDay: 'Monday',
            })
        );

        act(() => {
            result.current.handleInputChange({ target: { value: 'valid@example.com' } });
        });

        act(() => {
            result.current.validateAddEmail();
        });

        expect(result.current.values).toContain('valid@example.com');
    });

    it('should handle switch change correctly', () => {
        const { result } = renderHook(() =>
            UseShedulerData({
                handleUpdateBtn: handleUpdateBtnMock,
                title: 'Test Scheduler',
                isActive: false,
                email: ['user@example.com'],
                scheduledTime: '10:00',
                scheduledDay: 'Monday',
            })
        );

        act(() => {
            result.current.handleSwitchChange(true);
        });

        expect(handleUpdateBtnMock).toHaveBeenCalledWith(
            'Test Scheduler',
            ['user@example.com'],
            '10:00',
            'Monday',
            true
        );
    });
});
