import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import useFilter from '../../../hooks/user_management/useFilter';
import { SubCorporateQueryParams } from '../../../types/userManagement';

describe('useFilter', () => {
    const initialFilters: SubCorporateQueryParams = {
        page: 1,
        itemsPerPage: 10,
        status: '',
        searchText: '',
        reload: false,
    };

    it('should update the page when handlePageChange is called', () => {
        const setFilters = vi.fn(updateFn => {
            const newState = updateFn(initialFilters);
            expect(newState).toEqual({
                ...initialFilters,
                page: 2,
                itemsPerPage: 10, // Ensure that this remains unchanged
            });
        });

        const { result } = renderHook(() => useFilter({ setFilters }));

        act(() => {
            result.current.handlePageChange(2, 10); // Provide both `page` and `pageSize`
        });

        expect(setFilters).toHaveBeenCalled();
    });

    it('should toggle the reload state when reloadTable is called', () => {
        let currentState = { ...initialFilters };

        const setFilters = vi.fn(updateFn => {
            currentState = updateFn(currentState);
        });

        const { result } = renderHook(() => useFilter({ setFilters }));

        act(() => {
            result.current.reloadTable();
        });

        expect(currentState.reload).toBe(true);

        act(() => {
            result.current.reloadTable();
        });

        expect(currentState.reload).toBe(false);
    });

    it('should update the searchText when handleSearch is called', () => {
        const setFilters = vi.fn(updateFn => {
            const newState = updateFn(initialFilters);
            expect(newState).toEqual({
                ...initialFilters,
                searchText: 'Test search',
            });
        });

        const { result } = renderHook(() => useFilter({ setFilters }));

        act(() => {
            result.current.handleSearch('Test search');
        });

        expect(setFilters).toHaveBeenCalled();
    });
});
