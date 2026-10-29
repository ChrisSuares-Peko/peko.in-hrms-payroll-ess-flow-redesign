import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import dayjs from 'dayjs';
import { saveAs } from 'file-saver';

import { useAppSelector } from '@src/hooks/store';

import {
    ApiTransaction,
    exportTransactions,
    getTransactions,
    GetTransactionsParams,
    TransactionCounts,
} from '../api/transactions';
import {
    Transaction,
    TransactionFilters,
    TransactionMonthGroup,
    TransactionStatus,
    TransactionTab,
} from '../utils/transactionsData';

const TAB_TO_API: Record<TransactionTab['key'], string> = {
    all: 'all',
    'needs-review': 'needs_review',
    matched: 'matched',
    recurring: 'recurring',
    hidden: 'hidden',
};

const TYPE_TO_API: Record<string, string | undefined> = {
    income: 'Income',
    expense: 'Expense',
};

const STATUS_TO_API: Record<string, string | undefined> = {
    categorized: 'categorized',
    'needs-review': 'needs_review',
};

const ITEMS_PER_PAGE = 20;

const mapTransaction = (t: ApiTransaction): Transaction => {
    const invoiceLink = t.links?.find(link => link.targetType === 'INVOICING');
    return {
        id: String(t.id),
        date: dayjs(t.date).format('MMM DD'),
        description: t.description,
        recurring: t.recurring || undefined,
        note: t.note || undefined,
        category: { label: t.category || 'Uncategorized' },
        amount: t.amount,
        type: t.type,
        account: t.account,
        invoiceNo: invoiceLink ? String(invoiceLink.targetId) : undefined,
        links: (t.links ?? []).map(l => ({
            id: l.id,
            targetType: l.targetType,
            targetId: l.targetId,
        })),
        documents: (t.documents ?? []).map(d => ({ id: d.id, name: d.name, url: d.url })),
        statuses: (t.statuses ?? []) as TransactionStatus[],
    };
};

const groupByMonth = (transactions: ApiTransaction[]): TransactionMonthGroup[] => {
    const order: string[] = [];
    const byMonth = new Map<string, Transaction[]>();
    transactions.forEach(t => {
        const month = dayjs(t.date).format('MMMM YYYY');
        if (!byMonth.has(month)) {
            byMonth.set(month, []);
            order.push(month);
        }
        byMonth.get(month)!.push(mapTransaction(t));
    });
    return order.map(month => ({ month, transactions: byMonth.get(month)! }));
};

const mapCounts = (c: TransactionCounts): Partial<Record<TransactionTab['key'], number>> => ({
    all: c.all,
    'needs-review': c.needs_review,
    matched: c.matched,
    recurring: c.recurring,
    hidden: c.hidden,
});

const list = (values?: string[]) => (values && values.length ? values.join(',') : undefined);

export const useTransactions = (
    activeTab: TransactionTab['key'],
    searchText: string,
    filters: TransactionFilters
) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);

    const [items, setItems] = useState<ApiTransaction[]>([]);
    const [counts, setCounts] = useState<Partial<Record<TransactionTab['key'], number>>>({});
    const [recordsTotal, setRecordsTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    const genRef = useRef(0);

    const buildParams = useCallback(
        (pageNo: number, perPage: number): GetTransactionsParams => ({
            userId,
            userType,
            tab: TAB_TO_API[activeTab],
            searchText: searchText.trim() || undefined,
            type: filters.type ? TYPE_TO_API[filters.type] : undefined,
            category: list(filters.categories),
            source: list(filters.sources),
            bankAccount: list(filters.bankAccounts),
            status: filters.status ? STATUS_TO_API[filters.status] : undefined,
            from: filters.from || undefined,
            to: filters.to || undefined,
            page: pageNo,
            itemsPerPage: perPage,
        }),
        [userId, userType, activeTab, searchText, filters]
    );

    // Changing the tab, search or filters resets back to the first page.
    useEffect(() => {
        setPage(1);
    }, [activeTab, searchText, filters]);

    // Fetch the current page whenever the query, page or page size changes.
    useEffect(() => {
        genRef.current += 1;
        const gen = genRef.current;
        setLoading(true);
        getTransactions(buildParams(page, itemsPerPage)).then(data => {
            if (gen !== genRef.current) return;
            if (data) {
                setItems(data.transactions);
                setRecordsTotal(data.recordsTotal);
                setCounts(mapCounts(data.counts));
            } else {
                setItems([]);
                setRecordsTotal(0);
            }
            setLoading(false);
        });
    }, [buildParams, page, itemsPerPage]);

    // Jump to a page / change the page size. A new page size restarts at page 1.
    const handlePageChange = useCallback(
        (nextPage: number, nextSize: number) => {
            setPage(nextSize !== itemsPerPage ? 1 : nextPage);
            setItemsPerPage(nextSize);
        },
        [itemsPerPage]
    );

    const refetch = useCallback(() => {
        genRef.current += 1;
        const gen = genRef.current;
        getTransactions(buildParams(page, itemsPerPage)).then(data => {
            if (gen !== genRef.current) return;
            if (data) {
                setItems(data.transactions);
                setRecordsTotal(data.recordsTotal);
                setCounts(mapCounts(data.counts));
            }
        });
    }, [buildParams, page, itemsPerPage]);

    const downloadExport = useCallback(
        async (format: 'excel' | 'csv' = 'excel') => {
            if (exporting) return;
            setExporting(true);
            try {
                const data = await exportTransactions({
                    ...buildParams(1, ITEMS_PER_PAGE),
                    format,
                });
                if (data) {
                    const blob = new Blob([new Uint8Array(data.buffer.data)], {
                        type: data.fileType,
                    });
                    saveAs(blob, `Transactions.${format === 'csv' ? 'csv' : 'xlsx'}`);
                }
            } finally {
                setExporting(false);
            }
        },
        [buildParams, exporting]
    );

    const groups = useMemo(() => groupByMonth(items), [items]);

    return {
        groups,
        counts,
        recordsTotal,
        loading,
        page,
        itemsPerPage,
        handlePageChange,
        refetch,
        exporting,
        downloadExport,
    };
};
