export const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'UPI'].map(v => ({
    label: v,
    value: v,
}));

export const BANK_NAMES: Record<string, string> = {
    HDFC: 'HDFC Bank',
    ICIC: 'ICICI Bank',
    SBIN: 'State Bank of India',
    KKBK: 'Kotak Mahindra Bank',
    UTIB: 'Axis Bank',
    PUNB: 'Punjab National Bank',
    BARB: 'Bank of Baroda',
    CNRB: 'Canara Bank',
    IOBA: 'Indian Overseas Bank',
    YESB: 'Yes Bank'
};
