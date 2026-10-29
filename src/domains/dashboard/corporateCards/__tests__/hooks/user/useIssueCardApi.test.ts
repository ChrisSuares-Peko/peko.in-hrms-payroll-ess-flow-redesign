import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { issueCard } from '../../../api/user/cardsApi';
import { useIssueCardApi } from '../../../hooks/user/useIssueCardApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/user/cardsApi', () => ({
    issueCard: vi.fn(),
}));

const mockAuth = { reducer: { auth: { role: 'user', id: 11 } } };

describe('useIssueCardApi (user)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
    });

    it('starts with isLoading=false', () => {
        const { result } = renderHook(() => useIssueCardApi());
        expect(result.current.isLoading).toBe(false);
    });

    it('sets isLoading=true during the call and false after', async () => {
        let resolve!: (v: any) => void;
        (issueCard as Mock).mockImplementation(
            () =>
                new Promise(r => {
                    resolve = r;
                })
        );

        const { result } = renderHook(() => useIssueCardApi());
        act(() => {
            result.current.submitIssueCard({ type: 'Virtual' } as any);
        });
        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            resolve({ data: {} });
        });
        expect(result.current.isLoading).toBe(false);
    });

    it('calls issueCard with role, id and payload', async () => {
        (issueCard as Mock).mockResolvedValue({ data: {} });
        const { result } = renderHook(() => useIssueCardApi());
        const payload = { type: 'Virtual', limit: 20000 } as any;

        await act(async () => {
            await result.current.submitIssueCard(payload);
        });

        expect(issueCard).toHaveBeenCalledWith('user', 11, payload);
    });

    it('returns the API response', async () => {
        const resp = { data: { cardId: 'c1' } };
        (issueCard as Mock).mockResolvedValue(resp);
        const { result } = renderHook(() => useIssueCardApi());

        let returned: any;
        await act(async () => {
            returned = await result.current.submitIssueCard({ type: 'Virtual' } as any);
        });

        expect(returned).toEqual(resp);
    });

    it('returns false when the API fails', async () => {
        (issueCard as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useIssueCardApi());

        let returned: any;
        await act(async () => {
            returned = await result.current.submitIssueCard({ type: 'Virtual' } as any);
        });

        expect(returned).toBeFalsy();
        expect(result.current.isLoading).toBe(false);
    });
});
