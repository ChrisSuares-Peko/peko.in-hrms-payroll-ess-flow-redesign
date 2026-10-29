export interface DueThisWeekItem {
    id: number;
    invoiceNumber: string;
    name: string;
    dueDate: string;
    amountDue: number;
    status: string;
}

export interface TopCustomerItem {
    name: string;
    totalPaid: string;
}

export interface RecentActivityItem {
    type: string;
    label: string;
    customerName: string;
    invoiceNumber: string;
    amount: number;
    timestamp: string;
}

export interface DueThisWeekResponse {
    dueThisWeek: DueThisWeekItem[];
    recordsTotal: number;
}

export interface TopCustomersResponse {
    topCustomers: TopCustomerItem[];
}

export interface RecentActivityResponse {
    recentActivity: RecentActivityItem[];
    recordsTotal: number;
}

export interface PaymentDashboardDetailsData {
    dueThisWeek: DueThisWeekItem[];
    topCustomers: TopCustomerItem[];
    recentActivity: RecentActivityItem[];
}

export interface PaymentDashboardData {
    totalReceived: number;
    vsLastMonthReceived?: number;
    outstanding: number;
    outstandingCount: number;
    overdue: number;
    overdueCount: number;
    thisMonth: number;
    vsLastMonthThisMonth?: number;
    collectionHealth: {
        total?: number;
        collectedPercent: number;
        outstandingPercent: number;
        overduePercent: number;
    };
}

export type RevenueCollectionHealthType = {
    label: string;
    pct: number;
    amount: number;
    color: string;
};

export type RankingData = {
    id: string | number;
    name: string;
    totalRevenue?: number;
    transactionCount?: number;
    changePercent?: number;
    percentOfTotal?: number;
    dueDate?: string;
    amount?: number;
    subtitle?: string;
    time?: string;
};

export type RankingVariant = 'revenue' | 'txn' | 'due' | 'activity' | 'paying';

export interface PaymentTransactionItem {
    key: string;
    source: string;
    dateTime: string;
    transactionId: string;
    amount: number;
    status: string;
    reference: string;
    prefix?: string;
    invoiceNumber?: string;
    invoiceId?: number;
    customerName: string | null;
    customerPhone: string | null;
    paymentMethod: string | null;
}

export interface PaymentTransactionsResponse {
    transactions: PaymentTransactionItem[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface PaymentTimelineStep {
    label: string;
    time: string;
    color: string;
}

export interface PaymentDetailsData {
    transactionId: string;
    invoiceRef: string;
    paymentMethod: string;
    dateTime: string;
    transactionRef: string;
    status: string;
    amount: number;
    notes: string;
    invoiceId: number;
    invoiceStatus: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerGst: string;
    customerAddress: string;
    customerPincode: string;
    customerCountry: string;
    timeline: PaymentTimelineStep[];
}

interface PaymentLinkRaw {
    transactionId: string;
    decentro_txn_id: string;
    dateTime: string;
    amount: string;
    status: string;
    reference: string;
    customerName: string | null;
    customerPhone: string | null;
    timeline: PaymentTimelineStep[];
}

interface InvoiceRaw {
    invoiceNumber: string;
    paymentMode: string;
    id: number;
    status: string;
    name: string;
    email: string;
    phoneNumber: string;
    gstNumber: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    totalAmount: string;
    notes: string;
}

export interface PaymentTransactionDetailsResponse {
    paymentLink: PaymentLinkRaw;
    invoice: InvoiceRaw;
}

export interface GetPaymentTransactionsPayload {
    page: number;
    limit: number;
    sort: 'ASC' | 'DESC';
    sortField: string;
    startDate: string;
    endDate: string;
    status: string;
    paymentMethod: string;
    searchText: string;
}

export type ScheduledReminderRow = {
    id: string;
    invoiceId: string;
    customer: string;
    outstanding: number;
    dueDate: string;
    reminderStatus: 'Sent' | 'Scheduled' | 'No response';
    nextReminder: string;
}
export type ReminderTiming = 'before' | 'on_due' | 'after';

export interface ReminderRule {
    id: string;
    apiId: number;
    title: string;
    subtitle: string;
    timing: ReminderTiming;
    days: number;
    isEnabled: boolean;
    emailEnabled: boolean;
    whatsappEnabled: boolean;
    emailTemplate: string;
    whatsappTemplate: string;
}

export interface PaymentTrackingFilters {
    searchText: string;
    page: number;
    limit: number;
    sort: 'ASC' | 'DESC';
    sortField: string;
    startDate: string;
    endDate: string;
    status: string;
    paymentMethod: string;
}

export type PaymentRow = {
    id: string;
    paymentId: string;
    customer: string;
    invoiceRef: string;
    amount: number;
    method: string;
    date: string;
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    invoiceId?: number;
};

export interface ReminderRuleResponse {
    id: number;
    corporateUserId: number;
    ruleType: 'BEFORE' | 'ON_DUE' | 'AFTER' | 'SECOND_OVERDUE';
    days: number;
    enabled: boolean;
    sendEmail: boolean;
    sendWhatsApp: boolean;
    emailTemplate: { body: string; subject: string } | null;
    whatsappTemplate: { body: string } | null;
    createdAt: string;
    updatedAt: string;
}

export interface GetReminderRulesResponse {
    automaticReminders: boolean;
    rules: ReminderRuleResponse[];
}
