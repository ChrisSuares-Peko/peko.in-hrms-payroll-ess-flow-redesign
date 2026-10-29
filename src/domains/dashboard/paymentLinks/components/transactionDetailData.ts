export interface TransactionData {
    transactionId: string;
    dateTime: string;
    amount: string;
    paymentMode: string;
    status: 'Successful' | 'Pending' | 'Failed';
    reference: string;
    utrNumber: string;
    customerName: string;
    customerPhone: string;
    paymentAmount: string;
    transactionCharges: string;
    settlementAmount: string;
    paymentLink:string;
    timeline: { label: string; time: string; color: string }[];
}

export const statusColors: Record<string, string> = {
    Successful: '#16A34A',
    Pending: '#D97706',
    Failed: '#DC2626',
};


