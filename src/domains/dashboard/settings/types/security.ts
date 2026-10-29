import { DropDown, UserPayload } from '@customtypes/general';

export interface SecurityInfoResponse {
    sendMfaCodeToEmail: number;
    sendMfaCodeToPhone: number;
    sendMfaCodeToAuthApp: number;
}

export interface SecurityInfoUpdatePayload extends UserPayload {
    sendMfaCodeToEmail?: number;
    sendMfaCodeToPhone?: number;
    sendMfaCodeToAuthApp?: number;
    otp?: string;
    scope?: string;
}

export type SecurityInfoUpdateResponse = {
    result: number[];
    docs: {};
};

export type AccountTypeResponse = {
    accountType: DropDown;
};

export type ActivityResponse = {
    companyActivity: DropDown;
};
export type AddressTypesResponse = {
    addressType: DropDown;
};
export type CompanySizesResponse = {
    companySize: DropDown;
};

export type CountriesResponse = {
    countries: DropDown;
};
