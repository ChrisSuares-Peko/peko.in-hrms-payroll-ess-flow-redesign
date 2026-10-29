import { UserPayload } from '@customtypes/general';

export type PaymentGeneric = {
    accessKey?: string;
    successUrl?: string;
    failureUrl?: string;
    amount?: number | string;
    total?: number;
    [key: string]: number | string | Object | undefined | null;
    outbount?: {
        amount: number;
    };
    // Declared so it is an object, not the index signature's union, which is not spreadable.
    inbount?: {
        amount: number;
    } | null;
    billerId?: string;
};

export type CardPaymentResponse = {
    redirectLink: string;
};

export type WalletBalanceResponse = {
    balance: string | number;
    credentialId: number;
    'credential.name': string;
    'credential.role': string;
};
export interface BulkPaymentDataItem {
    account: string;
    transactionId: string;
    providerTransactionId: string;
    amount: number;
    lastBalance: string;
    type: string;
    flexiKey: string;
    typeKey: number;
    corporateTxnId: number;
    batchId: number;
    accessKey: string;
    isLastItem: boolean;
    paymentStatus: string;
}
export type PaymentResponse = {
    pending: boolean;
    processing?: boolean;
    failed?: boolean;
    // Corporate card leg: an HTTP 200 decline, with the card's reason.
    declined?: boolean;
    cardStatus?: string;
    reason?: string;
    details: {
        message: string;
    };
    corporateFinalBalance: string;
    corporateCashback: string;
    orderId: number;
    datetime: string;
    amount: number;
    corporateTxnId: number;
    bulkPaymentData: BulkPaymentDataItem[];
    successUrl?: string;
    orderNumber?: string;
    order_number?: string;
    // Set only on the gateway failure path, from the error envelope.
    responseCode?: string;
    failureMessage?: string;
};

// Router state for the payment failure page; '005' means the vendor session expired.
export type PaymentFailureState = {
    responseCode?: string;
    errorMessage?: string;
    // Set by legs whose errorMessage is written for the customer (corporate card declines).
    showReason?: boolean;
};

export type PaytmCreateOrderPayload = {
    pgAmount: number;
    successUrl?: string;
    failureUrl?: string;
    accessKey?: string;
    amount?: number | string;
    [key: string]: number | string | Object | undefined | null;
    couponCode?: string;
};

export type PaytmCreateOrderResponse = {
    amount: string;
    orderId: number;
    session_id: string;
    details?: {
        message: string;
    };
};

export type RazorpayCreateOrderResponse = {
    amount: number;
    orderId: number;
    razorpayOrderId: string;
    keyId: string;
    currency: string;
    prefill: { name: string; email: string; contact: string };
};

export type PgProvider = 'CASHFREE' | 'CCAVENUE' | 'RAZORPAY';

export enum PaymentMode {
    PAYTM = 'PAYTM',
    card = 'CARD',
    wallet = 'PEKO-WALLET',
    cashback = 'CASHBACK',
    CCAVENUE = 'CCAVENUE',
    MSWIPE = 'MSWIPE',
    corporateCard = 'CORPORATE-CARD',
    empty = '',
}

export type CCavenueInitiateResponse = {
    iframeUrl: string;
};

export type MswipeInitiateResponse = {
    amount: string;
    orderId: string;
    paymentUrl: string;
};

export type TransactionDetailsPayload = {
    transactionId: string;
};
export type TransactionDetailsResponse = {
    id: number;
    corporateTxnId: string;
    operatorId: string;
    providerId: string;
    transactionDate: string;
    accountNo: string;
    amountInINR: string;
    baseAmount: string;
    paymentMode: string;
    orderResponse: string;
    paymentModeResponse: string;
    surcharge: string;
    baseCurrency: string;
    exchangeRate: string;
    status: string;
    message: string;
    ecomOrderStatus: string;
    workspaceOrderStatus: string;
    shipmentStatus: any[];
    createdAt: string;
    updatedAt: string;
    serviceOperatorId: number;
    credentialId: number;
    serviceOperator: {
        serviceProvider: string;
        accessKey: string;
    };
    couponData: {
        discountAmount: number;
    };
};
interface BillPaymentParam {
    paramName: string | null;
    paramValue: string | null;
}
export interface PaymentResultTableProps {
    paymentData: {
        transactionDate?: string;
        corporateTxnId?: string;
        serviceProvider?: string;
        amount?: number | string;
        paymentMode?: string;
        billPaymentParams?: BillPaymentParam[] | null;
        mobileNo?: string;
        amountInINR?: number;
        couponDiscount?: number;
    };
}

export type earningCashbackPayload = {
    billAmount: number;
    accessKey: string;
};

export type UsePaymentApiProps = {
    setCheckoutJsInstance: React.Dispatch<React.SetStateAction<any>>;
    checkoutJsInstance: any;
    successBasePath?: string;
};

export type BulkPaymentResp = {
    account: string;
    amount: number;
    surcharge: number;
    corporateTxnId: number;
    paymentStatus: string;
    batchId: number;
    serviceName?: string;
};

export type BulkPaymentStatusResp = {
    bulkPaymentStatus: {
        status: string;
        corporateTxnId: number;
    }[];
};

export type CheckAgencyBalance = UserPayload & {
    amount: string | number;
    passengers: [];
    traceId: string;
};

export type AgencyBalanceResponse = {};

export type GatewayProviderCode = 'CASHFREE' | 'CCAVENUE' | 'MSWIPE' | 'RAZORPAY';

export type GatewayProvider = {
    pgProvider: string;
    name: string;
    code?: PgProvider;
};

export type CorporateCardSummary = {
    cardIssuanceId: number;
    last4: string | null;
    maskedCardNumber: string | null;
    cardType: string;
    cardState: string;
    cardLimit: number | null;
    perTxnLimit: number | null;
    limitFrequency: string | null;
    spent: number;
    remaining: number | null;
    walletBalance: number;
};

export type CorporateCardPaymentOption = {
    available: boolean;
    reason: string | null;
    card: CorporateCardSummary | null;
    limits: {
        limitPerTransaction: number;
        limitPerDay: number;
        limitPerMonth: number;
    } | null;
    usage: {
        today: number;
        month: number;
    };
};

export type PaymentMethodsResponse = {
    isCouponApplicable: boolean;
    // Absent until the backend that serves the corporate card leg is deployed.
    corporateCard?: CorporateCardPaymentOption;
    gateway: {
        available: boolean;
        // serviceOperators.pgGateway — null keeps the default (Cashfree / static CCAvenue set)
        limits: {
            limitPerTransaction: number;
            limitPerDay: number;
            limitPerMonth: number;
        };
        usage: {
            today: number;
            month: number;
        };
        provider?: GatewayProviderCode | null;
        providers?: GatewayProvider[];
    };
    wallet: {
        available: boolean;
        limits: {
            limitPerTransaction: number;
            limitPerDay: number;
            limitPerMonth: number;
        };
        usage: {
            today: number;
            month: number;
        };
    };
};
