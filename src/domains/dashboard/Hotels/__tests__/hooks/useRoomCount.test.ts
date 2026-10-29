import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import RoomCount from '@domains/dashboard/Hotels/hooks/useRoomCount';
import { addRoom, deleteRoom, handleCount } from '@domains/dashboard/Hotels/slices/getHotelSlice';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));
vi.mock('@domains/dashboard/Hotels/slices/getHotelSlice', () => ({
    addRoom: vi.fn(),
    deleteRoom: vi.fn(),
    handleCount: vi.fn(),
}));

describe('RoomCount', () => {
    const mockUseAppDispatch = useAppDispatch as any;
    const mockUseAppSelector = useAppSelector as any;
    const mockDispatch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppDispatch.mockReturnValue(mockDispatch);
        mockUseAppSelector.mockReturnValue({
            hotelsRequest: {
                rooms: [{ adult: 1, child: 0, roomIndex: 0, childAge: [] }],
            },
        });
    });

    it('should add a room', () => {
        const { result } = renderHook(() => RoomCount());

        act(() => {
            result.current.handleAddRoom();
        });

        expect(mockDispatch).toHaveBeenCalledWith(addRoom());
    });

    it('should delete a room', () => {
        const { result } = renderHook(() => RoomCount());

        act(() => {
            result.current.roomDelete(0);
        });

        expect(mockDispatch).toHaveBeenCalledWith(deleteRoom({ index: 0 }));
    });

    it('should handle count change for adults', () => {
        const { result } = renderHook(() => RoomCount());

        act(() => {
            result.current.handleCountChange('adult', true, 0);
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            handleCount({ type: 'adult', increment: true, index: 0 })
        );
    });

    it('should not decrement adult count below 1', () => {
        const { result } = renderHook(() => RoomCount());

        act(() => {
            result.current.handleCountChange('adult', false, 0);
        });

        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should handle count change for children', () => {
        const { result } = renderHook(() => RoomCount());

        act(() => {
            result.current.handleCountChange('child', true, 0);
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            handleCount({ type: 'child', increment: true, index: 0 })
        );
    });

    it('should not decrement child count below 0', () => {
        const { result } = renderHook(() => RoomCount());

        act(() => {
            result.current.handleCountChange('child', false, 0);
        });

        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should calculate total adults correctly', () => {
        const { result } = renderHook(() => RoomCount());

        const { totalAdults } = result.current;

        expect(totalAdults).toBe(1);
    });

    it('should calculate total children correctly', () => {
        const { result } = renderHook(() => RoomCount());

        const { totalChildren } = result.current;

        expect(totalChildren).toBe(0);
    });
});
