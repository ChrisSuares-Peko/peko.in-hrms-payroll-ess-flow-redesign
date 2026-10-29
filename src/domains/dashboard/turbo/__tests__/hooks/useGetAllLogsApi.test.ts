import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getAllLogs } from '../../api/index';
import useGetAllLogsApi from '../../hooks/useGetAllLogsApi';


vi.mock('@src/hooks/store', () => ({
  useAppSelector: (selector: any) =>
    selector({
      reducer: {
        auth: {
          role: 'admin',
          id: '123',
        },
      },
    }),
}));

vi.mock('../../api/index', () => ({
  getAllLogs: vi.fn(),
}));


describe('useGetAllLogsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    searchText: '',
    category: '',
    sort: '',
    page: 1,
    itemsPerPage: 10,
    filter: '',
    from: '',
    to: '',
    sortField: '',
  };

  it('should fetch logs and update state', async () => {
    (getAllLogs as any).mockResolvedValue({
      data: [
        { message: 'Log 1' },
        { message: 'Log 2' },
      ],
      recordsTotal: 2,
    });

    const { result } = renderHook(() => useGetAllLogsApi(defaultProps));

    await act(async () => {});

    expect(getAllLogs).toHaveBeenCalledWith({
      userId: '123',
      userType: 'admin',
      from: '',
      to: '',
      searchText: '',
      page: 1,
      itemsPerPage: 10,
    });

    expect(result.current.logs).toEqual([
      { message: 'Log 1' },
      { message: 'Log 2' },
    ]);
    expect(result.current.count).toBe(2);
    expect(result.current.isLoading).toBe(false);
  });

  it('should set isLoading to true while fetching', async () => {
    (getAllLogs as any).mockImplementation(() => new Promise(resolve =>
        setTimeout(() => resolve({ data: [], recordsTotal: 0 }), 100)
      ));

    const { result } = renderHook(() => useGetAllLogsApi(defaultProps));

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });
  });

  it('should handle API returning false', async () => {
    (getAllLogs as any).mockResolvedValue(false);

    const { result } = renderHook(() => useGetAllLogsApi(defaultProps));

    await act(async () => {});

    expect(result.current.logs).toEqual([]);
    expect(result.current.count).toBe(1);
  });
});
