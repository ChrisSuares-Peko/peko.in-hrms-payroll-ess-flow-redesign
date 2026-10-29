import { renderHook, act } from '@testing-library/react';
import dayjs from 'dayjs';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useFilter from '../../hooks/useFilter';

describe('useFilter Hook', () => {
    let setFiltersMock: any;

    beforeEach(() => {
        setFiltersMock = vi.fn();
    });

    const initialStartDate = '2024-06-01';
    const initialEndDate = '2024-06-30';

    it('updates module filter when handleChangeModule is called', () => {
        const { result } = renderHook(() =>
            useFilter({
                setFilters: setFiltersMock,
                initalStartDate: initialStartDate,
                initalEndDate: initialEndDate,
            })
        );

        act(() => {
            result.current.handleChangeModule('newModule');
        });

        expect(setFiltersMock).toHaveBeenCalledWith(expect.any(Function));
        expect(setFiltersMock.mock.calls[0][0]({})).toEqual({
            module: 'newModule',
            page: 1,
        });
    });

    it('updates page when handlePageChange is called', () => {
        const { result } = renderHook(() =>
            useFilter({
                setFilters: setFiltersMock,
                initalStartDate: initialStartDate,
                initalEndDate: initialEndDate,
            })
        );

        act(() => {
            result.current.handlePageChange(3, 1);
        });

        expect(setFiltersMock).toHaveBeenCalledWith(expect.any(Function));
        expect(setFiltersMock.mock.calls[0][0]({})).toEqual({
            page: 3,
        });
    });

    it('updates date range when handleDateChange is called', () => {
        const { result } = renderHook(() =>
            useFilter({
                setFilters: setFiltersMock,
                initalStartDate: initialStartDate,
                initalEndDate: initialEndDate,
            })
        );

        act(() => {
            result.current.handleDateChange(
                [dayjs('2024-06-10'), dayjs('2024-06-20')],
                ['2024-06-10', '2024-06-20']
            );
        });

        expect(setFiltersMock).toHaveBeenCalledWith(expect.any(Function));
        expect(setFiltersMock.mock.calls[0][0]({})).toEqual({
            from: '2024-06-10',
            to: '2024-06-20',
            page: 1,
        });
    });

    it('resets date range to initial values when null is passed to handleDateChange', () => {
        const { result } = renderHook(() =>
            useFilter({
                setFilters: setFiltersMock,
                initalStartDate: initialStartDate,
                initalEndDate: initialEndDate,
            })
        );

        act(() => {
            result.current.handleDateChange(null as unknown as any, ['', '']);
        });

        expect(setFiltersMock).toHaveBeenCalledWith(expect.any(Function));
        expect(setFiltersMock.mock.calls[0][0]({})).toEqual({
            from: initialStartDate,
            to: initialEndDate,
            page: 1,
        });
    });

    it('updates the from date when handleFromChange is called', () => {
        const { result } = renderHook(() =>
            useFilter({
                setFilters: setFiltersMock,
                initalStartDate: initialStartDate,
                initalEndDate: initialEndDate,
            })
        );

        act(() => {
            result.current.handleFromChange(dayjs('2024-06-15'), '2024-06-15');
        });

        expect(setFiltersMock).toHaveBeenCalledWith(expect.any(Function));
        expect(setFiltersMock.mock.calls[0][0]({})).toEqual({
            from: '2024-06-15',
            page: 1,
        });
    });

    it('resets the from date when null is passed to handleFromChange', () => {
        const { result } = renderHook(() =>
            useFilter({
                setFilters: setFiltersMock,
                initalStartDate: initialStartDate,
                initalEndDate: initialEndDate,
            })
        );

        act(() => result.current.handleFromChange(null as unknown as any, ''));

        expect(setFiltersMock).toHaveBeenCalledWith(expect.any(Function));
        expect(setFiltersMock.mock.calls[0][0]({})).toEqual({
            from: initialStartDate,
            page: 1,
        });
    });

    it('updates the to date when handleToChange is called', () => {
        const { result } = renderHook(() =>
            useFilter({
                setFilters: setFiltersMock,
                initalStartDate: initialStartDate,
                initalEndDate: initialEndDate,
            })
        );

        act(() => {
            result.current.handleToChange(dayjs('2024-06-25'), '2024-06-25');
        });

        expect(setFiltersMock).toHaveBeenCalledWith(expect.any(Function));
        expect(setFiltersMock.mock.calls[0][0]({})).toEqual({
            to: '2024-06-25',
            page: 1,
        });
    });

    it('resets the to date when null is passed to handleToChange', () => {
        const { result } = renderHook(() =>
            useFilter({
                setFilters: setFiltersMock,
                initalStartDate: initialStartDate,
                initalEndDate: initialEndDate,
            })
        );

        act(() => {
            act(() => result.current.handleFromChange(null as unknown as any, ''));
        });

        expect(setFiltersMock).toHaveBeenCalledWith(expect.any(Function));
        expect(setFiltersMock.mock.calls[0][0]({})).toEqual({
            page: 1,
            from: '2024-06-01',
        });
    });
});
