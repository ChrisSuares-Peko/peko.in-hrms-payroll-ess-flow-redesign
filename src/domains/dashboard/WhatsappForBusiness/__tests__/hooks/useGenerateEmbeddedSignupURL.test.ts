import { renderHook, act } from '@testing-library/react';
import { describe, beforeEach, it, expect, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { generateEmbeddedSignupURL } from '../../api/index';
import { useGenerateEmbeddedSignupURL } from '../../hooks/useGenerateEmbeddedSignupURL';

vi.mock('../../api/index', () => ({
    generateEmbeddedSignupURL: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('useGenerateEmbeddedSignupURL Hook', () => {
    const mockResponse = {
        url: 'https://example.com/signup?token=12345',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: 'user123' });
    });

    it('should initialize with isLoading as false', () => {
        const { result } = renderHook(() => useGenerateEmbeddedSignupURL());

        expect(result.current.isLoading).toBe(false);
    });

    it('should call generateEmbeddedSignupURL API and return the response', async () => {
        (generateEmbeddedSignupURL as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useGenerateEmbeddedSignupURL());

        await act(async () => {
            const response = await result.current.generateURL('project123');
            expect(response).toEqual(mockResponse);
        });

        expect(generateEmbeddedSignupURL).toHaveBeenCalledWith({
            userId: 'user123',
            userType: 'admin',
            id: 'project123',
        });
        expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading to true when fetching starts and false when completed', async () => {
        (generateEmbeddedSignupURL as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useGenerateEmbeddedSignupURL());

        act(() => {
            result.current.generateURL('project123');
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            await result.current.generateURL('project123');
        });

        expect(result.current.isLoading).toBe(false);
    });

    it('should return false if the API call fails', async () => {
        (generateEmbeddedSignupURL as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useGenerateEmbeddedSignupURL());

        await act(async () => {
            const response = await result.current.generateURL('project123');
            expect(response).toBe(false);
        });

        expect(result.current.isLoading).toBe(false);
    });
});
