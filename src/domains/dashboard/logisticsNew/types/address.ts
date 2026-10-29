import { RequestPayload } from '.';

export interface SavedAddressPayload extends RequestPayload {
    isReceiver: boolean;
}

export interface Address {
    id?: number;
    name: string;
    city: string | null;
    state?: string | null;
    country: string | null;
    addressLine1: string;
    addressLine2?: string;
    phoneNumber: string;
    countryCode: string | null;
    // countryName: string | null;
    zipCode?: string;
    isReceiver: number; // Assuming this is a boolean (0 for false, 1 for true)
    default: number; // Assuming this is a boolean (0 for false, 1 for true)
    phoneCode?: string;
    email?: string;
}
export type SavedAddressResponse = {
    addresses: Address[];
};

export interface AddressFieldValue {
    id?: number;
    address1: string;
    address2?: string;
    phoneNumber: string;
    email: string | null;
    name: string;
    country: string;
    countryCode: string;
    state: string;
    city: string;
    zipCode: string;
    phoneCode: string;
}

export interface SaveAddressPayload extends Address {
    userId: number;
    userType: string;
}

export interface UpdateAddressPayload extends RequestPayload {
    addressId: number;
    name?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    country?: string;
    countryCode?: string;
    state?: string;
    zipCode?: string;
    phoneNumber?: string;
    email?: string;
    default?: number;
}

export interface ValidateAddressPayload extends RequestPayload {
    address: {
        Line1: string;
        Line2: string;
        Line3: string;
        City: string;
        CountryCode: string;
        PostCode: string;
    };
}

export interface AddressFormValues {
    senderSaveAddress: boolean;
    recieverSaveAddress: boolean;
    senderEmail: string;
    recieverEmail: string;
    shipmentType: string;
    senderAddress1: string;
    senderAddress2: string;
    senderCity: string;
    senderName: string;
    senderCountry: string;
    senderCountryName: string;
    senderPhone: string;
    senderZipCode: string;
    recieverName: string;
    recieverAddress: string;
    recieverPhone: string;
    recieverCity: string;
    recieverCountry: string;
    recieverCountryName: string;
    recieverZipCode: string;
}

export interface SenderFormValues {
    addressId?: number;
    senderName: string;
    senderCountry: string;
    senderCountryName: string;
    senderCity: string;
    senderPhone: string;
    senderAddress1: string;
    senderSaveAddress: boolean;
    senderEmail: string;
    senderAddress2: string;
    senderZipCode: string;
}

export interface RecieverFormValues {
    addressId?: number;
    recieverName: string;
    recieverAddress1: string;
    recieverAddress2: string;
    recieverPhone: string;
    recieverEmail: string;
    recieverCity: string;
    recieverCountry: string;
    recieverCountryName: string;
    recieverZipCode: string;
    recieverSaveAddress: boolean;
    phoneCode: string | number;
}

export interface typeFormValues {
    shipmentType: string;
}

export interface FormsSubmissionStatus {
    senderForm: boolean;
    receiverForm: boolean;
    typeForm: boolean;
}

export type SetFormsSubmittedType = (
    value: FormsSubmissionStatus | ((prevState: FormsSubmissionStatus) => FormsSubmissionStatus)
) => void;
