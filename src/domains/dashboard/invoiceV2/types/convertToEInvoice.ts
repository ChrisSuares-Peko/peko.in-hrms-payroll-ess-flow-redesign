export interface ConvertToEInvoiceRow {
    id: string;
    invoiceId: string;
    date: string;
    buyerName: string;
    buyerGstin: string;
    amount: string;
    status: 'Paid' | 'Pending' | 'Overdue' | 'Refund Due' | 'Refunded';
}
