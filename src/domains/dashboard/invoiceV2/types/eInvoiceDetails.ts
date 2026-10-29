export interface CancelIrnValues {
    cancelReason: string;
    remarks: string;
}

export interface CancelEWaybillValues {
    cancelReason: string;
}

export interface EWaybillData {
    id: string;
    status: string;
    ewbNumber: string;
    generatedOn: string;
    transportMode: string;
    vehicleNo: string;
    transDocNo: string;
    distance: string;
    transporter: string;
}

export interface EInvoiceDetailView {
    id: string;
    gstin: string;
    status: 'ACTIVE' | 'CANCELLED';
    docType: string;
    supplyType: string;
    igstOnIntra: boolean;
    useIgst: boolean;
    dated: string;
    generated: string;
    irnHash: string;
    irnAck: string;
    ackDate: string;
    signedJws: string;
    signedQRCode: string;
    createdAt: string;
    totalTaxable: string;
    totalAmount: string;
    cancelledDate: string | null;
    cancelReason: string | null;
    cancelRemark: string | null;
    transaction: { label: string; value: string }[];
    seller: { label: string; value: string }[];
    buyer: { label: string; value: string }[];
    lineItems: EInvoiceDetailLineItem[];
    eWaybill: (EWaybillData & { createdAt: string }) | null;
}

export interface EInvoiceDetailLineItem {
    id: string;
    description: string;
    hsnSac: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discount: number;
    gstRate: number;
    taxableAmount: number;
    tax: number;
    itemTotal: number;
}

// API response types
export interface EInvoiceDetailsApiResponse {
    id: number;
    irn: string;
    ackNo: string;
    ackDt: string;
    signedInvoice: string;
    signedQRCode: string;
    supplyType: string;
    docType: string;
    docNo: string;
    docDate: string;
    reverseCharge: string;
    igstOnIntraState: string;
    sellerGstin: string;
    sellerDetails: {
        pin: number;
        addr1: string;
        gstin: string;
        location: string;
        legalName: string;
        stateCode: string;
        tradeName: string;
    };
    buyerGstin: string;
    buyerDetails: {
        pin: number;
        addr1: string;
        gstin: string;
        location: string;
        legalName: string;
        stateCode: string;
        tradeName: string;
    };
    placeOfSupply: string;
    lineItems: {
        unit: string;
        gstRate: number;
        hsnCode: string;
        discount: number;
        quantity: number;
        unitPrice: number;
        description: string;
        taxableAmount: number;
        cgstAmount: number;
        sgstAmount: number;
        igstAmount: number;
        itemTotal: number;
    }[];
    totalTaxableValue: string;
    totalAmount: string;
    status: string;
    cancelledDate: string | null;
    cancelReason: string | null;
    cancelRemark: string | null;
    createdAt: string;
    eWaybill: {
        id: number;
        ewbNo: string;
        ewbDt: string;
        distance: number;
        transMode: string;
        transId: string;
        transName: string;
        vehNo: string;
        transDocNo: string;
        status: string;
        cancelledDate: string | null;
        cancelReason: string | null;
        createdAt: string;
    } | null;
    subCorporateUser: { id: number | null; name: string | null };
}
