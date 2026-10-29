import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi,beforeEach } from 'vitest';

import useFilter from '../../hooks/useFilter';

describe('useFilter Hook', () => {
  const setFilterMock = vi.fn();

  const initialProps = {
    setFilter: setFilterMock,
    initalStartDate: '2024-01-01',
    initalEndDate: '2024-01-31',
  };

  beforeEach(() => {
    setFilterMock.mockClear();
  });

  it('should update search text and reset page on handleSearch', () => {
    const { result } = renderHook(() => useFilter(initialProps));

    act(() => {
      result.current.handleSearch({ target: { value: 'car' } });
    });

    expect(setFilterMock).toHaveBeenCalled();
    expect(setFilterMock.mock.calls[0][0]).toBeInstanceOf(Function);
  });

  it('should update pagination on handlePageChange', () => {
    const { result } = renderHook(() => useFilter(initialProps));

    act(() => {
      result.current.handlePageChange(3, 20);
    });

    expect(setFilterMock).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should reset date range when handleDateChange receives null', () => {
    const { result } = renderHook(() => useFilter(initialProps));

    act(() => {
  result.current.handleDateChange(null as any, ['', '']);
});

    expect(setFilterMock).toHaveBeenCalledWith(expect.any(Function));
    const updateFn = setFilterMock.mock.calls[0][0];
    const updated = updateFn({ from: '', to: '', page: 5 });
    expect(updated).toEqual({
      from: '2024-01-01',
      to: '2024-01-31',
      page: 1,
    });
  });

  it('should set new range values when handleDateChange receives dates', () => {
    const { result } = renderHook(() => useFilter(initialProps));

    act(() => {
      result.current.handleDateChange(['date1' as any, 'date2' as any], ['2024-02-01', '2024-02-10']);
    });

    const updateFn = setFilterMock.mock.calls[0][0];
    const updated = updateFn({ from: '', to: '', page: 5 });
    expect(updated).toEqual({
      from: '2024-02-01',
      to: '2024-02-10',
      page: 1,
    });
  });

  it('should reset from when handleFromChange receives null', () => {
    const { result } = renderHook(() => useFilter(initialProps));

    act(() => {
      result.current.handleFromChange(null as any, '');
    });

    const updateFn = setFilterMock.mock.calls[0][0];
    const updated = updateFn({ from: '', page: 3 });
    expect(updated).toEqual({
      from: '2024-01-01',
      page: 1,
    });
  });

  it('should update from when handleFromChange receives date', () => {
    const { result } = renderHook(() => useFilter(initialProps));

    act(() => {
      result.current.handleFromChange('date' as any, '2024-02-05');
    });

    const updateFn = setFilterMock.mock.calls[0][0];
    const updated = updateFn({ from: '', page: 2 });
    expect(updated).toEqual({
      from: '2024-02-05',
      page: 1,
    });
  });

  it('should reset to when handleToChange receives null', () => {
    const { result } = renderHook(() => useFilter(initialProps));

    act(() => {
      result.current.handleToChange(null as any, '');
    });

    const updateFn = setFilterMock.mock.calls[0][0];
    const updated = updateFn({ to: '', page: 2 });
    expect(updated).toEqual({
      to: '2024-01-31',
      page: 1,
    });
  });

  it('should update to when handleToChange receives date', () => {
    const { result } = renderHook(() => useFilter(initialProps));

    act(() => {
      result.current.handleToChange('date' as any, '2024-02-20');
    });

    const updateFn = setFilterMock.mock.calls[0][0];
    const updated = updateFn({ to: '', page: 3 });
    expect(updated).toEqual({
      to: '2024-02-20',
      page: 1,
    });
  });
});
