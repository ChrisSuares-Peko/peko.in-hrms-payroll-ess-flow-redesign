import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchAgingAnalysis } from '../../api/aging';
import type { AgingAnalysisInvoiceItem, AgingAnalysisResponse } from '../../types/aging';
import {
    AGING_BUCKET_CONFIG,
    AGING_BUCKET_LABEL_TO_KEY,
    AGING_FILTER_OPTIONS,
} from '../../utils/constants/agingAnalysis';
import type { AgingInvoiceRow } from '../../utils/table_column/agingColumns';

export interface AgingBucket {
    label: string;
    value: number;
    color: string;
}

export interface PaidVsOutstandingData {
    paid: number;
    outstanding: number;
    currency?: string;
}

const fmtAmount = (amount: number) =>
    `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const toBuckets = (buckets: AgingAnalysisResponse['agingAnalysis']['buckets']): AgingBucket[] =>
    buckets.map(b => ({
        label: AGING_BUCKET_CONFIG[b.label]?.label ?? b.label,
        value: b.amount,
        color: AGING_BUCKET_CONFIG[b.label]?.color ?? '#6B7280',
    }));

const toInvoiceRows = (invoices: AgingAnalysisInvoiceItem[]): AgingInvoiceRow[] =>
    invoices.map(inv => ({
        id: String(inv.id),
        invoiceNo: `${inv.prefix ?? ''}${inv.invoiceNumber}`,
        customerName: inv.name ?? '',
        issueDate: inv.invoiceDate ?? '',
        dueDate: inv.dueDate ?? '',
        total: fmtAmount(parseFloat(inv.totalAmount || '0')),
        paid: fmtAmount(parseFloat(inv.amountPaid || '0')),
        outstanding: fmtAmount(parseFloat(inv.outstandingAmount || '0')),
        daysOverdue: inv.daysOverdue > 0 ? inv.daysOverdue : null,
        status: inv.status,
    }));

type AgingFilters = {
    timePeriod: string;
    page: number;
    limit: number;
    sortBy: string | undefined;
    sortOrder: 'asc' | 'desc';
};

export const useAgingAnalysis = () => {
    const { id, role } = useAppSelector(s => s.reducer.auth);

    const [filters, setFilters] = useState<AgingFilters>({
        timePeriod: 'all',
        page: 1,
        limit: 10,
        sortBy: undefined,
        sortOrder: 'desc',
    });

    const [summary, setSummary] = useState({
        outstanding: 0,
        outstandingDelta: 0,
        overdue: 0,
        overdueDelta: 0,
        paid: 0,
        paidDelta: 0,
        avgDaysToPay: 0,
    });
    const [buckets, setBuckets] = useState<AgingBucket[]>([]);
    const [paidVsOutstanding, setPaidVsOutstanding] = useState<PaidVsOutstandingData | null>(null);
    const [invoiceRows, setInvoiceRows] = useState<AgingInvoiceRow[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [isLoadingAgingAnalysis, setIsLoadingAgingAnalysis] = useState(false);

    const handleFetchAgingAnalysis = useCallback(async () => {
        setIsLoadingAgingAnalysis(true);
        const result = await fetchAgingAnalysis({
            userId: id,
            userType: role,
            timePeriod: filters.timePeriod,
            page: filters.page,
            limit: filters.limit,
            ...(filters.sortBy && { sortBy: filters.sortBy, sortOrder: filters.sortOrder }),
        });
        if (result) {
            setSummary({
                outstanding: result.summary.outstanding.amount,
                outstandingDelta: result.summary.outstanding.changePercentage,
                overdue: result.summary.overdue.amount,
                overdueDelta: result.summary.overdue.changePercentage,
                paid: result.summary.paid.amount,
                paidDelta: result.summary.paid.changePercentage,
                avgDaysToPay: result.summary.avgDaysToPay,
            });
            setBuckets(toBuckets(result.agingAnalysis.buckets));
            setPaidVsOutstanding({
                paid: result.agingAnalysis.totalPaid,
                outstanding: result.agingAnalysis.totalOutstanding,
            });
            setInvoiceRows(toInvoiceRows(result.invoices));
            setTotalRecords(result.pagination.totalRecords);
        }
        setIsLoadingAgingAnalysis(false);
    }, [id, role, filters]);

    useEffect(() => {
        handleFetchAgingAnalysis();
    }, [handleFetchAgingAnalysis]);

    const onTimePeriodChange = useCallback((timePeriod: string) => {
        setFilters(prev => ({ ...prev, timePeriod, page: 1 }));
    }, []);

    const onPageChange = useCallback((page: number, limit: number) => {
        setFilters(prev => ({ ...prev, page, limit }));
    }, []);

    const onSortChange = useCallback((sortBy: string | undefined, sortOrder: 'asc' | 'desc' | undefined) => {
        setFilters(prev => ({ ...prev, sortBy, sortOrder: sortOrder ?? 'desc', page: 1 }));
    }, []);

    const filteredBuckets =
        filters.timePeriod === 'all'
            ? buckets
            : buckets.filter(b => AGING_BUCKET_LABEL_TO_KEY[b.label] === filters.timePeriod);

    return {
        summary,
        filteredBuckets,
        filterOptions: AGING_FILTER_OPTIONS,
        paidVsOutstanding,
        invoiceRows,
        totalRecords,
        isLoadingAgingAnalysis,
        timePeriod: filters.timePeriod,
        page: filters.page,
        pageSize: filters.limit,
        onTimePeriodChange,
        onPageChange,
        onSortChange,
    };
};

export default useAgingAnalysis;
