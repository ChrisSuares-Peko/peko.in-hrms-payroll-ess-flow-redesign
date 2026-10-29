import { renderHook, act } from '@testing-library/react';
import { describe, it, vi, beforeEach, expect } from 'vitest';

import * as storeHooks from '@src/hooks/store';

import * as api from '../../api';
import useDeleteFleet from '../../hooks/deleteFleet';

const deleteFleetMock = vi.spyOn(api, 'deleteFleet');

describe('useDeleteFleet hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
   
    vi.spyOn(storeHooks, 'useAppSelector').mockReturnValue({
      role: 'admin',
      id: '123',
    });
  });

  it('should return deleteApi function and loading state', () => {
    const { result } = renderHook(() => useDeleteFleet());
    expect(result.current).toHaveProperty('deleteApi');
    expect(result.current).toHaveProperty('loading', false);
  });

  it('should call deleteFleet and return true when API succeeds', async () => {
    deleteFleetMock.mockResolvedValueOnce({
  data: {},
  message: 'Deleted successfully',
  status: 'success',
} as any);


    const { result } = renderHook(() => useDeleteFleet());

    const payload = { id: 'fleet-1' };
    let response: any;
    await act(async () => {
      response = await result.current.deleteApi(payload);
    });

    expect(deleteFleetMock).toHaveBeenCalledWith({
      userId: '123',
      userType: 'admin',
      id: 'fleet-1',
    });
    expect(response).toBe(true);
  });

  it('should return false when API returns falsy data', async () => {
   

    const { result } = renderHook(() => useDeleteFleet());

    let response: any;
    await act(async () => {
      response = await result.current.deleteApi({ id: 'fleet-2' });
    });

    expect(response).toBe(false);
  });

  it('should return null when API call throws an error', async () => {
    deleteFleetMock.mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useDeleteFleet());

    let response: any;
    await act(async () => {
      response = await result.current.deleteApi({ id: 'fleet-3' });
    });

    expect(response).toBeNull();
  });
});
