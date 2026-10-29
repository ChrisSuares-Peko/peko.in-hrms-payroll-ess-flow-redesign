import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getUserTransactions } from '../../../api/user/transactionsApi';
import {
    useUserTransactionsApi,
    TransactionFilters,
} from '../../../hooks/user/useUserTransactionsApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/hooks/useDebounce', () => ({
    default: (v: string) => v,
}));

vi.mock('@utils/dateFormat', () => ({
    formattedDateOnly: vi.fn((_date: Date) => 'January 1, 2024'),
}));

vi.mock('../../../api/user/transactionsApi', () => ({
    getUserTransactions: vi.fn(),
}));

const makeApiRow = (
    overrides: Partial<{
        id: number;
        cardLast4: string | null;
        date: string | null;
        merchant: string;
        member: string | null;
        status: string;
        approval: string | null;
        declineReason: string | null;
        fee: number | null;
        amount: number;
        transactionId: string;
        category: string;
    }> = {}
) => ({
    id: 1,
    cardLast4: '1234',
    date: '2024-01-01T00:00:00Z',
    merchant: 'Amazon',
    member: 'John Doe',
    status: 'Completed',
    approval: 'Auto-approved',
    declineReason: null,
    fee: 10,
    amount: 500,
    transactionId: 'TXN001',
    category: 'Shopping',
    ...overrides,
});

const makeApiResponse = (rows: ReturnType<typeof makeApiRow>[], count?: number) => ({
    data: { count: count ?? rows.length, rows },
});

describe('useUserTransactionsApi', () => {
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

    it('has isLoading=true, empty transactions, total=0 before fetch settles', () => {
        (getUserTransactions as Mock).mockReturnValue(new Promise(() => {}));

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        expect(result.current.isLoading).toBe(true);
        expect(result.current.transactions).toEqual([]);
        expect(result.current.total).toBe(0);
    });

    it('always exposes pageSize of 10', async () => {
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse([]));

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.pageSize).toBe(10);
    });

    it('maps API rows to TransactionRow and sets total, isLoading=false on success', async () => {
        const rows = [
            makeApiRow({
                id: 1,
                cardLast4: '1234',
                status: 'Completed',
                approval: 'Auto-approved',
                fee: 10,
                amount: 500,
            }),
            makeApiRow({
                id: 2,
                cardLast4: '5678',
                merchant: 'Uber',
                member: 'Jane Doe',
                status: 'Processing',
                approval: 'Approved',
                fee: 5,
                amount: 200,
                transactionId: 'TXN002',
                category: 'Travel',
            }),
        ];

        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse(rows, 2));

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.total).toBe(2);
        expect(result.current.transactions).toHaveLength(2);

        expect(result.current.transactions[0]).toMatchObject({
            key: '1',
            cardLast4: '**** **** **** 1234',
            merchant: 'Amazon',
            member: 'John Doe',
            status: 'Completed',
            approval: 'Auto-approved',
            fee: 10,
            amount: 500,
            transactionId: 'TXN001',
            category: 'Shopping',
        });

        expect(result.current.transactions[1]).toMatchObject({
            key: '2',
            cardLast4: '**** **** **** 5678',
            merchant: 'Uber',
            member: 'Jane Doe',
            status: 'Processing',
            approval: 'Approved',
            fee: 5,
            amount: 200,
            transactionId: 'TXN002',
            category: 'Travel',
        });
    });

    it('formats cardLast4 as "**** **** **** XXXX" when API returns a value', async () => {
        const rows = [makeApiRow({ cardLast4: '9876' })];
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse(rows));

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.transactions[0].cardLast4).toBe('**** **** **** 9876');
    });

    it('sets cardLast4 to "—" when API row has null cardLast4', async () => {
        const rows = [makeApiRow({ cardLast4: null })];
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse(rows));

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.transactions[0].cardLast4).toBe('—');
    });

    it('sets cardLast4 to "—" when API row has empty string cardLast4', async () => {
        const rows = [makeApiRow({ cardLast4: '' })];
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse(rows));

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.transactions[0].cardLast4).toBe('—');
    });

    it('sets date to "—" when API row has null date', async () => {
        const rows = [makeApiRow({ date: null })];
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse(rows));

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.transactions[0].date).toBe('—');
    });

    it('formats date via formattedDateOnly when API row has a date string', async () => {
        const rows = [makeApiRow({ date: '2024-06-15T00:00:00Z' })];
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse(rows));

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.transactions[0].date).toBe('January 1, 2024');
    });

    it('defaults approval to "Auto-approved" when API row has null approval', async () => {
        const rows = [makeApiRow({ approval: null })];
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse(rows));

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.transactions[0].approval).toBe('Auto-approved');
    });

    it('passes declineReason through when present', async () => {
        const rows = [makeApiRow({ declineReason: 'Exceeds per-transaction limit' })];
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse(rows));

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.transactions[0].declineReason).toBe('Exceeds per-transaction limit');
    });

    it('defaults declineReason to null when API row omits it', async () => {
        const rows = [makeApiRow({ declineReason: undefined })];
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse(rows));

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.transactions[0].declineReason).toBeNull();
    });

    it('defaults member to empty string when API row has null member', async () => {
        const rows = [makeApiRow({ member: null })];
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse(rows));

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.transactions[0].member).toBe('');
    });

    it('defaults fee to 0 when API row has null fee', async () => {
        const rows = [makeApiRow({ fee: null })];
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse(rows));

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.transactions[0].fee).toBe(0);
    });

    it('keeps transactions empty and sets isLoading=false when API returns false', async () => {
        (getUserTransactions as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.transactions).toEqual([]);
        expect(result.current.total).toBe(0);
    });

    it('keeps transactions empty and sets isLoading=false when API returns response without data', async () => {
        (getUserTransactions as Mock).mockResolvedValue({ data: null });

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.transactions).toEqual([]);
        expect(result.current.total).toBe(0);
    });

    it('calls getUserTransactions with the correct role, id, page, and itemsPerPage', async () => {
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse([]));

        const { result } = renderHook(() => useUserTransactionsApi(3, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getUserTransactions).toHaveBeenCalledWith(
            'user',
            1,
            expect.objectContaining({ page: 3, itemsPerPage: 10 })
        );
    });

    it('includes searchText in params when filter is non-empty', async () => {
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse([]));

        const { result } = renderHook(() => useUserTransactionsApi(1, { searchText: 'coffee' }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getUserTransactions).toHaveBeenCalledWith(
            'user',
            1,
            expect.objectContaining({ searchText: 'coffee' })
        );
    });

    it('omits searchText from params when filter is empty string', async () => {
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse([]));

        const { result } = renderHook(() => useUserTransactionsApi(1, { searchText: '' }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const calledParams = (getUserTransactions as Mock).mock.calls[0][2];
        expect(calledParams).not.toHaveProperty('searchText');
    });

    it('includes dateFrom in params when provided', async () => {
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse([]));

        const { result } = renderHook(() => useUserTransactionsApi(1, { dateFrom: '2024-01-01' }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getUserTransactions).toHaveBeenCalledWith(
            'user',
            1,
            expect.objectContaining({ dateFrom: '2024-01-01' })
        );
    });

    it('omits dateFrom from params when not provided', async () => {
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse([]));

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const calledParams = (getUserTransactions as Mock).mock.calls[0][2];
        expect(calledParams).not.toHaveProperty('dateFrom');
    });

    it('includes dateTo in params when provided', async () => {
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse([]));

        const { result } = renderHook(() => useUserTransactionsApi(1, { dateTo: '2024-12-31' }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getUserTransactions).toHaveBeenCalledWith(
            'user',
            1,
            expect.objectContaining({ dateTo: '2024-12-31' })
        );
    });

    it('includes status in params when provided', async () => {
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse([]));

        const { result } = renderHook(() => useUserTransactionsApi(1, { status: 'Completed' }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getUserTransactions).toHaveBeenCalledWith(
            'user',
            1,
            expect.objectContaining({ status: 'Completed' })
        );
    });

    it('includes category in params when provided', async () => {
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse([]));

        const { result } = renderHook(() => useUserTransactionsApi(1, { category: 'Travel' }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getUserTransactions).toHaveBeenCalledWith(
            'user',
            1,
            expect.objectContaining({ category: 'Travel' })
        );
    });

    it('passes all provided filters together in a single call', async () => {
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse([]));

        const filters: TransactionFilters = {
            dateFrom: '2024-01-01',
            dateTo: '2024-01-31',
            status: 'Declined',
            category: 'Food',
            searchText: 'burger',
        };

        const { result } = renderHook(() => useUserTransactionsApi(2, filters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getUserTransactions).toHaveBeenCalledWith(
            'user',
            1,
            expect.objectContaining({
                page: 2,
                itemsPerPage: 10,
                dateFrom: '2024-01-01',
                dateTo: '2024-01-31',
                status: 'Declined',
                category: 'Food',
                searchText: 'burger',
            })
        );
    });

    it('sends the cardholder an admin selected as userId', async () => {
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse([]));

        const { result } = renderHook(() => useUserTransactionsApi(1, { userId: '42' }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getUserTransactions).toHaveBeenCalledWith(
            'user',
            1,
            // Sent as a string: GetTransactionsParams declares it as one, and it serialises into the
            // query string identically either way.
            expect.objectContaining({ userId: '42' })
        );
    });

    // An employee's scope is derived server-side from their session identity, so an id invented here could
    // only ever contradict it — and the server ignores the parameter for them anyway.
    it('sends no cardholder id of its own when the caller selected none', async () => {
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse([]));

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const calledParams = (getUserTransactions as Mock).mock.calls[0][2];
        expect(calledParams).not.toHaveProperty('userId');
        expect(calledParams).not.toHaveProperty('subCorporateId');
    });

    it('refetches when page changes and updates results', async () => {
        const firstPageRows = [makeApiRow({ id: 10, merchant: 'Store A' })];
        const secondPageRows = [makeApiRow({ id: 20, merchant: 'Store B' })];

        (getUserTransactions as Mock)
            .mockResolvedValueOnce(makeApiResponse(firstPageRows, 20))
            .mockResolvedValueOnce(makeApiResponse(secondPageRows, 20));

        const { result, rerender } = renderHook(
            ({ page, filters }: { page: number; filters: TransactionFilters }) =>
                useUserTransactionsApi(page, filters),
            { initialProps: { page: 1, filters: {} } }
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.transactions[0].merchant).toBe('Store A');

        rerender({ page: 2, filters: {} });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.transactions[0].merchant).toBe('Store B');
        expect(getUserTransactions).toHaveBeenCalledTimes(2);
    });

    it('refetches when a filter value changes', async () => {
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse([]));

        const { result, rerender } = renderHook(
            ({ page, filters }: { page: number; filters: TransactionFilters }) =>
                useUserTransactionsApi(page, filters),
            { initialProps: { page: 1, filters: { status: 'Completed' } } }
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        rerender({ page: 1, filters: { status: 'Declined' } });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getUserTransactions).toHaveBeenCalledTimes(2);

        const secondCallParams = (getUserTransactions as Mock).mock.calls[1][2];
        expect(secondCallParams.status).toBe('Declined');
    });

    it('sets total to 0 and transactions to empty array when API returns empty rows', async () => {
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse([], 0));

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.total).toBe(0);
        expect(result.current.transactions).toEqual([]);
    });

    it('uses API count field for total even when it differs from rows length', async () => {
        const rows = [makeApiRow()];
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse(rows, 99));

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.total).toBe(99);
        expect(result.current.transactions).toHaveLength(1);
    });

    it('sets key to stringified row id', async () => {
        const rows = [makeApiRow({ id: 777 })];
        (getUserTransactions as Mock).mockResolvedValue(makeApiResponse(rows));

        const { result } = renderHook(() => useUserTransactionsApi(1, {}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.transactions[0].key).toBe('777');
    });
});
