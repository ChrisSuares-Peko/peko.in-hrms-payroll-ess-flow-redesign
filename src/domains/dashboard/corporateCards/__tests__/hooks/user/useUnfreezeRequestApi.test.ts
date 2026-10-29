import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { requestUnfreeze } from '../../../api/user/cardsApi';
import { useUnfreezeRequestApi } from '../../../hooks/user/useUnfreezeRequestApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/user/cardsApi', () => ({
    requestUnfreeze: vi.fn(),
}));

const mockAuth = { reducer: { auth: { role: 'user', id: 15 } } };

describe('useUnfreezeRequestApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
    });

    it('starts with isLoading=false', () => {
        const { result } = renderHook(() => useUnfreezeRequestApi());
        expect(result.current.isLoading).toBe(false);
    });

    it('posts the card and reason with the session role and id', async () => {
        (requestUnfreeze as Mock).mockResolvedValue({ data: {} });

        const { result } = renderHook(() => useUnfreezeRequestApi());
        await act(async () => {
            await result.current.submitUnfreezeRequest({
                cardIssuanceId: '7',
                reason: 'I need it',
            });
        });

        expect(requestUnfreeze).toHaveBeenCalledWith('user', 15, {
            cardIssuanceId: '7',
            reason: 'I need it',
        });
    });

    it('sets isLoading=true during the call and false after', async () => {
        let resolve!: (v: any) => void;
        (requestUnfreeze as Mock).mockImplementation(
            () =>
                new Promise(r => {
                    resolve = r;
                })
        );

        const { result } = renderHook(() => useUnfreezeRequestApi());
        act(() => {
            result.current.submitUnfreezeRequest({ cardIssuanceId: '7' });
        });
        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            resolve({ data: {} });
        });
        expect(result.current.isLoading).toBe(false);
    });

    // The api fn swallows errors and returns false; the caller must be able to tell success from failure.
    it('passes a falsy result straight through and still clears isLoading', async () => {
        (requestUnfreeze as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useUnfreezeRequestApi());
        let res: unknown;
        await act(async () => {
            res = await result.current.submitUnfreezeRequest({ cardIssuanceId: '7' });
        });

        expect(res).toBe(false);
        expect(result.current.isLoading).toBe(false);
    });
});
