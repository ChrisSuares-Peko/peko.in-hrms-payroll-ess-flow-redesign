import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { setPendingRequests } from '@src/slices/connectSlice';

import { putRequest } from '../../api/index';
import usePutRequest from '../../hooks/usePutRequest';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
}));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));
vi.mock('@src/slices/connectSlice', () => ({
    setPendingRequests: vi.fn(),
}));
vi.mock('../../api/index', () => ({
    putRequest: vi.fn(),
}));

describe('usePutRequest', () => {
    let mockDispatch: Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        mockDispatch = vi.fn();
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
    });

    it('should initialize with isLoading as false', () => {
        const { result } = renderHook(() => usePutRequest());
        expect(result.current.isLoading).toBe(false);
    });

    it('should call putRequest and update store on success', async () => {
        (putRequest as Mock).mockResolvedValue({ pendingRequests: 3 });

        const { result } = renderHook(() => usePutRequest());

        await act(async () => {
            await result.current.handlePutRequest({ requestId: '123', status: 'ACCEPTED' });
        });

        expect(putRequest).toHaveBeenCalledWith({ requestId: '123', status: 'ACCEPTED' });
        expect(mockDispatch).toHaveBeenCalledWith(setPendingRequests(3));
        expect(mockDispatch).toHaveBeenCalledWith(
            showToast({ variant: 'success', description: 'Request Accepted' })
        );
        expect(result.current.isLoading).toBe(false);
    });

    it('should call putRequest and show rejection toast', async () => {
        (putRequest as Mock).mockResolvedValue({ pendingRequests: 2 });

        const { result } = renderHook(() => usePutRequest());

        await act(async () => {
            await result.current.handlePutRequest({ requestId: '456', status: 'REJECTED' });
        });

        expect(putRequest).toHaveBeenCalledWith({ requestId: '456', status: 'REJECTED' });
        expect(mockDispatch).toHaveBeenCalledWith(setPendingRequests(2));
        expect(mockDispatch).toHaveBeenCalledWith(
            showToast({ variant: 'success', description: 'Request Rejected' })
        );
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
        (putRequest as Mock).mockRejectedValue(new Error('API error'));

        const { result } = renderHook(() => usePutRequest());

        await act(async () => {
            await result.current.handlePutRequest({ requestId: '999', status: 'ACCEPTED' });
        });

        expect(putRequest).toHaveBeenCalledWith({ requestId: '999', status: 'ACCEPTED' });

        // Ensure error does not break execution
        expect(mockDispatch).not.toHaveBeenCalledWith(setPendingRequests(expect.any(Number)));
        expect(mockDispatch).not.toHaveBeenCalledWith(
            showToast({ variant: 'success', description: expect.any(String) })
        );
        expect(result.current.isLoading).toBe(false);
    });
});
