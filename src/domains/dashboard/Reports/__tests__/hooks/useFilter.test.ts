import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import useFilter from '../../hooks/useFilter';

describe('useFilter Hook', () => {
    let mockSetFilter: any;

    beforeEach(() => {
        mockSetFilter = vi.fn();
    });

    it('should call setFilter with search text and reset page to 1', () => {
        const { result } = renderHook(() =>
            useFilter({
                setFilter: mockSetFilter,
                initalStartDate: '2024-01-01',
                initalEndDate: '2024-12-31',
            })
        );

        act(() => {
            result.current.handleSearch('test search');
        });

        // Manually execute the state updater function
        const updateFn = mockSetFilter.mock.calls[0][0]; // Retrieve function call
        const updatedState = updateFn({ page: 2, searchText: '' }); // Pass initial state

        expect(updatedState).toEqual({ page: 1, searchText: 'test search' });
    });

    it('should call setFilter with selected category and reset page to 1', () => {
        const { result } = renderHook(() =>
            useFilter({
                setFilter: mockSetFilter,
                initalStartDate: '2024-01-01',
                initalEndDate: '2024-12-31',
            })
        );

        act(() => {
            result.current.handleChangeFilters('completed');
        });

        const updateFn = mockSetFilter.mock.calls[0][0];
        const updatedState = updateFn({ category: '', page: 2 });

        expect(updatedState).toEqual({ category: 'completed', page: 1 });
    });

    it('should call setFilter when pagination changes', () => {
        const { result } = renderHook(() =>
            useFilter({
                setFilter: mockSetFilter,
                initalStartDate: '2024-01-01',
                initalEndDate: '2024-12-31',
            })
        );

        act(() => {
            result.current.handlePageChange(3, 2);
        });

        const updateFn = mockSetFilter.mock.calls[0][0];
        const updatedState = updateFn({ page: 1 });

        expect(updatedState).toEqual({ page: 3 });
    });

    it('should reset date filter when null is passed', () => {
        const { result } = renderHook(() =>
            useFilter({
                setFilter: mockSetFilter,
                initalStartDate: '2024-01-01',
                initalEndDate: '2024-12-31',
            })
        );

        act(() => {
            result.current.handleDateChange(null as unknown as any, ['', '']);
        });

        const updateFn = mockSetFilter.mock.calls[0][0];
        const updatedState = updateFn({ from: '2024-06-01', to: '2024-06-15', page: 1 });

        expect(updatedState).toEqual({ from: '2024-01-01', to: '2024-12-31', page: 1 });
    });

    it('should reset date filter when null is passed', () => {
        const { result } = renderHook(() =>
            useFilter({
                setFilter: mockSetFilter,
                initalStartDate: '2024-01-01',
                initalEndDate: '2024-12-31',
            })
        );

        act(() => {
            result.current.handleDateChange(null as unknown as any, ['', '']);
        });

        const updateFn = mockSetFilter.mock.calls[0][0];
        const updatedState = updateFn({ from: '2024-06-01', to: '2024-06-15', page: 1 });

        expect(updatedState).toEqual({ from: '2024-01-01', to: '2024-12-31', page: 1 });
    });

    it('should set sort field and order', () => {
        const { result } = renderHook(() =>
            useFilter({
                setFilter: mockSetFilter,
                initalStartDate: '2024-01-01',
                initalEndDate: '2024-12-31',
            })
        );

        act(() => {
            result.current.handleSort('amount', 'ASC');
        });

        const updateFn = mockSetFilter.mock.calls[0][0];
        const updatedState = updateFn({ sortField: '', sort: 'DESC', page: 1 });

        expect(updatedState).toEqual({ sortField: 'amount', sort: 'ASC', page: 1 });
    });
});
