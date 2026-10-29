import { renderHook, act } from '@testing-library/react';
import { Dayjs } from 'dayjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import useSubscriptionFilter from '../../hooks/useSubscriptionFilter';

describe('useSubscriptionFilter Hook', () => {
    let setFilterMock: any;

    beforeEach(() => {
        setFilterMock = vi.fn();
    });

    it('should update search text and set filter correctly', () => {
        const { result } = renderHook(() =>
            useSubscriptionFilter({
                setFilter: setFilterMock,
                initalStartDate: '2024-01-01',
                initalEndDate: '2024-12-31',
            })
        );

        act(() => {
            result.current.handleSearch('test');
        });

        expect(setFilterMock).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should update category filter correctly', () => {
        const { result } = renderHook(() =>
            useSubscriptionFilter({
                setFilter: setFilterMock,
                initalStartDate: '2024-01-01',
                initalEndDate: '2024-12-31',
            })
        );

        act(() => {
            result.current.handleChangeFilters('Streaming');
        });

        expect(setFilterMock).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should update date filter correctly', () => {
        const { result } = renderHook(() =>
            useSubscriptionFilter({
                setFilter: setFilterMock,
                initalStartDate: '2024-01-01',
                initalEndDate: '2024-12-31',
            })
        );

        act(() => {
            result.current.handleDateChange([null, null] as [Dayjs | null, Dayjs | null], ['', '']);
        });

        expect(setFilterMock).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle table sorting correctly', () => {
        const { result } = renderHook(() =>
            useSubscriptionFilter({
                setFilter: setFilterMock,
                initalStartDate: '2024-01-01',
                initalEndDate: '2024-12-31',
            })
        );

        act(() =>
            result.current.handleTableChange(
                { current: 1, pageSize: 10 },
                {},
                { field: 'date', order: 'ascend' },
                {
                    currentDataSource: [],
                    action: 'sort',
                }
            )
        );

        expect(setFilterMock).toHaveBeenCalledWith(expect.any(Function));
    });
});
