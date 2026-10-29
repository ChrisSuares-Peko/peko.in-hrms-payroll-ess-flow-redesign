import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { addDoc } from '../../api';
import useAddDocApi from '../../hooks/useAddDocApi';


vi.mock('../../api', () => ({
  addDoc: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
  useAppSelector: (selector: any) =>
    selector({
      reducer: {
        auth: { role: 'admin', id: '123' },
      },
    }),
  useAppDispatch: () => vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('useAddDocApi Hook', () => {
  const mockPayload = {
    doc_identity_no: 'ABC123',
    type: 'dl',
    dob: '2000-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true and set details when API returns success', async () => {
    (addDoc as any).mockResolvedValue({ data: 'mockResponse' });

    const { result } = renderHook(() => useAddDocApi());

    let response: any;
    await act(async () => {
      response = await result.current.addDocApi(mockPayload);
    });

    expect(addDoc).toHaveBeenCalledWith({
      userId: '123',
      userType: 'admin',
      doc_identity_no: 'ABC123',
      type: 'dl',
      dob: '2000-01-01',
    });

    expect(response).toEqual({ data: 'mockResponse' });
    expect(result.current.details).toEqual({ data: 'mockResponse' });
    expect(result.current.loading).toBe(false);
  });

  it('should return false when API returns null/undefined', async () => {
    (addDoc as any).mockResolvedValue(null);

    const { result } = renderHook(() => useAddDocApi());

    let response: any;
    await act(async () => {
      response = await result.current.addDocApi(mockPayload);
    });

    expect(response).toBe(false);
    expect(result.current.details).toBe(undefined);
    expect(result.current.loading).toBe(false);
  });
});
