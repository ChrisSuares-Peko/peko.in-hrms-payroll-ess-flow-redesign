import { renderHook, act } from '@testing-library/react';
import { describe, beforeEach, vi, it, expect, Mock } from 'vitest';

import useFilter from '../../hooks/useFilter';
import { PackageQueryParams } from '../../types/orderHistory';

describe('useFilter Hook', () => {
    let mockSetFilters: Mock;

    beforeEach(() => {
        mockSetFilters = vi.fn();
    });

    it('should initialize with an empty searchText', () => {
        const { result } = renderHook(() => useFilter({ setFilters: mockSetFilters }));

        expect(result.current.searchText).toBe('');
    });

    it('should update filters and reset page to 1 when handleSearch is called', () => {
        const { result } = renderHook(() => useFilter({ setFilters: mockSetFilters }));

        act(() => {
            result.current.handleSearch({ target: { value: 'test search' } });
        });

        expect(mockSetFilters).toHaveBeenCalledWith(expect.any(Function));

        // Simulate how the function modifies state
        const updateFn = mockSetFilters.mock.calls[0][0];
        const prevState: PackageQueryParams = { page: 2, itemsPerPage: 5 };
        const newState = updateFn(prevState);

        expect(newState).toEqual({
            ...prevState,
            searchText: 'test search',
            page: 1,
        });
    });

    it('should update the page number when handlePageChange is called', () => {
        const { result } = renderHook(() => useFilter({ setFilters: mockSetFilters }));

        act(() => {
            result.current.handlePageChange(3, 8);
        });

        expect(mockSetFilters).toHaveBeenCalledWith(expect.any(Function));

        const updateFn = mockSetFilters.mock.calls[0][0];
        const prevState: PackageQueryParams = { page: 1, itemsPerPage: 5 };
        const newState = updateFn(prevState);

        expect(newState).toEqual({
            ...prevState,
            page: 3,
        });
    });

    it('should reset filters and searchText when handleChangeFilters is called', () => {
        const { result } = renderHook(() => useFilter({ setFilters: mockSetFilters }));

        act(() => {
            result.current.handleChangeFilters({ target: { value: '' } });
        });

        expect(mockSetFilters).toHaveBeenCalledWith(expect.any(Function));

        const updateFn = mockSetFilters.mock.calls[0][0];
        const prevState: PackageQueryParams = { page: 3, itemsPerPage: 5 };
        const newState = updateFn(prevState);

        expect(newState).toEqual({
            ...prevState,
            page: 1,
        });

        expect(result.current.searchText).toBe('');
    });
});
