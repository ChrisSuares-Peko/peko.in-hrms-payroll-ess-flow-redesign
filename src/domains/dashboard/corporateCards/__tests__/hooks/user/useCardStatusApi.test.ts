import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { updateCardStatus } from '../../../api/user/cardsApi';
import { useCardStatusApi } from '../../../hooks/user/useCardStatusApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/user/cardsApi', () => ({
    updateCardStatus: vi.fn(),
}));

const mockAuth = { reducer: { auth: { role: 'user', id: 7 } } };

describe('useCardStatusApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
    });

    it('starts with isLoading=false', () => {
        const { result } = renderHook(() => useCardStatusApi());
        expect(result.current.isLoading).toBe(false);
    });

    it('sets isLoading=true during the API call and false after', async () => {
        let resolve!: (v: any) => void;
        (updateCardStatus as Mock).mockImplementation(
            () =>
                new Promise(r => {
                    resolve = r;
                })
        );

        const { result } = renderHook(() => useCardStatusApi());
        act(() => {
            result.current.submitCardStatus('card-1', 'BLOCK');
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            resolve({ data: {} });
        });
        expect(result.current.isLoading).toBe(false);
    });

    it('calls updateCardStatus with role, id, cardId, status and reason', async () => {
        (updateCardStatus as Mock).mockResolvedValue({ data: {} });
        const { result } = renderHook(() => useCardStatusApi());

        await act(async () => {
            await result.current.submitCardStatus('card-99', 'BLOCK', 3);
        });

        expect(updateCardStatus).toHaveBeenCalledWith('user', 7, {
            cardId: 'card-99',
            status: 'BLOCK',
            reason: 3,
        });
    });

    it('calls updateCardStatus without reason when it is omitted', async () => {
        (updateCardStatus as Mock).mockResolvedValue({ data: {} });
        const { result } = renderHook(() => useCardStatusApi());

        await act(async () => {
            await result.current.submitCardStatus('card-1', 'UNBLOCK');
        });

        expect(updateCardStatus).toHaveBeenCalledWith('user', 7, {
            cardId: 'card-1',
            status: 'UNBLOCK',
            reason: undefined,
        });
    });

    it('returns the API response', async () => {
        const apiResp = { data: { success: true } };
        (updateCardStatus as Mock).mockResolvedValue(apiResp);
        const { result } = renderHook(() => useCardStatusApi());

        let returned: any;
        await act(async () => {
            returned = await result.current.submitCardStatus('card-1', 'BLOCK');
        });

        expect(returned).toEqual(apiResp);
    });

    it('returns false/null when the API returns falsy', async () => {
        (updateCardStatus as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useCardStatusApi());

        let returned: any;
        await act(async () => {
            returned = await result.current.submitCardStatus('card-1', 'BLOCK');
        });

        expect(returned).toBeFalsy();
        expect(result.current.isLoading).toBe(false);
    });

    it('exposes submitCardStatus as a function', () => {
        const { result } = renderHook(() => useCardStatusApi());
        expect(typeof result.current.submitCardStatus).toBe('function');
    });

    it('can be called multiple times sequentially', async () => {
        (updateCardStatus as Mock).mockResolvedValue({ data: {} });
        const { result } = renderHook(() => useCardStatusApi());

        await act(async () => {
            await result.current.submitCardStatus('c1', 'BLOCK');
        });
        await act(async () => {
            await result.current.submitCardStatus('c2', 'UNBLOCK');
        });

        expect(updateCardStatus).toHaveBeenCalledTimes(2);
        expect(result.current.isLoading).toBe(false);
    });
});
