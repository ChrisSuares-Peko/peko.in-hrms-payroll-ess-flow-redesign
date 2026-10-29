export type DashboardStats = {
    totalInvoices: number;
    totalSales: number;
    totalReceived: number;
    outstandingAmount: number;
    salesVsLastMonthPercent: number;
    receivedVsLastMonthPercent: number;
};

export type RecentInvoice = {
    id: number;
    name: string;
    date: string;
    amount: number;
    isCredit: boolean;
};

export type QuickAccessItem = {
    id: string;
    label: string;
    icon: string;
    onClick?: () => void;
    disabled?: boolean;
};
