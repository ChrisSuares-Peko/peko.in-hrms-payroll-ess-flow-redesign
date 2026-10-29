import { useCallback, useEffect, useRef, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppSelector } from '@src/hooks/store';

import {
    AccountingInsights,
    AccountsPayable,
    AccountsReceivable,
    BalanceSheet,
    BusinessHealth,
    CashFlowOverview,
    CashFlowStatement,
    FreeCashFlow,
    getAccountingInsights,
    getAccountingReportSummary,
    getAccountsPayable,
    getAccountsReceivable,
    getBalanceSheet,
    getBusinessHealth,
    getWorkingCapital,
    getCashFlowOverview,
    getCashFlowStatement,
    getFreeCashFlow,
    exportAccountsReceivable,
    exportBalanceSheet,
    exportGstSummary,
    exportProfitAndLoss,
    getBalanceSheetComparison,
    getGstSummary,
    getProfitAndLoss,
    getProfitAndLossComparison,
    GstSummary,
    ProfitAndLoss,
    ReportSummary,
    WorkingCapital,
} from '../api/reports';
import { ApiTransaction, exportTransactions, getTransactions } from '../api/transactions';

export interface ReportPeriod {
    fy?: number;
    quarter?: number;
    month?: number;
    category?: string;
    from?: string;
    to?: string;
}

export const useReportSummary = (period: ReportPeriod = {}) => {
    const { fy, quarter, month, category, from, to } = period;
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getAccountingReportSummary({
            userId,
            userType,
            fy,
            quarter,
            month,
            category,
            from,
            to,
        }).then(data => {
            if (!active) return;
            setSummary(data || null);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [userId, userType, fy, quarter, month, category, from, to]);

    return { summary, loading };
};

export const useProfitAndLoss = (period: ReportPeriod = {}) => {
    const { fy, quarter, month, from, to } = period;
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [pnl, setPnl] = useState<ProfitAndLoss | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getProfitAndLoss({ userId, userType, fy, quarter, month, from, to }).then(data => {
            if (!active) return;
            setPnl(data || null);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [userId, userType, fy, quarter, month, from, to]);

    return { pnl, loading };
};

export const useBalanceSheet = (period: ReportPeriod = {}) => {
    const { fy, quarter, month, from, to } = period;
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getBalanceSheet({ userId, userType, fy, quarter, month, from, to }).then(data => {
            if (!active) return;
            setBalanceSheet(data || null);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [userId, userType, fy, quarter, month, from, to]);

    return { balanceSheet, loading };
};

export const useCashFlowStatement = (period: ReportPeriod = {}) => {
    const { fy, quarter, month, from, to } = period;
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [cashFlowStatement, setCashFlowStatement] = useState<CashFlowStatement | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getCashFlowStatement({ userId, userType, fy, quarter, month, from, to }).then(data => {
            if (!active) return;
            setCashFlowStatement(data || null);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [userId, userType, fy, quarter, month, from, to]);

    return { cashFlowStatement, loading };
};

export const useCashFlowOverview = (period: ReportPeriod = {}) => {
    const { fy, quarter, month, from, to } = period;
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [cashFlowOverview, setCashFlowOverview] = useState<CashFlowOverview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getCashFlowOverview({ userId, userType, fy, quarter, month, from, to }).then(data => {
            if (!active) return;
            setCashFlowOverview(data || null);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [userId, userType, fy, quarter, month, from, to]);

    return { cashFlowOverview, loading };
};

export const useFreeCashFlow = (period: ReportPeriod = {}) => {
    const { fy, quarter, month, from, to } = period;
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [freeCashFlow, setFreeCashFlow] = useState<FreeCashFlow | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getFreeCashFlow({ userId, userType, fy, quarter, month, from, to }).then(data => {
            if (!active) return;
            setFreeCashFlow(data || null);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [userId, userType, fy, quarter, month, from, to]);

    return { freeCashFlow, loading };
};

export const useAccountsPayable = (period: ReportPeriod = {}) => {
    const { fy, quarter, month, from, to } = period;
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [accountsPayable, setAccountsPayable] = useState<AccountsPayable | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getAccountsPayable({ userId, userType, fy, quarter, month, from, to }).then(data => {
            if (!active) return;
            setAccountsPayable(data || null);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [userId, userType, fy, quarter, month, from, to]);

    return { accountsPayable, loading };
};

export const useGstSummary = (period: ReportPeriod = {}) => {
    const { fy, quarter, month, from, to } = period;
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [gstSummary, setGstSummary] = useState<GstSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getGstSummary({ userId, userType, fy, quarter, month, from, to }).then(data => {
            if (!active) return;
            setGstSummary(data || null);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [userId, userType, fy, quarter, month, from, to]);

    return { gstSummary, loading };
};

export const useWorkingCapital = (period: ReportPeriod = {}) => {
    const { fy, quarter, month, from, to } = period;
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [workingCapital, setWorkingCapital] = useState<WorkingCapital | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getWorkingCapital({ userId, userType, fy, quarter, month, from, to }).then(data => {
            if (!active) return;
            setWorkingCapital(data || null);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [userId, userType, fy, quarter, month, from, to]);

    return { workingCapital, loading };
};

export const useAccountingInsights = (from?: string, to?: string) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [insights, setInsights] = useState<AccountingInsights | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getAccountingInsights({ userId, userType, from, to }).then(data => {
            if (!active) return;
            setInsights(data || null);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [userId, userType, from, to]);

    return { insights, loading };
};

export const useAccountsReceivable = (period: ReportPeriod = {}) => {
    const { fy, quarter, month, from, to } = period;
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [ar, setAr] = useState<AccountsReceivable | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getAccountsReceivable({ userId, userType, fy, quarter, month, from, to }).then(data => {
            if (!active) return;
            setAr(data || null);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [userId, userType, fy, quarter, month, from, to]);

    return { ar, loading };
};

export const useBusinessHealth = (from?: string, to?: string) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [health, setHealth] = useState<BusinessHealth | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getBusinessHealth({ userId, userType, from, to }).then(data => {
            if (!active) return;
            setHealth(data || null);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [userId, userType, from, to]);

    return { health, loading };
};

export const useReportTransactions = (kind: 'Income' | 'Expense', period: ReportPeriod = {}) => {
    const { fy, quarter, month, from, to, category } = period;
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<ApiTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getTransactions({
            userId,
            userType,
            type: kind,
            itemsPerPage: 100,
            fy,
            quarter,
            month,
            from,
            to,
            category,
        }).then(data => {
            if (!active) return;
            setRows(data ? data.transactions : []);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [userId, userType, kind, fy, quarter, month, from, to, category]);

    return { rows, loading };
};

export const useReportExport = (kind: 'Income' | 'Expense', period: ReportPeriod = {}) => {
    const { fy, quarter, month, from, to, category } = period;
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [exporting, setExporting] = useState(false);

    const busyRef = useRef(false);

    const exportReport = useCallback(
        async (filename: string) => {
            if (busyRef.current) return;
            busyRef.current = true;
            setExporting(true);
            try {
                const data = await exportTransactions({
                    userId,
                    userType,
                    type: kind,
                    fy,
                    quarter,
                    month,
                    from,
                    to,
                    category,
                    format: 'excel',
                });
                if (data) {
                    const blob = new Blob([new Uint8Array(data.buffer.data)], {
                        type: data.fileType,
                    });
                    saveAs(blob, filename);
                }
            } finally {
                busyRef.current = false;
                setExporting(false);
            }
        },
        [userId, userType, kind, fy, quarter, month, from, to, category]
    );

    return { exporting, exportReport };
};

// Normalizes a PDF buffer that may arrive as a Node Buffer ({ data: [...] }),
// an index→byte map ({ "0": 37, ... }), or a raw byte array.
const toPdfBytes = (buffer: unknown): number[] => {
    if (Array.isArray(buffer)) return buffer as number[];
    if (buffer && typeof buffer === 'object') {
        const record = buffer as Record<string, unknown>;
        if (Array.isArray(record.data)) return record.data as number[];
        return Object.values(record).filter((v): v is number => typeof v === 'number');
    }
    return [];
};

// Downloads the 2-page P&L comparison PDF (current FY vs prior FY) for the given FY.
export const useProfitLossComparison = (fy: number) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [comparing, setComparing] = useState(false);
    const busyRef = useRef(false);

    const downloadComparison = useCallback(async () => {
        if (busyRef.current) return;
        busyRef.current = true;
        setComparing(true);
        try {
            const data = await getProfitAndLossComparison({ userId, userType, fy });
            if (data) {
                const bytes = toPdfBytes(data.pdfBuffer);
                const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
                saveAs(blob, data.fileName || 'PL-Comparison.pdf');
            }
        } finally {
            busyRef.current = false;
            setComparing(false);
        }
    }, [userId, userType, fy]);

    return { comparing, downloadComparison };
};

// Downloads the single-page detailed P&L PDF for the selected period.
export const useProfitLossExport = (period: ReportPeriod = {}) => {
    const { fy, quarter, month, from, to } = period;
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [exporting, setExporting] = useState(false);
    const busyRef = useRef(false);

    const exportPdf = useCallback(async () => {
        if (busyRef.current) return;
        busyRef.current = true;
        setExporting(true);
        try {
            const data = await exportProfitAndLoss({
                userId,
                userType,
                fy,
                quarter,
                month,
                from,
                to,
            });
            if (data) {
                const bytes = toPdfBytes(data.pdfBuffer);
                const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
                saveAs(blob, data.fileName || 'Profit-and-Loss.pdf');
            }
        } finally {
            busyRef.current = false;
            setExporting(false);
        }
    }, [userId, userType, fy, quarter, month, from, to]);

    return { exporting, exportPdf };
};

// Downloads the 2-page balance sheet comparison PDF (this FY-end vs prior FY-end).
export const useBalanceSheetComparison = (fy: number) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [comparing, setComparing] = useState(false);
    const busyRef = useRef(false);

    const downloadComparison = useCallback(async () => {
        if (busyRef.current) return;
        busyRef.current = true;
        setComparing(true);
        try {
            const data = await getBalanceSheetComparison({ userId, userType, fy });
            if (data) {
                const bytes = toPdfBytes(data.pdfBuffer);
                const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
                saveAs(blob, data.fileName || 'BS-Comparison.pdf');
            }
        } finally {
            busyRef.current = false;
            setComparing(false);
        }
    }, [userId, userType, fy]);

    return { comparing, downloadComparison };
};

// Downloads the single-page balance sheet PDF for the selected period.
export const useBalanceSheetExport = (period: ReportPeriod = {}) => {
    const { fy, quarter, month, from, to } = period;
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [exporting, setExporting] = useState(false);
    const busyRef = useRef(false);

    const exportPdf = useCallback(async () => {
        if (busyRef.current) return;
        busyRef.current = true;
        setExporting(true);
        try {
            const data = await exportBalanceSheet({
                userId,
                userType,
                fy,
                quarter,
                month,
                from,
                to,
            });
            if (data) {
                const bytes = toPdfBytes(data.pdfBuffer);
                const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
                saveAs(blob, data.fileName || 'Balance-Sheet.pdf');
            }
        } finally {
            busyRef.current = false;
            setExporting(false);
        }
    }, [userId, userType, fy, quarter, month, from, to]);

    return { exporting, exportPdf };
};

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Downloads the accounts receivable Excel file for the selected period.
export const useAccountsReceivableExport = (period: ReportPeriod = {}) => {
    const { fy, quarter, month, from, to } = period;
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [exporting, setExporting] = useState(false);
    const busyRef = useRef(false);

    const exportReport = useCallback(async () => {
        if (busyRef.current) return;
        busyRef.current = true;
        setExporting(true);
        try {
            const data = await exportAccountsReceivable({
                userId,
                userType,
                fy,
                quarter,
                month,
                from,
                to,
            });
            if (data) {
                const blob = new Blob([new Uint8Array(data.buffer.data)], { type: XLSX_MIME });
                saveAs(blob, data.fileName || 'Accounts-Receivable.xlsx');
            }
        } finally {
            busyRef.current = false;
            setExporting(false);
        }
    }, [userId, userType, fy, quarter, month, from, to]);

    return { exporting, exportReport };
};

// Downloads the single landscape-page GST summary PDF for the selected period.
export const useGstSummaryExport = (period: ReportPeriod = {}) => {
    const { fy, quarter, month, from, to } = period;
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [exporting, setExporting] = useState(false);
    const busyRef = useRef(false);

    const exportPdf = useCallback(async () => {
        if (busyRef.current) return;
        busyRef.current = true;
        setExporting(true);
        try {
            const data = await exportGstSummary({ userId, userType, fy, quarter, month, from, to });
            if (data) {
                const bytes = toPdfBytes(data.pdfBuffer);
                const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
                saveAs(blob, data.fileName || 'GST-Summary.pdf');
            }
        } finally {
            busyRef.current = false;
            setExporting(false);
        }
    }, [userId, userType, fy, quarter, month, from, to]);

    return { exporting, exportPdf };
};
