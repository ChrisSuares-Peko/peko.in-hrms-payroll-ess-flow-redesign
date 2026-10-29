import { renderHook, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { vi, describe, beforeEach, it, expect, Mock } from 'vitest';

import { createBusinessProfile } from '../../api/index';
import { useCreateBusinessProfileApi } from '../../hooks/useCreateBusinessProfile';

vi.mock('../../api/index', () => ({
    createBusinessProfile: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ role: 'user', id: '123' })),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

describe('useCreateBusinessProfileApi Hook', () => {
    const mockNavigate = vi.fn();
    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as Mock).mockReturnValue(mockNavigate);
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useCreateBusinessProfileApi());

        expect(result.current.isLoading).toBe(false);
    });

    it('should call createBusinessProfile API with correct parameters', async () => {
        (createBusinessProfile as Mock).mockResolvedValue({
            data: { projectId: '456' },
        });

        const { result } = renderHook(() => useCreateBusinessProfileApi());
        const setIsPurchased = vi.fn();

        await act(async () => {
            await result.current.BusinessProfile(setIsPurchased);
        });

        expect(createBusinessProfile).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
        });
        expect(setIsPurchased).toHaveBeenCalledWith(true);
        expect(result.current.isLoading).toBe(false);
    });

    it('should set isPurchased to false if projectId is missing', async () => {
        (createBusinessProfile as Mock).mockResolvedValue({
            data: {},
        });

        const { result } = renderHook(() => useCreateBusinessProfileApi());
        const setIsPurchased = vi.fn();

        await act(async () => {
            await result.current.BusinessProfile(setIsPurchased);
        });

        expect(setIsPurchased).toHaveBeenCalledWith(false);
        expect(result.current.isLoading).toBe(false);
    });

    it('should navigate to serviceNotAvailable if API call fails', async () => {
        (createBusinessProfile as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useCreateBusinessProfileApi());
        const setIsPurchased = vi.fn();

        await act(async () => {
            await result.current.BusinessProfile(setIsPurchased);
        });

        expect(mockNavigate).toHaveBeenCalledWith('/service-not-available');
        expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading correctly during API call', async () => {
        (createBusinessProfile as Mock).mockResolvedValue({
            data: { projectId: '456' },
        });

        const { result } = renderHook(() => useCreateBusinessProfileApi());
        const setIsPurchased = vi.fn();

        act(() => {
            result.current.BusinessProfile(setIsPurchased);
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            await result.current.BusinessProfile(setIsPurchased);
        });

        expect(result.current.isLoading).toBe(false);
    });
});
