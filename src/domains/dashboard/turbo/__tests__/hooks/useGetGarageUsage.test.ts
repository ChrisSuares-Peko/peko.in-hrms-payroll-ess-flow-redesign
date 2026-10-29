import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getUsage } from '../../api';
import useGetGarageUsageApi from '../../hooks/useGetGarageUsage';

vi.mock('../../api', () => ({
  getUsage: vi.fn(),
}));

const mockDispatch = vi.fn();
vi.mock('@src/hooks/store', () => ({
  useAppSelector: (selector: any) =>
    selector({
      reducer: {
        auth: { id: '123', role: 'admin' },
      },
    }),
  useAppDispatch: () => mockDispatch,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('useGetGarageUsageApi Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch usage data on mount and update state', async () => {
    (getUsage as any).mockResolvedValue({
      data: { used: 50, total: 100 },
    });

    const { result } = renderHook(() => useGetGarageUsageApi());

    await act(async () => {});

    expect(getUsage).toHaveBeenCalledWith({
      userId: '123',
      userType: 'admin',
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.details).toEqual({
      data: { used: 50, total: 100 },
    });
  });

  it('should re-fetch when refresh is triggered', async () => {
    (getUsage as any).mockResolvedValueOnce({
      data: { used: 20, total: 100 },
    });

    const { result } = renderHook(() => useGetGarageUsageApi());
    await act(async () => {});

    expect(result.current.details.data.used).toBe(20);

    (getUsage as any).mockResolvedValueOnce({
      data: { used: 50, total: 100 },
    });

    act(() => {
      result.current.setRefresh(true);
    });

    await act(async () => {});

    expect(result.current.details.data.used).toBe(50);
  });
});
