export type ReminderChannel = 'email' | 'sms';

export type ReminderFilters = {
    searchText: string;
    page: number;
    itemsPerPage: number;
    sort: 'ASC' | 'DESC';
    sortField: string;
    startDate: string;
    endDate: string;
    status: string;
};

export type ReminderStats = {
    pending: number;
    completed: number;
    cancelled: number;
};

export type ReminderRow = {
    id: number;
    scheduledDate: string;
    invoiceNo: string;
    customerName: string;
    customerEmail: string;
    amountDue: number;
    totalAmount: number;
    currency: string;
    channels: ReminderChannel[];
    invoiceStatus: string;
    status: 'Pending' | 'Completed' | 'Cancelled';
};
