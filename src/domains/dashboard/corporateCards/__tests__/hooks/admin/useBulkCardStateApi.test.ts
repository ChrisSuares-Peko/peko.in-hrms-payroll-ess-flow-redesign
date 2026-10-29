import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { bulkUpdateCardState } from '../../../api/admin/bulkCardStateApi';
import { useBulkCardStateApi } from '../../../hooks/admin/useBulkCardStateApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/admin/bulkCardStateApi', () => ({
    bulkUpdateCardState: vi.fn(),
}));

const mockAuth = { reducer: { auth: { role: 'admin', id: 1 } } };

const makePayload = (overrides = {}) => ({
    cardIssuanceIds: [1, 2, 3],
    state: 'BLOCK',
    reason: 'Policy violation',
    ...overrides,
});

describe('useBulkCardStateApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
    });

    it('starts with isLoading=false', () => {
        const { result } = renderHook(() => useBulkCardStateApi());
        expect(result.current.isLoading).toBe(false);
    });

    it('sets isLoading=true during the call and false after', async () => {
        let resolve!: (v: any) => void;
        (bulkUpdateCardState as Mock).mockImplementation(
            () =>
                new Promise(r => {
                    resolve = r;
                })
        );

        const { result } = renderHook(() => useBulkCardStateApi());
        act(() => {
            result.current.submitBulkCardState(makePayload() as any);
        });
        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            resolve({ data: {} });
        });
        expect(result.current.isLoading).toBe(false);
    });

    it('calls bulkUpdateCardState with role, id and payload', async () => {
        (bulkUpdateCardState as Mock).mockResolvedValue({ data: {} });
        const { result } = renderHook(() => useBulkCardStateApi());
        const payload = makePayload() as any;

        await act(async () => {
            await result.current.submitBulkCardState(payload);
        });

        expect(bulkUpdateCardState).toHaveBeenCalledWith('admin', 1, payload);
    });

    it('returns the API response on success', async () => {
        const resp = { data: { updated: 3 } };
        (bulkUpdateCardState as Mock).mockResolvedValue(resp);
        const { result } = renderHook(() => useBulkCardStateApi());

        let returned: any;
        await act(async () => {
            returned = await result.current.submitBulkCardState(makePayload() as any);
        });

        expect(returned).toEqual(resp);
    });

    it('returns falsy and sets isLoading=false when API fails', async () => {
        (bulkUpdateCardState as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useBulkCardStateApi());

        let returned: any;
        await act(async () => {
            returned = await result.current.submitBulkCardState(makePayload() as any);
        });

        expect(returned).toBeFalsy();
        expect(result.current.isLoading).toBe(false);
    });
});
