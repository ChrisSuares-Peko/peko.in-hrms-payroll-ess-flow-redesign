import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { assign } from '../../api';
import useAssignDriverApi from '../../hooks/useAssignDriverApi';

vi.mock('../../api', () => ({
  assign: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
  useAppSelector: (selector: any) =>
    selector({
      reducer: {
        auth: { role: 'admin', id: '123' },
      },
    }),
}));

describe('useAssignDriverApi Hook', () => {
  const mockPayload = {
    vehicleId: 'V001',
    driverId: 'D001',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call assign() and return data on success', async () => {
    (assign as any).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAssignDriverApi());

    let response: any;
    await act(async () => {
      response = await result.current.assignApi(mockPayload);
    });

    expect(assign).toHaveBeenCalledWith({
      userId: '123',
      userType: 'admin',
      vehicleId: 'V001',
      driverId: 'D001',
    });

    expect(response).toEqual({ success: true });
  });

  it('should return null when API throws error', async () => {
    (assign as any).mockRejectedValue(new Error('API Failed'));

    const { result } = renderHook(() => useAssignDriverApi());

    let response: any;
    await act(async () => {
      response = await result.current.assignApi(mockPayload);
    });

    expect(response).toBeNull();
  });
});
