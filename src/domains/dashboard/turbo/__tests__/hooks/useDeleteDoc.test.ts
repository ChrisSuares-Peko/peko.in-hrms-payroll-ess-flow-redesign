import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { deleteFleet } from '../../api';
import useDeleteFleet from '../../hooks/useDeleteDoc';

vi.mock('../../api', () => ({
  deleteFleet: vi.fn(),
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
}));

describe('useDeleteFleet Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when deleteFleet returns data', async () => {
    (deleteFleet as any).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDeleteFleet());

    let response;
    await act(async () => {
      response = await result.current.deleteApi({ id: 'FLEET100' });
    });

    expect(deleteFleet).toHaveBeenCalledWith({
      userId: 'USER123',
      userType: 'admin',
      id: 'FLEET100',
    });

    expect(response).toBe(true);
  });

  it('should return false when deleteFleet returns null/false', async () => {
    (deleteFleet as any).mockResolvedValue(null);

    const { result } = renderHook(() => useDeleteFleet());

    let response;
    await act(async () => {
      response = await result.current.deleteApi({ id: 'FLEET100' });
    });

    expect(response).toBe(false);
  });

  it('should return null when API throws error', async () => {
    (deleteFleet as any).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useDeleteFleet());

    let response;
    await act(async () => {
      response = await result.current.deleteApi({ id: 'FLEET100' });
    });

    expect(response).toBe(null);
  });
});
