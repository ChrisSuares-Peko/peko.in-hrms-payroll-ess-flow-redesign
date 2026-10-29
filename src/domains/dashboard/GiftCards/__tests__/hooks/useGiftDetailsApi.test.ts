import { renderHook, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getGiftDetails } from '../../api/index';
import GetGiftDetails from '../../hooks/useGiftDetailsApi';

// Mock dependencies
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

vi.mock('../../api/index', () => ({
    getGiftDetails: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));

describe('GetGiftDetails Hook', () => {
    let mockDispatch: Mock;
    let mockNavigate: Mock;
    const mockGiftCardID = 'giftcard-123';

    beforeEach(() => {
        vi.clearAllMocks();

        mockDispatch = vi.fn();
        mockNavigate = vi.fn();

        (useNavigate as Mock).mockReturnValue(mockNavigate);
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        (useAppSelector as Mock).mockImplementation(selectorFn => {
            if (selectorFn.name.includes('auth')) {
                return { id: 'user-123', role: 'admin' };
            }
            return {};
        });
    });

    it('should start with loading state as true', async () => {
        (getGiftDetails as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => GetGiftDetails(mockGiftCardID));

        expect(result.current.isLoading).toBe(true);
    });

    it('should fetch and set gift card details successfully', async () => {
        const mockGiftCardData = {
            id: mockGiftCardID,
            product_name: 'Amazon Gift Card',
            brand_logo: 'https://example.com/logo.png',
        };

        (getGiftDetails as Mock).mockResolvedValue(mockGiftCardData);

        const { result } = renderHook(() => GetGiftDetails(mockGiftCardID));

        await act(async () => {});

        expect(result.current.data).toEqual(mockGiftCardData);
        expect(result.current.isLoading).toBe(false);
    });

    it('should navigate and show error toast if gift card is not found', async () => {
        (getGiftDetails as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => GetGiftDetails(mockGiftCardID));

        await act(async () => {});

        expect(mockNavigate).toHaveBeenCalledWith('/gift-cards');
        expect(mockDispatch).toHaveBeenCalledWith(
            showToast({
                description: 'Product not found',
                variant: 'error',
            })
        );
        expect(result.current.isLoading).toBe(false);
    });
});
