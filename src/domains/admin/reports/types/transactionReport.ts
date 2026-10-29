export type TransactionInfo = {
    id: number;
    transactionDate: string;
    customerName: string;
    service: string;
    serviceCategory: string;
    Amount: string;
    VAT: number | null;
    totalAmount: string;
    paymentGatewayCost: number | null;
    amountReceivable: string;
    partner: string;
    paymentMode: string | null;
    // Instrument used at the gateway (UPI / Credit Card / ...); null for wallet-only orders.
    paymentInstrument: string | null;
    credentialId: number;
    vendorCost: string;
    VATP: string;
    amountSurplus: string;
    partnerShare: string;
    actualEarnings: string;
};
export interface transactionResponse {
    recordsTotal: number;
    recordsFiltered?: number;
    data: TransactionInfo[];
}
