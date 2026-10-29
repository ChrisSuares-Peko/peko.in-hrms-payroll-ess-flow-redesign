import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getPrepaidPlans } from '../../api/index';
import usePrepaidPlans from '../../hooks/usePrepaidPlans';

vi.mock('@src/hooks/store', () => ({
  useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', async () => {
  const actual = await vi.importActual<any>('@src/slices/apiSlice');
  return {
    ...actual,
    showToast: vi.fn((args) => ({ type: 'SHOW_TOAST', payload: args })),
  };
});

vi.mock('../../api/index', () => ({
  getPrepaidPlans: vi.fn(),
}));

describe('usePrepaidPlans Hook', () => {
  const mockDispatch = vi.fn();
  const setPlanModalOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppDispatch as any).mockReturnValue(mockDispatch);
  });

  it('should show toast and NOT call API if provider & location are empty', async () => {
    const { result } = renderHook(() => usePrepaidPlans(setPlanModalOpen));

    await act(async () => {
      await result.current.getPlans({
          serviceProvider: '', location: '',
          userId: 0,
          userType: ''
      });
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      showToast({
        description: 'Please choose the provider and circle',
        variant: 'error',
      })
    );
    expect(getPrepaidPlans).not.toHaveBeenCalled();
    expect(setPlanModalOpen).not.toHaveBeenCalled();
  });

  it('should call API and update state when API returns data', async () => {
    const mockData = {
      plans: [{ id: 1, name: 'Plan 1' }],
      planCategory: ['Category 1'],
    };

    (getPrepaidPlans as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => usePrepaidPlans(setPlanModalOpen));

    await act(async () => {
      await result.current.getPlans({
          serviceProvider: 'Jio', location: 'Delhi',
          userId: 0,
          userType: ''
      });
    });

    expect(setPlanModalOpen).toHaveBeenCalledWith(true);
    expect(result.current.plansData).toEqual(mockData.plans);
    expect(result.current.planCategories).toEqual(mockData.planCategory);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle API returning false', async () => {
    (getPrepaidPlans as any).mockResolvedValue(false);

    const { result } = renderHook(() => usePrepaidPlans(setPlanModalOpen));

    await act(async () => {
      await result.current.getPlans({
          serviceProvider: 'Jio', location: 'Delhi',
          userId: 0,
          userType: ''
      });
    });

    expect(setPlanModalOpen).toHaveBeenCalledWith(true);
    expect(result.current.plansData).toEqual([]);
    expect(result.current.planCategories).toEqual([]);
  });
});
