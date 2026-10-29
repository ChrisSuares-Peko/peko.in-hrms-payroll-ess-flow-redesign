import { RequestPayload } from './index';

export interface TrackingStatus {
    historyId: number;
    orderId: string;
    orderStatus: string;
    remarks: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface ITrackShipmentResponse {
    trackingDetails: TrackingStatus[];
    orderDetails: IOrderDetails;
}
interface IOrderDetails {
    id: number;
    corporateTxnId: string;
    operatorId: string;
    providerId: string;
    transactionDate: string;
    accountNo?: string;
    amountInINR: string;
    baseAmount: string;
    paymentMode: string;
    orderResponse: string;
    paymentModeResponse?: string;
    surcharge: string;
    baseCurrency: string;
    exchangeRate: string;
    status: string;
    message: string;
    ecomOrderStatus: string;
    workspaceOrderStatus: string;
    shipmentStatus?: string[];
    serviceOperatorId: number;
    credentialId: number;
}

export interface ITrackingDetails {
    trackingNo: string;
    trackingValues: TrackingStatus[];
    orderResponse: string;
    shipmentStatus: TrackingStatus[];
    amount: string;
    orderId: number;
}

interface IUpdateShipmentResult {
    responseCode: string;
    responseTitle: string;
    responseMessage: string;
}

export interface UpdateShipmentStatusPayload extends RequestPayload {
    updateType: string;
    orderId: string;
}

export interface UpdateShipmentPayload extends RequestPayload {
    orderId: string;
    nextDeliveryDate?: string;
    customerMobileNo?: string;
    customerAddress?: string;
}

export interface UpdateShipmentStatusResponse {
    result: IUpdateShipmentResult;
}
