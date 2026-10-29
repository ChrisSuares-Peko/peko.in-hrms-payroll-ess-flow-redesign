import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import useFilter from '../../hooks/useFilter';

describe('useFilter Hook', () => {
    it('should initialize with an empty searchText', () => {
        const setFiltersMock = vi.fn();
        const { result } = renderHook(() => useFilter({ setFilters: setFiltersMock }));

        expect(result.current.searchText).toBe('');
    });

    it('should update searchText when handleSearch is called', () => {
        const setFiltersMock = vi.fn();
        const { result } = renderHook(() => useFilter({ setFilters: setFiltersMock }));

        act(() => {
            result.current.handleSearch({ target: { value: 'test' } });
        });

        expect(result.current.searchText).toBe('test');
    });

    it('should call setFilters with the correct page number on handlePageChange', () => {
        const setFiltersMock = vi.fn();
        const { result } = renderHook(() => useFilter({ setFilters: setFiltersMock }));

        act(() => {
            result.current.handlePageChange(2, 9);
        });

        expect(setFiltersMock).toHaveBeenCalledTimes(1);
        expect(setFiltersMock).toHaveBeenCalledWith(expect.any(Function));

        // Simulate state update to check the passed function behavior
        const prevState = { page: 1, searchText: '' };
        const updatedState = setFiltersMock.mock.calls[0][0](prevState);

        expect(updatedState).toEqual({ ...prevState, page: 2 });
    });
});
