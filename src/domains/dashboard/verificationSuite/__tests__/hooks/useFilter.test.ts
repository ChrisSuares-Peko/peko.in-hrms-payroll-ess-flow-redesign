import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import useFilter from '../../hooks/useFilter';

describe('useFilter Hook', () => {
    const setup = () => {
        const setFilters = vi.fn();
        const { result } = renderHook(() =>
            useFilter({ setFilters, initalStartDate: '2026-06-01', initalEndDate: '2026-07-01' })
        );
        return { result, setFilters };
    };

    const runUpdater = (setFilters: any, prevState: any) => {
        const updater = setFilters.mock.calls[0][0];
        return updater(prevState);
    };

    it('handleSearch updates searchText and resets to page 1', () => {
        const { result, setFilters } = setup();

        result.current.handleSearch('pan');

        expect(runUpdater(setFilters, { page: 5 })).toEqual({ page: 1, searchText: 'pan' });
    });

    it('handleChangeFilters updates status and resets to page 1', () => {
        const { result, setFilters } = setup();

        result.current.handleChangeFilters('VALID');

        expect(runUpdater(setFilters, { page: 3 })).toEqual({ page: 1, status: 'VALID' });
    });

    it('handlePageChange updates the page', () => {
        const { result, setFilters } = setup();

        result.current.handlePageChange(4, 10);

        expect(runUpdater(setFilters, { page: 1 })).toEqual({ page: 4 });
    });

    it('handleDateChange sets from/to when dates are provided', () => {
        const { result, setFilters } = setup();

        result.current.handleDateChange([{} as any, {} as any], ['2026-01-01', '2026-01-31']);

        expect(runUpdater(setFilters, { page: 2 })).toEqual({
            page: 1,
            from: '2026-01-01',
            to: '2026-01-31',
        });
    });

    it('handleDateChange resets to the initial range when cleared', () => {
        const { result, setFilters } = setup();

        result.current.handleDateChange(null, null as any);

        expect(runUpdater(setFilters, { page: 2 })).toEqual({
            page: 1,
            from: '2026-06-01',
            to: '2026-07-01',
        });
    });

    it('handleFromChange resets to the initial start date when cleared', () => {
        const { result, setFilters } = setup();

        result.current.handleFromChange(null as any, null as any);

        expect(runUpdater(setFilters, { page: 2 })).toEqual({ page: 1, from: '2026-06-01' });
    });

    it('handleToChange resets to the initial end date when cleared', () => {
        const { result, setFilters } = setup();

        result.current.handleToChange(null as any, null as any);

        expect(runUpdater(setFilters, { page: 2 })).toEqual({ page: 1, to: '2026-07-01' });
    });
});
