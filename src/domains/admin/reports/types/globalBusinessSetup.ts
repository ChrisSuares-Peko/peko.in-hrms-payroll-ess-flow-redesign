export interface OrderDetails {
    id: number;
    amountInINR: string;
    paymentMode: string;
    status: string;
    orderResponse: string; // This is the full parsed object type
    transactionDate: string;
    corporateTxnId: string;
}

export type transactionResponse = {
    totalCount: number;
    result: OrderDetails[];
};

// src/types/pekoOrder.ts

export interface PlanFee {
    licenceFee: number;
    establishmentCard: number;
    visaFee: number;
}

export interface Plan {
    _id: string;
    name: string;
    description: string;
    activities: string[];
    shareHolderPricing: number;
    activitiesPricing: number;
    freeshareHolders: number;
    freeActivities: number;
    licenceType: string;
    logo: string;
    emirate: string;
    fee: PlanFee;
    featuresIncluded: string[];
    documentRequired: {
        passportCopy: boolean;
    };
    partner: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
    totalShareHolders: number;
    totalVisa: number;
}

export interface PaymentMethod {
    expiry: string;
    cardholderName: string;
    name: string;
    cardType: string;
    cardCategory: string;
    issuingOrg: string;
    issuingCountry: string;
    pan: string;
}

export interface PaymentGatewayResponse {
    orderReferenceNo: string;
    paymentReferenceNo: string;
    captureReferenceNo: string;
    amount: {
        currencyCode: string;
        value: number;
    };
    paymentMethod: PaymentMethod;
}

export interface PekoOrderData {
    plan: Plan;
    totalAmount: string; // "970.00"
    totalCost: number; // 9700
    selectedActivities: string[];
    totalShareHolders: number;
    payCashback: boolean;
    accessKey: string;
    pgAmount: string; // "970.0000"
    successUrl: string;
    failureUrl: string;
    isSaveCardDetails: boolean;
    couponCode: string;
    paymentRefId: string;
    paymentGatewayResponse: PaymentGatewayResponse;
}

// The overall structure you provided:
export interface PekoOrderResponse {
    data: PekoOrderData;
}

export interface StatusUpdatePayload {
    status?: string;
    remarks?: string;
    id?: string | number;
    corporateTxnId?: string;
}
