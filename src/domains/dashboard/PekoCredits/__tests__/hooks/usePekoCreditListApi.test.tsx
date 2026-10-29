import { renderHook } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';

import { usePekoCreditListApi } from '../../hooks/usePekoCreditListApi';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));
vi.mock('../../api', () => ({
    getPekoCredits: vi.fn(),
}));

describe('usePekoCreditListApi Hook', () => {
    const mockUseAppSelector = useAppSelector as any;
    const mockDispatch = vi.fn(); // Mock dispatch function

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppSelector.mockReturnValue({ role: 'corporate', id: 'user123' });
        (useAppDispatch as any).mockReturnValue(mockDispatch);
    });

    it('should start with a loading state', async () => {
        const page = 1;
        const length = 10;
        const { result } = renderHook(() => usePekoCreditListApi(page, length));
        expect(result.current.isLoading).toBe(true);
    });
});
