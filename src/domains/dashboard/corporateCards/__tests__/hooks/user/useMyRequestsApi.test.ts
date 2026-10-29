import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { listMyRequests } from '../../../api/user/cardsApi';
import { useMyRequestsApi } from '../../../hooks/user/useMyRequestsApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/user/cardsApi', () => ({
    listMyRequests: vi.fn(),
}));

const mockAuth = { reducer: { auth: { role: 'user', id: 42 } } };

const makeRow = (overrides = {}) => ({
    id: 1,
    date: '2026-06-15',
    cardLast4: '1234',
    status: 'APPROVED',
    payload: { cardType: 'Virtual', requestedLimit: 50000 },
    ...overrides,
});

describe('useMyRequestsApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
    });

    it('starts with isLoading=true and rows=[]', () => {
        (listMyRequests as Mock).mockImplementation(() => new Promise(() => {}));
        const { result } = renderHook(() => useMyRequestsApi('CARD_ISSUANCE', 'Virtual'));
        expect(result.current.isLoading).toBe(true);
        expect(result.current.rows).toEqual([]);
    });

    it('sets rows and isLoading=false after a successful fetch', async () => {
        const row = makeRow();
        (listMyRequests as Mock).mockResolvedValue({ data: { rows: [row] } });
        const { result } = renderHook(() => useMyRequestsApi('CARD_ISSUANCE', 'Virtual'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.rows).toHaveLength(1);
        expect(result.current.rows[0]).toEqual(row);
    });

    it('calls listMyRequests with role, id, requestType and cardType', async () => {
        (listMyRequests as Mock).mockResolvedValue(false);
        renderHook(() => useMyRequestsApi('LIMIT_INCREASE', 'Physical'));
        await waitFor(() =>
            expect(listMyRequests).toHaveBeenCalledWith('user', 42, 'LIMIT_INCREASE', 'Physical')
        );
    });

    it('calls listMyRequests without cardType when not provided', async () => {
        (listMyRequests as Mock).mockResolvedValue(false);
        renderHook(() => useMyRequestsApi('LIMIT_INCREASE'));
        await waitFor(() =>
            expect(listMyRequests).toHaveBeenCalledWith('user', 42, 'LIMIT_INCREASE', undefined)
        );
    });

    it('keeps rows=[] and sets isLoading=false when API returns false', async () => {
        (listMyRequests as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useMyRequestsApi('CARD_ISSUANCE'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.rows).toEqual([]);
    });

    it('keeps rows=[] when data.rows is undefined', async () => {
        (listMyRequests as Mock).mockResolvedValue({ data: {} });
        const { result } = renderHook(() => useMyRequestsApi('CARD_ISSUANCE'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.rows).toEqual([]);
    });

    it('refetch re-calls listMyRequests and updates rows', async () => {
        const row1 = makeRow({ id: 1 });
        const row2 = makeRow({ id: 2 });
        (listMyRequests as Mock)
            .mockResolvedValueOnce({ data: { rows: [row1] } })
            .mockResolvedValueOnce({ data: { rows: [row1, row2] } });

        const { result } = renderHook(() => useMyRequestsApi('CARD_ISSUANCE', 'Virtual'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.rows).toHaveLength(1);

        await act(async () => {
            await result.current.refetch();
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.rows).toHaveLength(2);
    });

    it('keeps existing rows when a refetch returns false', async () => {
        const row = makeRow();
        (listMyRequests as Mock)
            .mockResolvedValueOnce({ data: { rows: [row] } })
            .mockResolvedValueOnce(false);

        const { result } = renderHook(() => useMyRequestsApi('CARD_ISSUANCE', 'Virtual'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.rows).toHaveLength(1);

        await act(async () => {
            await result.current.refetch();
        });

        expect(result.current.rows).toHaveLength(1);
        expect(result.current.isLoading).toBe(false);
    });
});
