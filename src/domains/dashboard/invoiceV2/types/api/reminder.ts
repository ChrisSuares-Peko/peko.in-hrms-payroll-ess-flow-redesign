export type ReminderApiRow = {
    id: number;
    days: number;
    actionDate: string;
    email: number;
    sms: number;
    notification: number;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    templet: Record<string, any>;
    invoicing: {
        id: number;
        invoiceNumber: string;
        prefix: string;
        dueDate: string;
        totalAmount: string;
        amountDue: string;
        status: string;
        name: string;
        email: string;
        currency: string;
    };
};

export type ReminderDashboardData = {
    rows: ReminderApiRow[];
    recordsTotal: number;
    stats: {
        pending: number;
        completed: number;
        cancelled: number;
    };
};

export type FetchReminderDashboardPayload = {
    userId: number;
    userType: string;
    page?: number;
    itemsPerPage?: number;
    status?: string;
    searchText?: string;
    sort?: 'ASC' | 'DESC';
    sortField?: string;
    from?: string;
    to?: string;
};
