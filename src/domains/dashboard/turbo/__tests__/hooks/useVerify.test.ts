import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { verify } from '../../api';
import useVerify from '../../hooks/useVerifyApi';
import {
 
  setverifyResponse,
  setRcVerifyResponse,
  resetResponse,
  resetRcResponse,
} from '../../slices/turboSlice';

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

vi.mock('../../api', () => ({
  verify: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
  showToast: vi.fn((payload) => ({ type: 'showToast', payload })),
}));

vi.mock('../../slices/turboSlice', () => ({
  setverifyResponse: vi.fn((payload) => ({ type: 'setverifyResponse', payload })),
  setRcVerifyResponse: vi.fn((payload) => ({ type: 'setRcVerifyResponse', payload })),
  resetResponse: vi.fn(() => ({ type: 'resetResponse' })),
  resetRcResponse: vi.fn(() => ({ type: 'resetRcResponse' })),
}));


describe('useVerify Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle successful DL verification', async () => {
    (verify as any).mockResolvedValue({
      data: { dlNumber: 'DL12345' },
    });

    const { result } = renderHook(() => useVerify());

    await act(async () => {
      await result.current.verifyApi({ type: 'dl', doc_identity_no: 'DL12345' });
    });

    expect(mockDispatch).toHaveBeenCalledWith(setverifyResponse({ dlNumber: 'DL12345' }));
    expect(result.current.loading).toBe(false);
  });

  it('should show toast if DL verification fails (dlNumber null)', async () => {
    (verify as any).mockResolvedValue({
      data: { dlNumber: null },
    });

    const { result } = renderHook(() => useVerify());

    await act(async () => {
      await result.current.verifyApi({ type: 'dl', doc_identity_no: 'DL12345' });
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      showToast(expect.objectContaining({ variant: 'error' }))
    );
  });

  it('should handle successful RC verification', async () => {
    (verify as any).mockResolvedValue({
      data: { vehicleNumber: 'KA05AB1234' },
    });

    const { result } = renderHook(() => useVerify());

    await act(async () => {
      await result.current.verifyApi({ type: 'rc', doc_identity_no: 'KA05AB1234' });
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      setRcVerifyResponse({ vehicleNumber: 'KA05AB1234' })
    );
  });

  it('should show toast if RC verification fails (vehicleNumber null)', async () => {
    (verify as any).mockResolvedValue({
      data: { vehicleNumber: null },
    });

    const { result } = renderHook(() => useVerify());

    await act(async () => {
      await result.current.verifyApi({ type: 'rc', doc_identity_no: 'XX9999' });
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      showToast(expect.objectContaining({ variant: 'error' }))
    );
  });

  it('should dispatch resetResponse if API returns false for DL', async () => {
    (verify as any).mockResolvedValue(false);

    const { result } = renderHook(() => useVerify());

    await act(async () => {
      await result.current.verifyApi({ type: 'dl', doc_identity_no: 'DL12345' });
    });

    expect(mockDispatch).toHaveBeenCalledWith(resetResponse());
  });

  it('should dispatch resetRcResponse if API returns false for RC', async () => {
    (verify as any).mockResolvedValue(false);

    const { result } = renderHook(() => useVerify());

    await act(async () => {
      await result.current.verifyApi({ type: 'rc', doc_identity_no: 'XX9999' });
    });

    expect(mockDispatch).toHaveBeenCalledWith(resetRcResponse());
  });
});
