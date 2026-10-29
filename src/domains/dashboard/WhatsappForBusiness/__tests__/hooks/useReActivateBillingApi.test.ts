import { renderHook, act } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { reactivateBillingProject } from '../../api/index';
import { useReActivateBillingApi } from '../../hooks/useReActivateBilling';

vi.mock('../../api/index', () => ({
    reactivateBillingProject: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('useReActivateBillingApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: 'user123' });
    });

    it('should initialize with isLoading as false', () => {
        const { result } = renderHook(() => useReActivateBillingApi());

        expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading to true while API call is in progress', async () => {
        (reactivateBillingProject as Mock).mockResolvedValue(true);
        const { result } = renderHook(() => useReActivateBillingApi());

        act(() => {
            result.current.reactivateBilling(123);
        });

        expect(result.current.isLoading).toBe(true);
    });

    it('should return true and set isLoading to false when API call succeeds', async () => {
        (reactivateBillingProject as Mock).mockResolvedValue(true);
        const { result } = renderHook(() => useReActivateBillingApi());

        await act(async () => {
            const success = await result.current.reactivateBilling(123);
            expect(success).toBe(true);
        });

        expect(result.current.isLoading).toBe(false);
    });

    it('should return false and set isLoading to false when API call fails', async () => {
        (reactivateBillingProject as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useReActivateBillingApi());

        await act(async () => {
            const success = await result.current.reactivateBilling(34);
            expect(success).toBe(false);
        });

        expect(result.current.isLoading).toBe(false);
    });
});
