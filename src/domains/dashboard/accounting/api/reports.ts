import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export interface ReportCategory {
    category: string;
    total: number;
    count: number;
}

export interface ReportMonth {
    month: string;
    income: number;
    expense: number;
}

export interface ReportParty {
    party: string;
    total: number;
}

// A P&L line that also carries its share of total revenue.
export interface ReportPnlLine {
    amount: number;
    pctOfRevenue: number;
}

// Full P&L statement for the period. Ignores the category filter on purpose
// (category still narrows `byCategory`). Amounts are raw rupees; percentages
// are 1-decimal numbers.
export interface ReportPnl {
    totalRevenue: number;
    costOfGoodsSold: ReportPnlLine;
    grossProfit: number;
    operatingExpenses: ReportPnlLine;
    operatingProfit: number;
    otherIncome: ReportPnlLine;
    otherExpenses: ReportPnlLine;
    tax: ReportPnlLine;
    netProfit: number;
    margins: {
        grossMargin: number;
        operatingMargin: number;
        netMargin: number;
        expenseRatio: number;
    };
}

export interface ReportSummary {
    totals: {
        income: number;
        expense: number;
        net: number;
        incomeCount: number;
        expenseCount: number;
    };
    byCategory: { income: ReportCategory[]; expense: ReportCategory[] };
    monthly: ReportMonth[];
    topParties: { income: ReportParty[]; expense: ReportParty[] };
    // Present once the backend ships the P&L block; optional for back-compat.
    pnl?: ReportPnl;
}

export interface ReportSummaryParams extends UserPayload {
    // FY-based filtering (preferred): fy alone = full financial year;
    // fy + month = single calendar month within the FY; fy + quarter = fiscal quarter.
    fy?: number;
    quarter?: number;
    month?: number;
    // Partial, case-insensitive category search that narrows all aggregations.
    category?: string;
    // Legacy explicit range — used only when fy is absent.
    from?: string;
    to?: string;
}

export const getAccountingReportSummary = async (payload: ReportSummaryParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<ReportSummary> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/accounting/reports/summary`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export interface PnlLineItem {
    label: string;
    amount: number;
    count: number;
    isContra?: boolean;
}

export interface PnlSection {
    key: string;
    title: string;
    totalLabel: string;
    total: number;
    lineItems: PnlLineItem[];
}

export interface PnlSummary {
    totalRevenue: number;
    totalCogs: number;
    grossProfit: number;
    totalOperatingExpenses: number;
    operatingProfit: number;
    totalOtherIncome: number;
    totalOtherExpenses: number;
    profitBeforeTax: number;
    tax: number;
    netProfit: number;
}

export interface ProfitAndLoss {
    range: { from: string; to: string };
    sections: PnlSection[];
    summary: PnlSummary;
}

export const getProfitAndLoss = async (payload: ReportSummaryParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<ProfitAndLoss> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/accounting/reports/profit-and-loss`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

// 2-page P&L comparison PDF (page 1 = fy, page 2 = fy-1). The serializer may return
// the bytes as a Node Buffer ({ type, data }), an index→byte map ({ "0": 37, ... }),
// or a raw array — the frontend normalizes all three before download.
export interface ReportPdfResult {
    pdfBuffer: { type?: string; data?: number[] } | Record<string, number> | number[];
    fileName: string;
}

export const getProfitAndLossComparison = async (payload: ReportSummaryParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<ReportPdfResult> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/accounting/reports/compare`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

// Single-page detailed P&L PDF for the selected period (same query as profit-and-loss).
export const exportProfitAndLoss = async (payload: ReportSummaryParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<ReportPdfResult> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/accounting/reports/profit-and-loss/export`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export interface InsightsSource {
    account: string;
    total: number;
    count: number;
}

export interface InsightsAccount {
    id: number | null;
    name: string;
    inflow: number;
    outflow: number;
}

export interface AccountingInsights {
    period: { from: string | null; to: string | null };
    totals: ReportSummary['totals'];
    byCategory: ReportSummary['byCategory'];
    topParties: ReportSummary['topParties'];
    monthly: ReportMonth[];
    sources: InsightsSource[];
    attention: {
        needsReview: number;
        recurringCount: number;
        uncategorized: number;
        totalCount: number;
    };
    recurring: { committed: number; items: { name: string; total: number }[]; moreCount: number };
    accounts: InsightsAccount[];
}

export const getAccountingInsights = async (payload: ReportSummaryParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<AccountingInsights> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/accounting/reports/insights`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export type ArStatus = 'paid' | 'unpaid' | 'partial' | 'overdue';

export interface ArInvoice {
    customer: string;
    invoiceNo: string;
    invoiceDate: string;
    dueDate: string | null;
    amount: number;
    paid: number;
    outstanding: number;
    status: ArStatus;
    pastDue: boolean;
}

export interface ArAgingRow {
    customer: string;
    d0_30: number;
    d31_60: number;
    d61_90: number;
    d90: number;
}

export type ArAgingTotals = Omit<ArAgingRow, 'customer'>;

export interface AccountsReceivable {
    period: { from: string | null; to: string | null };
    invoices: ArInvoice[];
    totals: { amount: number; paid: number; outstanding: number; count: number };
    aging: { rows: ArAgingRow[]; totals: ArAgingTotals };
    distribution: { customer: string; amount: number; tone: 'danger' | 'warning' | 'neutral' }[];
    trend: { month: string; value: number }[];
    collection: {
        collectionRate: number;
        avgDaysOutstanding: number;
        overdueAmount: number;
        upcomingAmount: number;
    };
    breakdown: { collected: number; outstanding: number; overdue: number };
}

export const getAccountsReceivable = async (payload: ReportSummaryParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<AccountsReceivable> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/accounting/reports/accounts-receivable`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

// Accounts receivable Excel export for the selected period (same query as
// accounts-receivable). Returns a Node Buffer of the .xlsx file, like the
// transactions export.
export const exportAccountsReceivable = async (payload: ReportSummaryParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<{
            buffer: { data: number[] };
            fileType: string;
            fileName?: string;
        }> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/accounting/reports/accounts-receivable/export/excel`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export interface BusinessHealthMetric {
    key: string;
    label: string;
    value: string;
    percent: number;
    pending: boolean;
}

export interface BusinessHealth {
    period: { from: string | null; to: string | null };
    score: number;
    metrics: BusinessHealthMetric[];
}

export const getBusinessHealth = async (payload: ReportSummaryParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<BusinessHealth> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/accounting/reports/business-health`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export interface BalanceSheetLineItem {
    head: string;
    amount: number;
    derived?: boolean;
    isContra?: boolean;
}

export interface BalanceSheetSummary {
    totalAssets: number;
    totalLiabilities: number;
    liabilitiesPctOfAssets: number;
    totalEquity: number;
    equityPctOfAssets: number;
    workingCapital: number;
    workingCapitalTone: string;
}

export interface BalanceSheetAssets {
    currentAssets: BalanceSheetLineItem[];
    totalCurrentAssets: number;
    nonCurrentAssets: BalanceSheetLineItem[];
    totalNonCurrentAssets: number;
    totalAssets: number;
}

export interface BalanceSheetLiabilitiesAndEquity {
    currentLiabilities: BalanceSheetLineItem[];
    totalCurrentLiabilities: number;
    longTermLiabilities: BalanceSheetLineItem[];
    totalLongTermLiabilities: number;
    equity: BalanceSheetLineItem[];
    totalEquity: number;
    totalLiabilitiesAndEquity: number;
}

export interface BalanceSheetStatement {
    assets: BalanceSheetAssets;
    liabilitiesAndEquity: BalanceSheetLiabilitiesAndEquity;
}

export interface BalanceSheetRatio {
    // null when the ratio can't be computed (e.g. debt-to-equity with zero equity).
    value: number | null;
    tone: string;
}

export interface BalanceSheetWorkingCapitalAnalysis {
    workingCapital: BalanceSheetRatio;
    currentRatio: BalanceSheetRatio;
    quickRatio: BalanceSheetRatio;
    debtToEquity: BalanceSheetRatio;
    currentAssetsVsCurrentLiabilities: {
        currentAssets: number;
        currentLiabilities: number;
    };
}

export interface BalanceSheetCompositionItem {
    label: string;
    amount: number;
    percent: number;
}

export interface BalanceSheetInsight {
    key: string;
    title: string;
    text: string;
}

export interface BalanceSheetTrendPoint {
    month: string;
    assets: number;
    liabilities: number;
    equity: number;
}

export interface BalanceSheet {
    asOf: string;
    summary: BalanceSheetSummary;
    statement: BalanceSheetStatement;
    workingCapitalAnalysis: BalanceSheetWorkingCapitalAnalysis;
    assetComposition: BalanceSheetCompositionItem[];
    liabilityComposition: BalanceSheetCompositionItem[];
    trend: BalanceSheetTrendPoint[];
    insights: BalanceSheetInsight[];
}

export const getBalanceSheet = async (payload: ReportSummaryParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<BalanceSheet> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/accounting/reports/balance-sheet`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

// Single-page balance sheet PDF for the selected period (same query as balance-sheet).
export const exportBalanceSheet = async (payload: ReportSummaryParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<ReportPdfResult> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/accounting/reports/balance-sheet/export`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

// 2-page balance sheet comparison PDF (this FY-end vs prior FY-end).
export const getBalanceSheetComparison = async (payload: ReportSummaryParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<ReportPdfResult> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/accounting/reports/balance-sheet/compare`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export type CashFlowSectionKey = 'operating' | 'investing' | 'financing';

export interface CashFlowLineItem {
    head: string;
    amount?: number;
    isSubheading?: boolean;
}

export interface CashFlowStatementSection {
    key: CashFlowSectionKey;
    title: string;
    lineItems: CashFlowLineItem[];
    net: { label: string; amount: number };
}

export interface CashFlowStatementSummary {
    openingBalance: number;
    netCashFlow: number;
    closingBalance: number;
}

export interface CashFlowStatement {
    range: { from: string; to: string };
    method: string;
    sections: CashFlowStatementSection[];
    summary: CashFlowStatementSummary;
}

export const getCashFlowStatement = async (payload: ReportSummaryParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<CashFlowStatement> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/accounting/reports/cash-flow-statement`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export interface CashFlowOverviewMetric {
    // Net for the period in rupees, signed (investing is usually negative).
    value: number;
    // % change vs the comparable prior period; null when there is no prior period.
    deltaPercent: number | null;
    up: boolean;
}

export interface CashFlowOverviewSummary {
    operating: CashFlowOverviewMetric;
    investing: CashFlowOverviewMetric;
    financing: CashFlowOverviewMetric;
    netCashFlow: CashFlowOverviewMetric;
    closingBalance: CashFlowOverviewMetric;
}

export interface CashFlowTrendPoint {
    month: string;
    operating: number;
    investing: number;
    financing: number;
}

export interface CashBalancePoint {
    month: string;
    balance: number;
}

export interface CashFlowOverview {
    range: { from: string; to: string };
    summary: CashFlowOverviewSummary;
    trend: CashFlowTrendPoint[];
    balanceProgression: CashBalancePoint[];
}

export const getCashFlowOverview = async (payload: ReportSummaryParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<CashFlowOverview> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/accounting/reports/cash-flow-overview`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export interface FreeCashFlowCapexItem {
    label: string;
    amount: number;
    percent: number;
}

export interface FreeCashFlowTrendPoint {
    month: string;
    operatingCashFlow: number;
    capex: number;
    freeCashFlow: number;
}

export interface FreeCashFlow {
    range: { from: string; to: string };
    // value signed rupees; pctOfOperating null when Operating CF is 0.
    freeCashFlow: { value: number; pctOfOperating: number | null };
    capex: { total: number; items: FreeCashFlowCapexItem[] };
    // value (%) null when Operating CF is 0.
    capexRatio: { value: number | null };
    // Monthly series for the whole range (zeros for empty months); `month` is YYYY-MM.
    trend: FreeCashFlowTrendPoint[];
}

export const getFreeCashFlow = async (payload: ReportSummaryParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<FreeCashFlow> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/accounting/reports/free-cash-flow`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export interface GstRateBreakupRow {
    rate: number;
    taxable: number;
    outputGst: number;
    itc: number;
    cgst: number;
    sgst: number;
    igst: number;
    netPayable: number;
}

export interface GstTotals {
    taxableTurnover: number;
    outputGst: number;
    itc: number;
    netPayable: number;
    itcUtilisationPct: number;
}

export interface GstMonthlyPoint {
    month: string;
    taxable: number;
    outputGst: number;
    itc: number;
    netPayable: number;
}

export type GstReturnStatus = 'filed' | 'due' | 'overdue';

export interface GstReturn {
    type: 'GSTR-1' | 'GSTR-3B';
    // Tax period, YYYY-MM.
    period: string;
    dueDate: string;
    status: GstReturnStatus;
    filedOn: string | null;
}

export interface GstSummary {
    range: { from: string; to: string };
    registration: { gstin: string | null; pan: string | null };
    rateBreakup: GstRateBreakupRow[];
    totals: GstTotals;
    monthly: GstMonthlyPoint[];
    filing: { dueDate: string; returns: GstReturn[] };
}

export const getGstSummary = async (payload: ReportSummaryParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<GstSummary> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/accounting/reports/gst-summary`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

// Single landscape-page GST summary PDF for the selected period (same query as gst-summary).
export const exportGstSummary = async (payload: ReportSummaryParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<ReportPdfResult> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/accounting/reports/gst-summary/export`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export type ApBillStatus = 'paid' | 'unpaid' | 'partial' | 'overdue';

export interface ApBill {
    vendor: string;
    billNo: string;
    billDate: string;
    dueDate: string;
    amount: number;
    paid: number;
    outstanding: number;
    status: ApBillStatus;
    pastDue: boolean;
}

export interface ApAgingRow {
    vendor: string;
    d0_30: number;
    d31_60: number;
    d61_90: number;
    d90: number;
}

export interface ApDistribution {
    vendor: string;
    amount: number;
    tone: 'danger' | 'warning' | 'neutral';
}

export interface AccountsPayable {
    range: { from: string; to: string };
    bills: ApBill[];
    aging: { rows: ApAgingRow[] };
    distribution: ApDistribution[];
    trend: { month: string; value: number }[];
    payment: {
        paymentRate: number;
        avgDaysPayable: number;
        overdueAmount: number;
        dueSoonAmount: number;
    };
    breakdown: { paid: number; outstanding: number; overdue: number };
}

export const getAccountsPayable = async (payload: ReportSummaryParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<AccountsPayable> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/accounting/reports/accounts-payable`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export interface WorkingCapitalAging {
    d0_30: number;
    d31_60: number;
    d61_90: number;
    d90: number;
}

export interface WorkingCapitalSide {
    totalOutstanding: number;
    aging: WorkingCapitalAging;
}

export interface WorkingCapital {
    range: { from: string; to: string };
    // Days; null when there is no AR / AP data to derive them from.
    metrics: { dso: number | null; dpo: number | null; ccc: number | null };
    receivables: WorkingCapitalSide;
    payables: WorkingCapitalSide;
}

export const getWorkingCapital = async (payload: ReportSummaryParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<WorkingCapital> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/accounting/reports/working-capital`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};
