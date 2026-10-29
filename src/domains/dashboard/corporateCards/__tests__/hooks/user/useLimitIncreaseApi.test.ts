import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { requestLimitIncrease } from '../../../api/user/cardsApi';
import { useLimitIncreaseApi } from '../../../hooks/user/useLimitIncreaseApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/user/cardsApi', () => ({
    requestLimitIncrease: vi.fn(),
}));

const mockAuth = { reducer: { auth: { role: 'user', id: 15 } } };

describe('useLimitIncreaseApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
    });

    it('starts with isLoading=false', () => {
        const { result } = renderHook(() => useLimitIncreaseApi());
        expect(result.current.isLoading).toBe(false);
    });

    it('sets isLoading=true during the call and false after', async () => {
        let resolve!: (v: any) => void;
        (requestLimitIncrease as Mock).mockImplementation(
            () =>
                new Promise(r => {
                    resolve = r;
                })
        );

        const { result } = renderHook(() => useLimitIncreaseApi());
        act(() => {
            result.current.submitLimitIncrease({ cardId: 'c1', requestedLimit: 50000 } as any);
        });
        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            resolve({ data: {} });
        });
        expect(result.current.isLoading).toBe(false);
    });

    it('calls requestLimitIncrease with role, id and payload', async () => {
        (requestLimitIncrease as Mock).mockResolvedValue({ data: {} });
        const { result } = renderHook(() => useLimitIncreaseApi());
        const payload = {
            cardId: 'c99',
            requestedLimit: 100000,
            reason: 'Project expansion',
        } as any;

        await act(async () => {
            await result.current.submitLimitIncrease(payload);
        });

        expect(requestLimitIncrease).toHaveBeenCalledWith('user', 15, payload);
    });

    it('returns the API response on success', async () => {
        const resp = { data: { requestId: 42 } };
        (requestLimitIncrease as Mock).mockResolvedValue(resp);
        const { result } = renderHook(() => useLimitIncreaseApi());

        let returned: any;
        await act(async () => {
            returned = await result.current.submitLimitIncrease({ cardId: 'c1' } as any);
        });

        expect(returned).toEqual(resp);
    });

    it('returns falsy and sets isLoading=false when API fails', async () => {
        (requestLimitIncrease as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useLimitIncreaseApi());

        let returned: any;
        await act(async () => {
            returned = await result.current.submitLimitIncrease({ cardId: 'c1' } as any);
        });

        expect(returned).toBeFalsy();
        expect(result.current.isLoading).toBe(false);
    });
});
