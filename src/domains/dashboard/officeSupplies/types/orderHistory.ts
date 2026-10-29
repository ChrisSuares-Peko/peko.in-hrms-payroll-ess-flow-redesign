import { UserPayload } from '@customtypes/general';

export interface useOrderHistoryApiProps {
    from: string;
    to: string;
    searchText?: string | null;
    sort: 'ASC' | 'DESC';
    page: number;
    itemsPerPage: number;
}

export interface payloadUser {
    userId: number;
    userType: string;
    scope: string;
}
export interface TransactionsRequestPayload extends UserPayload, useOrderHistoryApiProps {}

export interface Order {
    order: {
        id: number;
        amountInAed: string;
        transactionDate: string;
        corporateTxnId: string;
        paymentMode: string;
        status: string;
        orderResponse: string;
        ecomOrderStatus: string;
    };
}
export interface OrderTableItem {
    id: number;
    date: string;
    products: { productName: string }[];
    transactionId: string;
    amount: string;
    status: string;
}

export interface TransactionsResponse {
    totalData: number;
    result: Order[];
}

export interface TransactionDetailsRequestPayload extends UserPayload {
    orderId: string;
}
export interface TransactionDetailsResponse {
    id: number;
    corporateTxnId: string;
    operatorId: string;
    providerId: string | null;
    transactionDate: string;
    accountNo: string;
    amountInAed: string;
    baseAmount: string;
    paymentMode: string;
    orderResponse: any;
    paymentModeResponse: any;
    surcharge: string;
    baseCurrency: string;
    exchangeRate: string;
    status: string;
    message: string;
    ecomOrderStatus: string;
    workspaceOrderStatus: string;
    shipmentStatus: string | null;
    createdAt: string;
    updatedAt: string;
    serviceOperatorId: number;
    credentialId: number;
    shippingFee?: string;
    isInvoice?: boolean;
}

export interface OrderedProduct {
    productId: number;
    productQuantity: number;
    productName: string;
    totalPrice: number;
    totalVat: number;
    image: string;
    status?: string;
    returnPickUpDate?: string;
    returnInitiatedDate?: string;
    returnRejectedDate?: string;
    returnCompletedDate?: string;
    reason?: string;
}

export interface OrderDetailsSlice {
    orderedProducts: OrderedProduct[];
    orderDetails: TransactionDetailsResponse | null;
    trackingDetails: {
        trackingWebsite: string;
        trackingNumber: string;
        deliveryPartner: string;
    } | null;
    refresh: boolean;
    isSurchargeLoaded: boolean;
}

export interface CancelOrderRequestResponse {
    data: number[];
}

export interface CancelOrderRequestPayload extends UserPayload {
    orderId: number;
    description: string;
    reason: string;
    otp?: string;
    scope?: string;
}

export interface ProductReturnRequestPayload extends CancelOrderRequestPayload {
    productId: number;
}
export interface ProductReturnRequestResponse {
    data: number[];
}
export interface DownloadInvoiceRequestResponse {
    data: any;
}

export interface DownloadInvoiceRequestPayload extends UserPayload {
    transactionID: number;
    type: string;
}
