import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { getDashboardData, getRefreshData } from '../../api/index';
import useDashboard from '../../hooks/useDashboard';

vi.mock('../../api/index', () => ({
  getDashboardData: vi.fn(),
  getRefreshData: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
  useAppSelector: (selector: any) =>
    selector({
      reducer: {
        auth: {
          id: 'USER123',
          role: 'admin',
        },
      },
    }),
  useAppDispatch: () => vi.fn(),
}));

describe('useDashboard Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch dashboard data when isRefresh=true', async () => {
    const mockDashboardResponse = { totalOrders: 10 };
    (getDashboardData as any).mockResolvedValue(mockDashboardResponse);

    const { result } = renderHook(() => useDashboard(true));

    await act(async () => {});

    expect(getDashboardData).toHaveBeenCalledWith({
      userId: 'USER123',
      userType: 'admin',
    });

    expect(result.current.data).toEqual(mockDashboardResponse);
    expect(result.current.isLoading).toBe(false);
  });

  it('should not fetch dashboard data when isRefresh=false', async () => {
    const { result } = renderHook(() => useDashboard(false));

    await act(async () => {});

    expect(getDashboardData).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(true);
  });

  it('refreshData should call getRefreshData and update state', async () => {
    const mockRefreshResponse = { refresh: true, updatedCount: 5 };
    const mockDashboardResponse = { totalOrders: 20 };

    (getRefreshData as any).mockResolvedValue(mockRefreshResponse);
    (getDashboardData as any).mockResolvedValue(mockDashboardResponse);

    const { result } = renderHook(() => useDashboard(true));

    await act(async () => {});

    let returnedValue;
    await act(async () => {
      returnedValue = await result.current.refreshData();
    });

    expect(getRefreshData).toHaveBeenCalledWith({
      userId: 'USER123',
      userType: 'admin',
    });

    expect(getDashboardData).toHaveBeenCalled();  

    expect(returnedValue).toEqual(mockRefreshResponse);
    expect(result.current.data).toEqual(mockDashboardResponse);
    expect(result.current.isRefreshLoading).toBe(false);
  });
});
