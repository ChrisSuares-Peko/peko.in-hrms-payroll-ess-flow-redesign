import { ReactNode } from 'react';

import { MerchantProfile } from './index';

export type SavedAddressPayload = {
    userId: number;
    userType: string;
    isReceiver: boolean;
};

export interface Address {
    id?: number;
    name: string;
    nickname?: number;
    city: string | null;
    country?: string;
    addressLine1: string;
    addressLine2: string;
    phoneNumber: string;
    email: string | null;
    remarks?: string | null;
    state?: string | null;
    zipCode?: string;
    addressType?: string;
    isReceiver: number; // Assuming this is a boolean (0 for false, 1 for true)
    default: number; // Assuming this is a boolean (0 for false, 1 for true)
}

export interface SaveMerchantPayload extends MerchantProfile {
    userId: number;
    userType: string;
}

export type SavedMerchantResponse = {
    data: Address;
};

export type AddressOptions = {
    label: ReactNode;
    value: string;
};

export interface AddressField {
    address: string;
    phoneNumber: string;
    email: string | null;
    name: string;
    country: string;
    city: string;
    state?: string;
    zipCode: string;
    remark?: string;
}

export interface AddressFormValues {
    senderSaveAddress: boolean;
    recieverSaveAddress: boolean;
    senderEmail: string;
    recieverEmail: string;
    shipmentType: string;
    senderAddress: string;
    senderCity: string;
    senderName: string;
    senderCountry: string;
    senderPhone: string;
    senderZipCode: string;
    senderRemark: string;
    senderState: string;
    recieverName: string;
    recieverAddress: string;
    recieverPhone: string;
    recieverCity: string;
    recieverCountry: string;
    recieverZipCode: string;
    recieverRemark: string;
    recieverState: string;
}

export interface SenderFormValues {
    senderEmail: string;
    senderAddress: string;
    senderCity: string;
    senderName: string;
    senderCountry: string;
    senderPhone: string;
    senderZipCode: string;
    saveSenderAddress?: boolean;
    senderRemark: string;
    senderState: string;
}

export interface RecieverFormValues {
    recieverName: string;
    recieverAddress: string;
    recieverPhone: string;
    recieverEmail: string;
    recieverCity: string;
    recieverCountry: string;
    recieverZipCode: string;
    recieverSaveAddress: boolean;
    recieverRemark: string;
    recieverState: string;
}

export interface typeFormValues {
    serviceType: string;
}
