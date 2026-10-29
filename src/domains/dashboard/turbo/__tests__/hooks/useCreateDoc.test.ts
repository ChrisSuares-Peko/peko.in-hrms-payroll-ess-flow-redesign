import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { createDocument } from '../../api/index';
import useCreateDocApi from '../../hooks/useCreateDoc';

vi.mock('../../api/index', () => ({
  createDocument: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
  useAppSelector: (cb: any) =>
    cb({
      reducer: {
        auth: {
          id: '123',
          role: 'admin',
        },
      },
    }),
}));

describe('useCreateDocApi Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call createDocument API and return success response', async () => {
    const mockResponse = { success: true, data: { docId: 'DOC123' } };
    (createDocument as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCreateDocApi());

    let response;
    await act(async () => {
      response = await result.current.createDoc({ name: 'Test Document' });
    });

    expect(createDocument).toHaveBeenCalledWith({
      userId: '123',
      userType: 'admin',
      name: 'Test Document',
    });

    expect(response).toEqual(mockResponse);
    expect(result.current.isLoading).toBe(true);
  });

  it('should return false if API returns false', async () => {
    (createDocument as any).mockResolvedValue(false);

    const { result } = renderHook(() => useCreateDocApi());

    let response;
    await act(async () => {
      response = await result.current.createDoc({ name: 'Test Document' });
    });

    expect(response).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });
});
