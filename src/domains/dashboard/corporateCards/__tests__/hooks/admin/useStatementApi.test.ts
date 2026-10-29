import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getStatement,
    exportStatement as exportStatementApi,
} from '../../../api/admin/statementApi';
import { useStatementApi } from '../../../hooks/admin/useStatementApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((opts: any) => ({ type: 'SHOW_TOAST', payload: opts })),
}));

vi.mock('@utils/dateFormat', () => ({
    formattedDateOnly: vi.fn((d: Date) => d.toISOString().split('T')[0]),
}));

vi.mock('../../../api/admin/statementApi', () => ({
    getStatement: vi.fn(),
    exportStatement: vi.fn(),
}));

const mockDispatch = vi.fn();
const mockAuth = { reducer: { auth: { role: 'admin', id: 1 } } };

const PAGE_SIZE = 20;

const makeStatementData = (overrides = {}) => ({
    month: '2024-01',
    summary: {
        openingBalance: 100000,
        moneyIn: 50000,
        moneyOut: 30000,
        closingBalance: 120000,
    },
    // Whole-month movement count (markers excluded) — drives the pager and the export guard.
    count: 1,
    page: 1,
    itemsPerPage: PAGE_SIZE,
    rows: [
        {
            kind: 'txn',
            date: '2024-01-10',
            description: 'Card purchase',
            reference: 'REF-001',
            type: 'Debit',
            moneyIn: null,
            moneyOut: 5000,
            balance: 95000,
        },
    ],
    ...overrides,
});

describe('useStatementApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
        (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    });

    // -----------------------------------------------------------------------
    describe('initial state', () => {
        it('starts with isLoading=false, exporting=false, empty summary and rows', () => {
            (getStatement as Mock).mockImplementation(() => new Promise(() => {}));
            const { result } = renderHook(() => useStatementApi());
            expect(result.current.isLoading).toBe(true); // fetch is in-flight
            expect(result.current.exporting).toBe(false);
            expect(result.current.summary).toEqual([]);
            expect(result.current.rows).toEqual([]);
        });

        it('exposes month, setMonth and monthLabel', () => {
            (getStatement as Mock).mockImplementation(() => new Promise(() => {}));
            const { result } = renderHook(() => useStatementApi());
            // month is current YYYY-MM, monthLabel is human-readable
            expect(result.current.month).toMatch(/^\d{4}-\d{2}$/);
            expect(typeof result.current.monthLabel).toBe('string');
            expect(typeof result.current.setMonth).toBe('function');
        });

        it('reports the default month as the current month', () => {
            (getStatement as Mock).mockImplementation(() => new Promise(() => {}));
            const { result } = renderHook(() => useStatementApi());
            expect(result.current.isCurrentMonth).toBe(true);
        });
    });

    // -----------------------------------------------------------------------
    describe('fetching statement', () => {
        it('calls getStatement with role, id, current month and the first page', async () => {
            (getStatement as Mock).mockResolvedValue(false);
            const { result } = renderHook(() => useStatementApi());
            await waitFor(() =>
                expect(getStatement).toHaveBeenCalledWith(
                    'admin',
                    1,
                    result.current.month,
                    1,
                    PAGE_SIZE
                )
            );
        });

        it('populates summary array (4 items) on success', async () => {
            (getStatement as Mock).mockResolvedValue({ data: makeStatementData() });
            const { result } = renderHook(() => useStatementApi());
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            expect(result.current.summary).toHaveLength(4);
        });

        it('summary contains correct keys', async () => {
            (getStatement as Mock).mockResolvedValue({ data: makeStatementData() });
            const { result } = renderHook(() => useStatementApi());
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            const keys = result.current.summary.map(s => s.key);
            expect(keys).toEqual(['opening', 'money-in', 'money-out', 'closing']);
        });

        it('maps txn rows with "upRed" trend when moneyOut is set and moneyIn is null', async () => {
            (getStatement as Mock).mockResolvedValue({ data: makeStatementData() });
            const { result } = renderHook(() => useStatementApi());
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            expect(result.current.rows.find(r => r.kind === 'txn')?.trend).toBe('upRed');
        });

        it('maps txn rows with "inGreen" trend when moneyIn is set', async () => {
            const data = makeStatementData({
                rows: [
                    {
                        kind: 'txn',
                        date: '2024-01-11',
                        description: 'Refund',
                        reference: 'REF-002',
                        type: 'Credit',
                        moneyIn: 1000,
                        moneyOut: null,
                        balance: 101000,
                    },
                ],
            });
            (getStatement as Mock).mockResolvedValue({ data });
            const { result } = renderHook(() => useStatementApi());
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            expect(result.current.rows.find(r => r.kind === 'txn')?.trend).toBe('inGreen');
        });

        // The markers anchor every page, so an admin on page 4 still sees the balances in between.
        it('brackets every page with the opening and closing markers', async () => {
            (getStatement as Mock).mockResolvedValue({
                data: makeStatementData({ count: 110, page: 4 }),
            });
            const { result } = renderHook(() => useStatementApi());
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            const kinds = result.current.rows.map(r => r.kind);
            expect(kinds[0]).toBe('opening');
            expect(kinds[kinds.length - 1]).toBe('closing');
        });

        it('builds the markers from the whole-month summary, not from the API marker rows', async () => {
            (getStatement as Mock).mockResolvedValue({ data: makeStatementData() });
            const { result } = renderHook(() => useStatementApi());
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            const opening = result.current.rows.find(r => r.kind === 'opening')!;
            const closing = result.current.rows.find(r => r.kind === 'closing')!;
            expect(opening.balance).toBe('₹1,00,000.00'); // summary.openingBalance
            expect(closing.balance).toBe('₹1,20,000.00'); // summary.closingBalance
            expect(closing.moneyIn).toBe('₹50,000.00'); // summary.moneyIn
            expect(closing.moneyOut).toBe('₹30,000.00'); // summary.moneyOut
            expect(closing.date).toBe('End of period');
        });

        // The API sends its own markers on the first/last page — rendering those too would duplicate them.
        it('drops the API marker rows so a marker is never rendered twice', async () => {
            (getStatement as Mock).mockResolvedValue({
                data: makeStatementData({
                    rows: [
                        {
                            kind: 'opening',
                            date: '2024-01-01',
                            description: 'Opening balance',
                            reference: '',
                            type: '',
                            moneyIn: null,
                            moneyOut: null,
                            balance: 100000,
                        },
                        {
                            kind: 'txn',
                            date: '2024-01-10',
                            description: 'Card purchase',
                            reference: 'REF-001',
                            type: 'Debit',
                            moneyIn: null,
                            moneyOut: 5000,
                            balance: 95000,
                        },
                        {
                            kind: 'closing',
                            date: '2024-01-31',
                            description: 'Closing balance',
                            reference: '',
                            type: '',
                            moneyIn: 50000,
                            moneyOut: 30000,
                            balance: 120000,
                        },
                    ],
                }),
            });
            const { result } = renderHook(() => useStatementApi());
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            const kinds = result.current.rows.map(r => r.kind);
            expect(kinds).toEqual(['opening', 'txn', 'closing']);
        });

        it('keeps summary=[] and rows=[] when API returns false', async () => {
            (getStatement as Mock).mockResolvedValue(false);
            const { result } = renderHook(() => useStatementApi());
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            expect(result.current.summary).toEqual([]);
            expect(result.current.rows).toEqual([]);
        });

        it('refetches when month is changed via setMonth', async () => {
            (getStatement as Mock).mockResolvedValue(false);
            const { result } = renderHook(() => useStatementApi());
            await waitFor(() => expect(getStatement).toHaveBeenCalledTimes(1));

            act(() => {
                result.current.setMonth('2023-12');
            });
            await waitFor(() => expect(getStatement).toHaveBeenCalledTimes(2));
            expect(getStatement).toHaveBeenLastCalledWith('admin', 1, '2023-12', 1, PAGE_SIZE);
        });

        it('reports a past month as not the current month', async () => {
            (getStatement as Mock).mockResolvedValue({ data: makeStatementData() });
            const { result } = renderHook(() => useStatementApi());
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            act(() => {
                result.current.setMonth('2023-12');
            });

            expect(result.current.isCurrentMonth).toBe(false);
        });

        it('drops the previous month summary when the month changes, so no stale balances are shown', async () => {
            (getStatement as Mock).mockResolvedValue({ data: makeStatementData() });
            const { result } = renderHook(() => useStatementApi());
            await waitFor(() => expect(result.current.summary).toHaveLength(4));

            (getStatement as Mock).mockImplementation(() => new Promise(() => {}));
            act(() => {
                result.current.setMonth('2023-12');
            });

            expect(result.current.summary).toEqual([]);
        });

        it('keeps the summary in place when only the page changes', async () => {
            (getStatement as Mock).mockResolvedValue({ data: makeStatementData({ count: 110 }) });
            const { result } = renderHook(() => useStatementApi());
            await waitFor(() => expect(result.current.summary).toHaveLength(4));

            act(() => {
                result.current.setPage(2);
            });

            expect(result.current.summary).toHaveLength(4);
        });

        it('exposes the whole-month count for the pager', async () => {
            (getStatement as Mock).mockResolvedValue({ data: makeStatementData({ count: 110 }) });
            const { result } = renderHook(() => useStatementApi());
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            expect(result.current.count).toBe(110);
            expect(result.current.pageSize).toBe(PAGE_SIZE);
        });

        it('refetches the requested page when setPage is called, month unchanged', async () => {
            (getStatement as Mock).mockResolvedValue({ data: makeStatementData({ count: 110 }) });
            const { result } = renderHook(() => useStatementApi());
            await waitFor(() => expect(getStatement).toHaveBeenCalledTimes(1));

            act(() => {
                result.current.setPage(3);
            });
            await waitFor(() => expect(getStatement).toHaveBeenCalledTimes(2));
            expect(getStatement).toHaveBeenLastCalledWith(
                'admin',
                1,
                result.current.month,
                3,
                PAGE_SIZE
            );
        });

        // A new month has its own row count, so keeping page 3 would request a page that may not exist.
        it('resets to page 1 when the month changes', async () => {
            (getStatement as Mock).mockResolvedValue({ data: makeStatementData({ count: 110 }) });
            const { result } = renderHook(() => useStatementApi());
            await waitFor(() => expect(getStatement).toHaveBeenCalledTimes(1));

            act(() => {
                result.current.setPage(3);
            });
            await waitFor(() => expect(result.current.page).toBe(3));

            act(() => {
                result.current.setMonth('2023-12');
            });
            await waitFor(() => expect(result.current.page).toBe(1));
            expect(getStatement).toHaveBeenLastCalledWith('admin', 1, '2023-12', 1, PAGE_SIZE);
        });

        it('keeps the summary identical across pages (it is whole-month, not per-page)', async () => {
            (getStatement as Mock).mockResolvedValue({ data: makeStatementData({ count: 110 }) });
            const { result } = renderHook(() => useStatementApi());
            await waitFor(() => expect(result.current.isLoading).toBe(false));
            const firstPageSummary = result.current.summary.map(s => s.value);

            act(() => {
                result.current.setPage(2);
            });
            await waitFor(() => expect(getStatement).toHaveBeenCalledTimes(2));

            expect(result.current.summary.map(s => s.value)).toEqual(firstPageSummary);
        });
    });

    // -----------------------------------------------------------------------
    describe('exportStatement', () => {
        beforeEach(() => {
            // Set up URL and anchor mocks
            global.URL.createObjectURL = vi.fn(() => 'blob:fake-url');
            global.URL.revokeObjectURL = vi.fn();
            const mockAnchor = { href: '', download: '', click: vi.fn() };
            // Only intercept <a> creation — renderHook needs real divs for its wrapper
            const originalCreateElement = document.createElement.bind(document);
            vi.spyOn(document, 'createElement').mockImplementation(
                (tag: string, options?: ElementCreationOptions) =>
                    tag === 'a' ? (mockAnchor as any) : originalCreateElement(tag, options as any)
            );
        });
        afterEach(() => vi.restoreAllMocks());

        // Export is gated on the month having movements, so the statement must be loaded first — a mock
        // that resolves `false` leaves count at 0 and short-circuits before the export is ever attempted.
        const renderLoaded = async () => {
            (getStatement as Mock).mockResolvedValue({ data: makeStatementData() });
            const hook = renderHook(() => useStatementApi());
            await waitFor(() => expect(hook.result.current.count).toBe(1));
            return hook;
        };

        it('sets exporting=true during export and false after', async () => {
            let resolve!: (v: any) => void;
            (exportStatementApi as Mock).mockImplementation(
                () =>
                    new Promise(r => {
                        resolve = r;
                    })
            );

            const { result } = await renderLoaded();
            act(() => {
                result.current.exportStatement();
            });
            expect(result.current.exporting).toBe(true);

            await act(async () => {
                resolve(new Blob(['csv-data']));
            });
            expect(result.current.exporting).toBe(false);
        });

        // The export is always the whole month, never the open page — so no page argument.
        it('calls exportStatement with role, id and current month', async () => {
            (exportStatementApi as Mock).mockResolvedValue(false);

            const { result } = await renderLoaded();
            await act(async () => {
                await result.current.exportStatement();
            });

            expect(exportStatementApi).toHaveBeenCalledWith('admin', 1, result.current.month);
        });

        it('dispatches success toast when export returns a blob', async () => {
            (exportStatementApi as Mock).mockResolvedValue(new Blob(['data']));

            const { result } = await renderLoaded();
            await act(async () => {
                await result.current.exportStatement();
            });

            expect(showToast).toHaveBeenCalledWith({
                variant: 'success',
                description: 'Statement exported.',
            });
        });

        it('does not dispatch toast when export returns false', async () => {
            (exportStatementApi as Mock).mockResolvedValue(false);

            const { result } = await renderLoaded();
            await act(async () => {
                await result.current.exportStatement();
            });

            expect(showToast).not.toHaveBeenCalled();
        });

        it('refuses the export for a month with no movements, without calling the API', async () => {
            (getStatement as Mock).mockResolvedValue({
                data: makeStatementData({ count: 0, rows: [] }),
            });
            (exportStatementApi as Mock).mockResolvedValue(new Blob(['data']));

            const { result } = renderHook(() => useStatementApi());
            await waitFor(() => expect(result.current.isLoading).toBe(false));
            await act(async () => {
                await result.current.exportStatement();
            });

            expect(exportStatementApi).not.toHaveBeenCalled();
            expect(showToast).toHaveBeenCalledWith({
                variant: 'info',
                description: 'No data is available for export',
            });
        });
    });
});
