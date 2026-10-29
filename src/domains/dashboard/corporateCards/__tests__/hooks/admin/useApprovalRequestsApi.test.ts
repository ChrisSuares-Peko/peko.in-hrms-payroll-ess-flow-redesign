import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { listRequests, approveRequest, rejectRequest } from '../../../api/admin/requestsApi';
import { useApprovalRequestsApi } from '../../../hooks/admin/useApprovalRequestsApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/admin/requestsApi', () => ({
    listRequests: vi.fn(),
    approveRequest: vi.fn(),
    rejectRequest: vi.fn(),
}));

const MOCK_ROWS = [
    {
        id: 1,
        date: '2024-01-01',
        requestType: 'CARD_ISSUANCE',
        status: 'PENDING',
        reason: null,
        decisionNote: null,
        decidedAt: null,
        cardIssuanceId: null,
        cardLast4: null,
        payload: {},
        result: {},
        member: 'Alice',
        holderId: 10,
    },
    {
        id: 2,
        date: '2024-01-02',
        requestType: 'CARD_ISSUANCE',
        status: 'PENDING',
        reason: null,
        decisionNote: null,
        decidedAt: null,
        cardIssuanceId: null,
        cardLast4: null,
        payload: {},
        result: {},
        member: 'Bob',
        holderId: 11,
    },
];

const successResponse = (rows = MOCK_ROWS, count = MOCK_ROWS.length) => ({
    data: { rows, count },
});

describe('useApprovalRequestsApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
            fn({
                reducer: {
                    auth: {
                        role: 'user',
                        id: 1,
                        roleName: 'user',
                        username: 'testuser',
                        subCorporateId: null,
                    },
                },
            })
        );
    });

    it('returns isLoading=true, rows=[], total=0 before the first fetch resolves', () => {
        (listRequests as Mock).mockImplementation(() => new Promise(() => {}));

        const { result } = renderHook(() => useApprovalRequestsApi('CARD_ISSUANCE', 1, 10));

        expect(result.current.isLoading).toBe(true);
        expect(result.current.rows).toEqual([]);
        expect(result.current.total).toBe(0);
        expect(result.current.approvingIds).toEqual([]);
        expect(result.current.rejectingIds).toEqual([]);
    });

    it('sets rows and total correctly and sets isLoading=false after a successful fetch', async () => {
        (listRequests as Mock).mockResolvedValue(successResponse());

        const { result } = renderHook(() => useApprovalRequestsApi('CARD_ISSUANCE', 1, 10));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.rows).toEqual(MOCK_ROWS);
        expect(result.current.total).toBe(MOCK_ROWS.length);
        expect(result.current.isLoading).toBe(false);
    });

    it('calls listRequests with correct role, id and query params', async () => {
        (listRequests as Mock).mockResolvedValue(successResponse([], 0));

        renderHook(() => useApprovalRequestsApi('CARD_ISSUANCE', 2, 20));

        await waitFor(() =>
            expect(listRequests).toHaveBeenCalledWith('user', 1, {
                requestType: 'CARD_ISSUANCE',
                cardType: undefined,
                page: 2,
                itemsPerPage: 20,
            })
        );
    });

    it('forwards a (debounced) searchText to listRequests', async () => {
        (listRequests as Mock).mockResolvedValue(successResponse([], 0));

        renderHook(() =>
            useApprovalRequestsApi('CARD_ISSUANCE', 1, 10, 'Virtual', { searchText: 'pending' })
        );

        await waitFor(() =>
            expect(listRequests).toHaveBeenCalledWith(
                'user',
                1,
                expect.objectContaining({ searchText: 'pending' })
            )
        );
    });

    it('keeps existing rows and sets isLoading=false when a refetch returns false', async () => {
        (listRequests as Mock)
            .mockResolvedValueOnce(successResponse())
            .mockResolvedValueOnce(false);

        const { result } = renderHook(() => useApprovalRequestsApi('CARD_ISSUANCE', 1, 10));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.rows).toEqual(MOCK_ROWS);

        await act(async () => {
            await result.current.refetch();
        });

        expect(result.current.rows).toEqual(MOCK_ROWS);
        expect(result.current.isLoading).toBe(false);
    });

    it('adds requestId to approvingIds while approveRequest is in-flight', async () => {
        (listRequests as Mock).mockResolvedValue(successResponse());

        let resolveApprove!: (val: unknown) => void;
        (approveRequest as Mock).mockImplementation(
            () =>
                new Promise(resolve => {
                    resolveApprove = resolve;
                })
        );

        const { result } = renderHook(() => useApprovalRequestsApi('CARD_ISSUANCE', 1, 10));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.approve(42);
        });

        expect(result.current.approvingIds).toContain(42);

        await act(async () => {
            resolveApprove(true);
        });
    });

    it('calls approveRequest with role, id, requestId and payload', async () => {
        (listRequests as Mock).mockResolvedValue(successResponse());
        (approveRequest as Mock).mockResolvedValue({ data: {} });

        const { result } = renderHook(() => useApprovalRequestsApi('CARD_ISSUANCE', 1, 10));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const payload = { approvedLimit: 5000, note: 'Approved' };

        await act(async () => {
            await result.current.approve(42, payload);
        });

        expect(approveRequest).toHaveBeenCalledWith('user', 1, 42, payload);
    });

    it('removes requestId from approvingIds after approveRequest resolves', async () => {
        (listRequests as Mock).mockResolvedValue(successResponse());
        (approveRequest as Mock).mockResolvedValue({ data: {} });

        const { result } = renderHook(() => useApprovalRequestsApi('CARD_ISSUANCE', 1, 10));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.approve(42);
        });

        expect(result.current.approvingIds).not.toContain(42);
    });

    it('refetches the list after a successful approve', async () => {
        (listRequests as Mock).mockResolvedValue(successResponse());
        (approveRequest as Mock).mockResolvedValue({ data: {} });

        const { result } = renderHook(() => useApprovalRequestsApi('CARD_ISSUANCE', 1, 10));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const callsBefore = (listRequests as Mock).mock.calls.length;

        await act(async () => {
            await result.current.approve(42);
        });

        expect((listRequests as Mock).mock.calls.length).toBeGreaterThan(callsBefore);
    });

    it('does NOT refetch when approveRequest returns false', async () => {
        (listRequests as Mock).mockResolvedValue(successResponse());
        (approveRequest as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useApprovalRequestsApi('CARD_ISSUANCE', 1, 10));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const callsBefore = (listRequests as Mock).mock.calls.length;

        await act(async () => {
            await result.current.approve(42);
        });

        expect((listRequests as Mock).mock.calls.length).toBe(callsBefore);
    });

    it('adds requestId to rejectingIds while rejectRequest is in-flight', async () => {
        (listRequests as Mock).mockResolvedValue(successResponse());

        let resolveReject!: (val: unknown) => void;
        (rejectRequest as Mock).mockImplementation(
            () =>
                new Promise(resolve => {
                    resolveReject = resolve;
                })
        );

        const { result } = renderHook(() => useApprovalRequestsApi('CARD_ISSUANCE', 1, 10));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.reject(99);
        });

        expect(result.current.rejectingIds).toContain(99);

        await act(async () => {
            resolveReject(true);
        });
    });

    it('calls rejectRequest with role, id, requestId and note', async () => {
        (listRequests as Mock).mockResolvedValue(successResponse());
        (rejectRequest as Mock).mockResolvedValue({ data: {} });

        const { result } = renderHook(() => useApprovalRequestsApi('CARD_ISSUANCE', 1, 10));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.reject(99, 'Insufficient docs');
        });

        expect(rejectRequest).toHaveBeenCalledWith('user', 1, 99, 'Insufficient docs');
    });

    it('removes requestId from rejectingIds after rejectRequest resolves', async () => {
        (listRequests as Mock).mockResolvedValue(successResponse());
        (rejectRequest as Mock).mockResolvedValue({ data: {} });

        const { result } = renderHook(() => useApprovalRequestsApi('CARD_ISSUANCE', 1, 10));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.reject(99);
        });

        expect(result.current.rejectingIds).not.toContain(99);
    });

    it('refetches the list after a successful reject', async () => {
        (listRequests as Mock).mockResolvedValue(successResponse());
        (rejectRequest as Mock).mockResolvedValue({ data: {} });

        const { result } = renderHook(() => useApprovalRequestsApi('CARD_ISSUANCE', 1, 10));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const callsBefore = (listRequests as Mock).mock.calls.length;

        await act(async () => {
            await result.current.reject(99);
        });

        expect((listRequests as Mock).mock.calls.length).toBeGreaterThan(callsBefore);
    });

    it('does NOT refetch when rejectRequest returns false', async () => {
        (listRequests as Mock).mockResolvedValue(successResponse());
        (rejectRequest as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useApprovalRequestsApi('CARD_ISSUANCE', 1, 10));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const callsBefore = (listRequests as Mock).mock.calls.length;

        await act(async () => {
            await result.current.reject(99);
        });

        expect((listRequests as Mock).mock.calls.length).toBe(callsBefore);
    });

    it('passes cardType to listRequests when the param is provided', async () => {
        (listRequests as Mock).mockResolvedValue(successResponse([], 0));

        renderHook(() => useApprovalRequestsApi('CARD_ISSUANCE', 1, 10, 'PHYSICAL'));

        await waitFor(() =>
            expect(listRequests).toHaveBeenCalledWith('user', 1, {
                requestType: 'CARD_ISSUANCE',
                cardType: 'PHYSICAL',
                page: 1,
                itemsPerPage: 10,
            })
        );
    });

    it('refetch re-invokes listRequests and updates rows and total', async () => {
        const updatedRows = [
            { ...MOCK_ROWS[0], status: 'APPROVED' },
            { ...MOCK_ROWS[1], status: 'APPROVED' },
        ];

        (listRequests as Mock)
            .mockResolvedValueOnce(successResponse())
            .mockResolvedValueOnce(successResponse(updatedRows, updatedRows.length));

        const { result } = renderHook(() => useApprovalRequestsApi('CARD_ISSUANCE', 1, 10));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.rows).toEqual(MOCK_ROWS);

        await act(async () => {
            await result.current.refetch();
        });

        expect(result.current.rows).toEqual(updatedRows);
        expect(result.current.total).toBe(updatedRows.length);
        expect(result.current.isLoading).toBe(false);
    });

    it('tracks multiple concurrent approvingIds independently', async () => {
        (listRequests as Mock).mockResolvedValue(successResponse());

        let resolveFirst!: (val: unknown) => void;
        let resolveSecond!: (val: unknown) => void;
        (approveRequest as Mock)
            .mockImplementationOnce(
                () =>
                    new Promise(r => {
                        resolveFirst = r;
                    })
            )
            .mockImplementationOnce(
                () =>
                    new Promise(r => {
                        resolveSecond = r;
                    })
            );

        const { result } = renderHook(() => useApprovalRequestsApi('CARD_ISSUANCE', 1, 10));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.approve(10);
        });
        act(() => {
            result.current.approve(20);
        });

        expect(result.current.approvingIds).toContain(10);
        expect(result.current.approvingIds).toContain(20);

        await act(async () => {
            resolveFirst(true);
        });
        await waitFor(() => expect(result.current.approvingIds).not.toContain(10));
        expect(result.current.approvingIds).toContain(20);

        await act(async () => {
            resolveSecond(true);
        });
        await waitFor(() => expect(result.current.approvingIds).not.toContain(20));
    });
});
