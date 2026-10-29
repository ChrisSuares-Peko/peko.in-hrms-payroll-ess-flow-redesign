import { RequestPayload } from '.';

export interface TrackShipmentPayload extends RequestPayload {
    trackingNumber: string;
}

export interface TrackingApiResponse {
    shipment: Shipment;
}

export interface Shipment {
    id: number;
    status: string; // e.g., "PENDING"
    senderAddress: Address;
    receiverAddress: Address;
    shipmentDetails: ShipmentDetails;
    amount: number;
    weight: number;
    items: Item[];
    trackingDetails: TrackingDetail[] | null;
    corporateTxnId: string;
    otoId: string | number;
    vendorOrderId: string | null;
    shipmentId: string | null;
    trackingNo: string;
    shipmentType: string; // e.g., "DOM"
    returnDetails: ReturnDetails | null;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    credentialId: number;
    trackingUrl: string;
    isReturnAllowed: boolean;
    isCancelAllowed: boolean;
}

export interface ReturnDetails {
    amount: number;
    corporateTxnId: number;
    deliveryPartnerData: DeliveryPartnerData;
}

export interface DeliveryPartnerData {
    logo: string;
    serviceType: string;
    deliveryType: string;
    avgDeliveryTime: number | null;
    deliveryCompanyId: number;
    courierName: string;
}

export interface Address {
    city: string;
    name: string;
    addressLine: string;
    email: string;
    mobile: string;
    postCode: string;
    countryCode: string;
    countryName: string;
}

export interface ShipmentDetails {
    deliveryPartnerData: {
        logo: string;
        deliveryCompanyId: number;
        courierName: string;
        serviceType: string;
        deliveryType: string;
        avgDeliveryTime: string | null;
    };
    boxDimensions: {
        width: number;
        height: number;
        length: number;
        weight: number;
    };
}

export interface Item {
    quantity: string;
    price: string;
    name: string;
}

export interface TrackingDetail {
    note: string;
    status: string;
    dcStatus: string;
    timestamp: string;
    printAWBURL: string;
    isMainStatus: boolean;
    vendorStatus: string;
    reverseShipment: boolean;
    courierName: string;
    description: string;
    location?: string;
}

export interface CancelOrderPayload extends RequestPayload {
    orderId: string;
}

export interface downloadInvoicePayload extends RequestPayload {
    trackingNumber: string;
    amount: number;
}

export interface downloadLabelPayload extends RequestPayload {
    trackingNumber: string;
}

export interface DownloadLabelResponse {
    labelUrl: string;
}
