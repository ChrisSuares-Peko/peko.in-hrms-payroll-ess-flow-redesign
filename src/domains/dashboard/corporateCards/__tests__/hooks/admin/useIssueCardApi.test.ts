import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { issueCardByAdmin } from '../../../api/admin/issueCardApi';
import { useIssueCardApi } from '../../../hooks/admin/useIssueCardApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/admin/issueCardApi', () => ({
    issueCardByAdmin: vi.fn(),
}));

const mockAuth = { reducer: { auth: { role: 'admin', id: 1 } } };

const makePayload = (overrides = {}) => ({
    holderId: 10,
    type: 'Virtual',
    cardLimit: 50000,
    ...overrides,
});

describe('useIssueCardApi (admin)', () => {
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
        (issueCardByAdmin as Mock).mockImplementation(
            () =>
                new Promise(r => {
                    resolve = r;
                })
        );

        const { result } = renderHook(() => useIssueCardApi());
        act(() => {
            result.current.submitIssueCard(makePayload() as any);
        });
        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            resolve({ data: {} });
        });
        expect(result.current.isLoading).toBe(false);
    });

    it('calls issueCardByAdmin with role, id and payload', async () => {
        (issueCardByAdmin as Mock).mockResolvedValue({ data: {} });
        const { result } = renderHook(() => useIssueCardApi());
        const payload = makePayload() as any;

        await act(async () => {
            await result.current.submitIssueCard(payload);
        });

        expect(issueCardByAdmin).toHaveBeenCalledWith('admin', 1, payload);
    });

    it('returns the API response on success', async () => {
        const resp = { data: { cardIssuanceId: 99 } };
        (issueCardByAdmin as Mock).mockResolvedValue(resp);
        const { result } = renderHook(() => useIssueCardApi());

        let returned: any;
        await act(async () => {
            returned = await result.current.submitIssueCard(makePayload() as any);
        });

        expect(returned).toEqual(resp);
    });

    it('returns falsy and sets isLoading=false when API fails', async () => {
        (issueCardByAdmin as Mock).mockResolvedValue(null);
        const { result } = renderHook(() => useIssueCardApi());

        let returned: any;
        await act(async () => {
            returned = await result.current.submitIssueCard(makePayload() as any);
        });

        expect(returned).toBeFalsy();
        expect(result.current.isLoading).toBe(false);
    });
});
