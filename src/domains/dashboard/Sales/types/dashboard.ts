export interface RecentTransactionItem {
    id: number;
    documentType: 'INVOICE' | 'QUOTATION' | 'SALES_ORDER' | 'AGREEMENT';
    invoiceNumber: string;
    customerName: string;
    totalAmount: number;
    createdAt: string;
}

export interface RecentTransactionsResponse {
    recentTransactions: RecentTransactionItem[];
    recordsTotal: number;
}

export interface SalesDashboardData {
    customersCount: number;
    quotationsCount: number;
    agreementsCount: number;
    salesOrdersCount: number;
    totalPaymentsAmount: number;
    invoicesCount: number;
}

export type DashboardStats = {
    totalInvoiceAmount: number;
    totalDueAmount: number;
    vsLastMonthPercent: number;
    totalInvoices: number;
    totalPaid: number;
};

export type QuickAccessItem = {
    id: string;
    label: string;
    icon: string;
    onClick?: () => void;
    disabled?: boolean;
};
