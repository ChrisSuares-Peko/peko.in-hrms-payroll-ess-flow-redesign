import { DropDown } from '@customtypes/general';

export interface RequestPayload {
    userId: number;
    userType: string;
}

export type CityListingPayload = {
    userId: number;
    userType: string;
    searchText: string;
};

export type CityListingResponse = {
    cities: DropDown;
};

export interface CityDetailsPayload extends RequestPayload {
    placeId: string;
}

export interface CityDetailsResponse {
    city: string;
    state: string;
    countryCode: string;
    countryName: string;
}

export interface CalculateRatePayload extends RequestPayload {
    originPostCode: string;
    destinationPostCode: string;
    weight: number;
    length: number;
    width: number;
    height: number;
    isReturn: boolean;
}

export interface DeliveryCompany {
    deliveryCompanyId: number;
    courierName: string;
    serviceType: string;
    deliveryType: string;
    price: string;
    avgDeliveryTime?: string;
    minWeight?: number;
    maxWeight?: number;
    logo?: string;
}

export interface CalculateRateResponse {
    deliveryCompanies: DeliveryCompany[];
}

export interface DeliveryCompanyOption {
    deliveryCompanyId: number;
    courierName: string;
    serviceType: string;
    deliveryType: string;
    avgDeliveryTime?: string;
    price: number;
    logo?: string;
    minWeight?: number;
    maxWeight?: number;
}

export interface ShipmentData {
    originPostCode: string;
    destinationPostCode: string;
    weight: number;
    length: number;
    width: number;
    height: number;
    isReturn: boolean;
}

export interface InternationalShipmentData {
    originPostCode: string;
    destinationCountryCode: string;
    weight: number;
    length: number;
    width: number;
    height: number;
}

export interface InternationalCalculateRatePayload extends RequestPayload {
    originPostCode: string;
    destinationCountryCode: string;
    weight: number;
    length: number;
    width: number;
    height: number;
}

export interface Country {
    name: string;
    alpha2Code: string;
    country_id?: number;
}

export interface ShipmentFormValues {
    senderAddressId: null | number;
    senderName: string;
    senderPhone: string;
    senderEmail: string;
    senderAddressLine: string;
    senderAddressLine2: string;
    senderZipCode: string;
    receiverAddressId: null | number;
    receiverName: string;
    receiverPhone: string;
    receiverEmail: string;
    receiverAddressLine: string;
    receiverAddressLine2: string;
    receiverZipCode: string;
    receiverPhoneCode: string;
    items: {
        quantity: string;
        price: string;
        name: string;
        hsn: string;
    }[];
    recieverSaveAddress: boolean;
    senderSaveAddress: boolean;
    consentAgreed: boolean;
}

export interface Address {
    name: string;
    countryCode: string;
    country: string;
    city: string;
    addressLine: string;
    addressLine2?: string;
    mobile: string;
    postCode?: string;
    phoneCode?: string;
}
