import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { postRequest } from '../../api/index';
import usePostRequest from '../../hooks/usePostRequest'; // Adjust path as needed

// Mock API and dispatch function
vi.mock('../../api/index', () => ({
    postRequest: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));

describe('usePostRequest', () => {
    const mockDispatch = vi.fn();
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
    });

    it('should initialize with isLoading as false', () => {
        const { result } = renderHook(() => usePostRequest());
        expect(result.current.isLoading).toBe(false);
    });

    it('should call postRequest and dispatch success toast on success', async () => {
        (postRequest as Mock).mockResolvedValue({ success: true });

        const { result } = renderHook(() => usePostRequest());

        await act(async () => {
            await result.current.handlePostRequest({ receiverId: '123', message: 'Hello' });
        });

        expect(postRequest).toHaveBeenCalledWith({ receiverId: '123', message: 'Hello' });
        expect(mockDispatch).toHaveBeenCalledWith(
            showToast({ variant: 'success', description: 'Connection request has been sent.' })
        );
        expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading to true while posting request', async () => {
        let resolvePost: (value?: unknown) => void = () => {};
        const postRequestPromise = new Promise(res => {
            resolvePost = res;
        });
        (postRequest as Mock).mockImplementation(() => postRequestPromise);

        const { result } = renderHook(() => usePostRequest());

        act(() => {
            result.current.handlePostRequest({ receiverId: '123', message: 'Hello' });
        });

        expect(result.current.isLoading).toBe(true);
        resolvePost();
    });

    it('should handle API errors gracefully', async () => {
        (postRequest as Mock).mockRejectedValue(new Error('API error'));

        const { result } = renderHook(() => usePostRequest());

        await act(async () => {
            await result.current.handlePostRequest({ receiverId: '123', message: 'Hello' });
        });

        expect(postRequest).toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalledWith(
            showToast({
                variant: 'success',
                description: '',
            })
        );
        expect(result.current.isLoading).toBe(false);
    });
});
