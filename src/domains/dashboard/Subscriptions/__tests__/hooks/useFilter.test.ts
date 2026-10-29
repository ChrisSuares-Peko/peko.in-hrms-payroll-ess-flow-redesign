import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import useFilter from '../../hooks/useFilter';
import { filterState } from '../../types/types';

const initialFilterState: filterState = {
    search: '',
    start: 1,
    length: 10,
    draw: 1,
    from: '',
    to: '',
};

const setFilterMock = vi.fn();

describe('useFilter hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    afterEach(() => {
        cleanup();
    });
    test('should update search value and reset start on handleSearch', () => {
        const { result } = renderHook(() => useFilter({ setFilter: setFilterMock }));

        const mockEvent = { target: { value: 'test search' } };

        act(() => {
            result.current.handleSearch(mockEvent as any);
        });

        // Verify that setFilterMock was called with a function that updates the state correctly
        expect(setFilterMock).toHaveBeenCalledWith(expect.any(Function));

        // Extract the function and verify its behavior
        const updaterFunction = setFilterMock.mock.calls[0][0];
        const updatedState = updaterFunction(initialFilterState);

        expect(updatedState).toEqual({
            ...initialFilterState,
            search: 'test search',
            start: 1,
        });
    });

    test('should update start and length on handlePageChange', () => {
        const { result } = renderHook(() => useFilter({ setFilter: setFilterMock }));

        // Simulate page change
        act(() => {
            result.current.handlePageChange(2, 20);
        });

        // Verify that setFilterMock was called with a function that updates the state correctly
        expect(setFilterMock).toHaveBeenCalledWith(expect.any(Function));

        // Extract the function and verify its behavior
        const updaterFunction = setFilterMock.mock.calls[0][0];
        const updatedState = updaterFunction(initialFilterState);

        expect(updatedState).toEqual({
            ...initialFilterState,
            start: 2,
            length: 20,
        });
    });

    test('should handle default parameters for handlePageChange', () => {
        const { result } = renderHook(() => useFilter({ setFilter: setFilterMock }));

        act(() => {
            result.current.handlePageChange(1, 10);
        });

        expect(setFilterMock).toHaveBeenCalledWith(expect.any(Function));

        const updaterFunction = setFilterMock.mock.calls[0][0];
        const updatedState = updaterFunction(initialFilterState);

        expect(updatedState).toEqual({
            ...initialFilterState,
            start: 1,
            length: 10,
        });
    });

    test('should handle empty search term correctly', () => {
        const { result } = renderHook(() => useFilter({ setFilter: setFilterMock }));

        const mockEvent = { target: { value: '' } };

        act(() => {
            result.current.handleSearch(mockEvent as any);
        });

        expect(setFilterMock).toHaveBeenCalledWith(expect.any(Function));

        const updaterFunction = setFilterMock.mock.calls[0][0];
        const updatedState = updaterFunction(initialFilterState);

        expect(updatedState).toEqual({
            ...initialFilterState,
            search: '',
            start: 1,
        });
    });

    test('should handle page change with edge values', () => {
        const { result } = renderHook(() => useFilter({ setFilter: setFilterMock }));

        act(() => {
            result.current.handlePageChange(0, 100);
        });

        expect(setFilterMock).toHaveBeenCalledWith(expect.any(Function));

        const updaterFunction = setFilterMock.mock.calls[0][0];
        const updatedState = updaterFunction(initialFilterState);

        expect(updatedState).toEqual({
            ...initialFilterState,
            start: 0,
            length: 100,
        });
    });

    test('should not change state if handleSearch or handlePageChange are not called', () => {
        renderHook(() => useFilter({ setFilter: setFilterMock }));

        // Verify initial state without any interaction
        expect(setFilterMock).not.toHaveBeenCalled();
    });
});
