import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getFleet } from '../../api';
import useGetFleetApi from '../../hooks/useGetFleetApi';
import { setverifyResponse } from '../../slices/turboSlice';

vi.mock('../../api', () => ({
  getFleet: vi.fn(),
}));

vi.mock('../../slices/turboSlice', () => ({
  setverifyResponse: vi.fn((payload) => ({ type: 'verify/SET', payload })),
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

describe('useGetFleetApi Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const payload = { id: 45 };

  it('should fetch fleet details on mount and dispatch data', async () => {
    (getFleet as any).mockResolvedValue({
      data: { fleetName: 'Test Fleet' },
    });

    const { result } = renderHook(() => useGetFleetApi(payload));

    await act(async () => {});

    expect(getFleet).toHaveBeenCalledWith({
      userId: '123',
      userType: 'admin',
      id: 45,
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      setverifyResponse({ fleetName: 'Test Fleet' })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.details).toEqual({
      data: { fleetName: 'Test Fleet' },
    });
  });

  it('should refresh when setRefresh is triggered', async () => {
    (getFleet as any).mockResolvedValue({ data: { fleetName: 'Test2' } });

    const { result } = renderHook(() => useGetFleetApi(payload));

    await act(async () => {});

    act(() => {
      result.current.setRefresh(true);
    });

    await act(async () => {});

    expect(result.current.details.data.fleetName).toBe('Test2');
  });
});
