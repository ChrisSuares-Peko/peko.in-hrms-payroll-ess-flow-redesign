export type FetchState = 'idle' | 'fetching' | 'loaded' | 'regenerating' | 'regen-polling';

export interface Gstr2bB2baRow {
    id: string;
    supplierName: string;
    gstin: string;
    amendedInvoiceNo: string;
    amendedDate: string;
    originalInvoice: string;
    itc: number;
    status: MatchStatus;
    origTaxable: number;
    amendTaxable: number;
    origIgst: number;
    amendIgst: number;
    origCgst: number;
    amendCgst: number;
    origSgst: number;
    amendSgst: number;
}

export interface Gstr2bCdnRow {
    id: string;
    supplierName: string;
    gstin: string;
    noteNo: string;
    noteDate: string;
    noteType: string;
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    itc: number;
    status: MatchStatus;
}

export interface Gstr2bImpgRow {
    id: string;
    supplierName: string;
    billNo: string;
    billDate: string;
    portCode: string;
    taxable: number;
    igst: number;
    cess: number;
    status: MatchStatus;
}

export interface Gstr2bIsdRow {
    id: string;
    isdName: string;
    isdGstin: string;
    docType: string;
    docNo: string;
    docDate: string;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
    status: MatchStatus;
}

export interface Gstr2bTdsRow {
    id: string;
    deductorGstin: string;
    deductorName: string;
    tdsAmount: number;
    period: string;
    cashLedgerCredit: number;
    status: MatchStatus;
}

export interface Gstr2bTcsRow {
    id: string;
    operatorName: string;
    ecoGstin: string;
    suppliesValue: number;
    tcsCollected: number;
    period: string;
    status: MatchStatus;
}

export interface Gstr2bAmdRow {
    id: string;
    originalDoc: string;
    amendmentType: string;
    changedBy: string;
    changeDate: string;
    whatChanged: string;
    itcImpact: number;
    itcSign: '+' | '-';
}
export type MatchStatus = 'Matched' | 'Unmatched' | 'Amended';
export type MatchFilter = 'all' | 'Matched' | 'Unmatched' | 'Amended';
export type TabKey = 'B2B' | 'B2BA' | 'CDN' | 'IMPG' | 'ISD' | 'TDS' | 'TCS' | 'AMD';

export interface Gstr2bRow {
    id: string;
    supplierName: string;
    gstin: string;
    invoiceNo: string;
    invoiceDate: string;
    date: string;
    taxable: number;
    itc: number;
    status: MatchStatus;
    itcAvailable: boolean;
    reverseCharge: boolean;
    placeOfSupply: string;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
    totalTax: number;
    invoiceValue: number;
}
