import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useEscrowAccounts from '../../../hooks/manageBankAccounts/useEscrowAccounts';

describe('useEscrowAccounts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with empty accounts after first tick', async () => {
        const { result } = renderHook(() => useEscrowAccounts());

        await waitFor(() => expect(result.current.isLoading).toBeFalsy());
        expect(result.current.accounts).toEqual([]);
    });

    it('fetchData should keep accounts as empty list (TODO placeholder)', async () => {
        const { result } = renderHook(() => useEscrowAccounts());
        await waitFor(() => expect(result.current.isLoading).toBeFalsy());

        act(() => {
            result.current.fetchData();
        });

        await waitFor(() => expect(result.current.isLoading).toBeFalsy());
        expect(result.current.accounts).toEqual([]);
    });
});
