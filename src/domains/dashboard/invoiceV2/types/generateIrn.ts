export interface TransactionFormValues {
    supplyType: string;
    documentType: string;
    documentPrefix: string;
    documentNumber: string;
    documentDate: string;
    reverseCharge: boolean;
    igstOnIntra: boolean;
}

export interface SellerFormValues {
    sellerGstin: string;
    legalName: string;
    tradeName: string;
    address1: string;
    location: string;
    pinCode: string;
    state: string;
}

export interface BuyerFormValues {
    customerId?: string;
    buyerGstin: string;
    legalName: string;
    tradeName: string;
    phoneNumber: string;
    address1: string;
    location: string;
    pinCode: string;
    state: string;
    placeOfSupply: string;
}

export interface LineItem {
    id: string;
    description: string;
    hsnSac: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discount: number;
    gstRate: number;
}

export interface ItemsFormValues {
    items: LineItem[];
}

export interface GenerateIrnLineItem {
    description: string;
    hsnCode: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discount: number;
    taxableAmount: number;
    gstRate: number;
    igstAmount?: number;
    cgstAmount?: number;
    sgstAmount?: number;
    itemTotal: number;
}

export interface GenerateIrnPayload {
    invoiceId?: number;
    supplyType: string;
    docType: string;
    docNo: string;
    prefix: string;
    docDate: string;
    reverseCharge: boolean;
    igstOnIntraState: boolean;
    sellerDetails: {
        gstin: string;
        legalName: string;
        tradeName: string;
        addr1: string;
        location: string;
        pin: number;
        stateCode: string;
    };
    buyerDetails: {
        customerId?: number;
        gstin: string;
        legalName: string;
        tradeName: string;
        phoneNumber: string;
        addr1: string;
        location: string;
        pin: number;
        stateCode: string;
    };
    placeOfSupply: string;
    lineItems: GenerateIrnLineItem[];
    totalTaxableValue: number;
    totalIgst?: number;
    totalCgst?: number;
    totalSgst?: number;
    totalDiscount: number;
    totalAmount: number;
}

export interface ReviewLineItem {
    id: string;
    description: string;
    hsnSac: string;
    quantity: number;
    unit: string;
    discount: number;
    gstRate: number;
    taxableAmount: number;
    tax: number;
    itemTotal: number;
}

export interface StepHandle {
    submit: () => Promise<void>;
    getValues: () => unknown;
}

export interface GenerateIrnFormState {
    invoiceId?: string;
    transaction: TransactionFormValues;
    seller: SellerFormValues;
    buyer: BuyerFormValues;
    items: ItemsFormValues;
}

