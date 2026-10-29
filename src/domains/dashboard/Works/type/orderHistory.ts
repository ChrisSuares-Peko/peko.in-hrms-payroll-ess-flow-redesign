import { UserPayload } from '@customtypes/general';

export interface useOrderHistoryApiProps {
    from: string;
    to: string;
    searchText?: string | null;
    sort: 'ASC' | 'DESC';
    page: number;
    itemsPerPage: number;
}
export interface TransactionsRequestPayload extends UserPayload, useOrderHistoryApiProps {}

export interface Order {
    order: {
        id: number;
        amountInINR: string;
        paymentMode: string;
        status: string;
        orderResponse: string;
        ecomOrderStatus: string;
        transactionDate: string;
        corporateTxnId: string;
        workspaceOrderStatus: string;
    };
}
export interface OrderTableItem {
    id: number;
    date: string;
    planName: string;
    workName: string;
    transactionId: string;
    amount: string;
    status: string;
    paymentMode: string;
    paymentStatus: string;
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
    amountInINR: string;
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
    crmContactDetails: any;
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
    reason?: string;
}

export interface OrderDetailsSlice {
    planDetails:
        | {
              name: string | null | undefined;
              description: string | null | undefined;
              price: string | null | undefined;
              billingCycle: string | null | undefined;
              features: string | null | undefined;
          }
        | null
        | undefined;
    name: string | null | undefined;
    email: string | null | undefined;
    mobile: string | null | undefined;
    status: string | null | undefined;
    refresh: boolean | null | undefined;
    crmContactDetails: any;
    showCRMDetails: string | null | undefined;
}
export interface WorksSlice {
    orderDetails: OrderDetailsSlice;
    formData: {
        pocName: string;
        email: string;
        mobile: string;
        requirement: string;
    };
}
export interface CancelOrderRequestResponse {
    data: number[];
}

export interface CancelOrderRequestPayload extends UserPayload {
    orderId: number;
    description: string;
    reason: string;
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
    orderId: number;
}
