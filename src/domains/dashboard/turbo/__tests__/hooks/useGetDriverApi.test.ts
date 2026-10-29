import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getDriver } from '../../api';
import useGetDriverApi from '../../hooks/useGetDriverApi';


vi.mock('@src/hooks/store', () => ({
  useAppSelector: (selector: any) =>
    selector({
      reducer: {
        auth: { id: '123', role: 'admin' },
      },
    }),
  useAppDispatch: () => vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../api', () => ({
  getDriver: vi.fn(),
}));


describe('useGetDriverApi Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const payload = { id: 45 };

  it('should fetch driver details on mount', async () => {
    (getDriver as any).mockResolvedValue({
      id: 45,
      name: 'John Doe',
    });

    const { result } = renderHook(() => useGetDriverApi(payload));

    // Wait for useEffect async resolution
    await act(async () => {});

    expect(getDriver).toHaveBeenCalledWith({
      userId: '123',
      userType: 'admin',
      id: 45,
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.details).toEqual({ id: 45, name: 'John Doe' });
  });

  it('should handle API returning false', async () => {
    (getDriver as any).mockResolvedValue(false);

    const { result } = renderHook(() => useGetDriverApi(payload));

    await act(async () => {});

    expect(result.current.details).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });

  it('should re-fetch data when setRefresh(true) is called', async () => {
    (getDriver as any).mockResolvedValue({ id: 45, name: 'John Doe' });

    const { result } = renderHook(() => useGetDriverApi(payload));

    await act(async () => {});

    expect(result.current.details).toEqual({ id: 45, name: 'John Doe' });

    // Change mocked result for second run
    (getDriver as any).mockResolvedValue({ id: 45, name: 'Jane Doe' });

    await act(async () => {
      result.current.setRefresh(true);
    });

    await act(async () => {});

    expect(result.current.details).toEqual({ id: 45, name: 'Jane Doe' });
  });
});
