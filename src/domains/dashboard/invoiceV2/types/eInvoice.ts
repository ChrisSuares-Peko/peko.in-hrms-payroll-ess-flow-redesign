export type EInvoiceStatKey = 'total' | 'active' | 'cancelled' | 'waybill';

export interface EInvoiceStatConfig {
    id: EInvoiceStatKey;
    label: string;
    bgColor: string;
    iconKey: EInvoiceStatKey;
}

export interface EInvoiceStatItem extends EInvoiceStatConfig {
    value: string;
    subLabel: string;
}

export interface EInvoiceDashboardStats {
    totalIrns: number;
    activeIrns: number;
    activeValueLabel: string;
    cancelled: number;
    eWaybills: number;
}

export interface EInvoiceDashboardApiResponse {
    totalCount: number;
    activeCount: number;
    activeTotalAmount: number;
    cancelledLast30: number;
    eWaybillActiveCount: number;
}

export interface EInvoiceQuickActionItem {
    id: string;
    title: string;
    description: string;
    onClick?: () => void;
}

export interface RecentEInvoiceRow {
    id: string;
    invoiceId: string;
    date: string;
    buyerName: string;
    buyerGstin: string;
    supply: string;
    amount: string;
    status: 'Active' | 'Cancelled';
}

export interface SessionInfo {
    isActive: boolean;
    timeLeft: string;
    progressPercent: number;
    gstin: string;
    clientId: string;
    expiresAt: string;
}
