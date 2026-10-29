import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { deleteDriver } from '../../api';
import useDeleteDriverApi from '../../hooks/useDeleteDriverApi';

vi.mock('../../api', () => ({
  deleteDriver: vi.fn(),
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

describe('useDeleteDriverApi Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when deleteDriver returns data', async () => {
    (deleteDriver as any).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDeleteDriverApi());

    let response;
    await act(async () => {
      response = await result.current.deleteApi({ id: 'DRIVER100' });
    });

    expect(deleteDriver).toHaveBeenCalledWith({
      userId: 'USER123',
      userType: 'admin',
      id: 'DRIVER100',
    });

    expect(response).toBe(true);
  });

  it('should return false when deleteDriver returns null/false', async () => {
    (deleteDriver as any).mockResolvedValue(null);

    const { result } = renderHook(() => useDeleteDriverApi());

    let response;
    await act(async () => {
      response = await result.current.deleteApi({ id: 'DRIVER100' });
    });

    expect(response).toBe(false);
  });

  it('should return null when API throws error', async () => {
    (deleteDriver as any).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useDeleteDriverApi());

    let response;
    await act(async () => {
      response = await result.current.deleteApi({ id: 'DRIVER100' });
    });

    expect(response).toBe(null);
  });
});
