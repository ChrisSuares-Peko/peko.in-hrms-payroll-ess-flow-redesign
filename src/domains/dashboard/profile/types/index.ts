import { DropDown } from '@customtypes/general';
import { Scope } from '@src/enums/enums';

export interface UserPayload {
    userId: number;
    userType: string;
}

export interface GetOtpPayload extends UserPayload {
    scope: Scope;
    iban?: string;
    accountNumber: string;
    method?: string;
    selectedId?: number | string;
}

export type AddressListResponse = {
    addressDetails: AddressDetail[];
};

export type AccountTypeResponse = {
    accountType: DropDown;
};

export interface AddressDetail {
    id: number;
    name: string;
    nickname: string;
    department: string | null;
    city: string | null;
    country: string | null;
    addressLine1: string;
    addressLine2: string;
    phoneNumber: string;
    email: string | null;
    countryCode: string | null;
    zipCode: string | null;
    default: number;
    addressType: string | null;
    state: string | null;
    pincode: string | null;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
}

export type AddressTableData = {
    id: number;
    label: string;
    value: string;
}[];

export type AddressTypesResponse = {
    addressType: DropDown;
};
export type CompanySizesResponse = {
    companySize: [
        {
            id: number;
            name: string;
        },
    ];
};

export type StatesResponse = {
    states: [
        {
            label: string;
            value: string;
        },
    ];
};

export type ActivityResponse = {
    companyActivity: [
        {
            id: number;
            name: string;
        },
    ];
};

export interface AddAddressRequestPayload {
    addressType: string;
    addressLine1: string;
    addressLine2: string;
    credentialId: string;
    default: boolean;
    name: string;
    phoneNumber: string;
    userType: string;
}

export type AddAddressResponse = {
    isReceiver: boolean;
    id: number;
    addressType: string;
    addressLine1: string;
    addressLine2: string;
    credentialId: string;
    default: boolean;
    name: string;
    phoneNumber: string;
    updatedAt: string;
    createdAt: string;
};

export interface DeleteRequestPayload extends UserPayload {
    id: number;
    otp?: string;
    scope?: string;
}

export interface updateAddressRequestPayload extends AddAddressRequestPayload {
    id: number;
}
export type updateResponse = {
    updatedAddress: number[];
};

export type BankListResponse = {
    bankDetails: BankDetail[];
};
export type BankDetail = {
    id: number;
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string | null;
    status: number;
    default: number;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
    bankBranch?: string;
    accountType: string;
};

export interface AddBankRequestPayload extends UserPayload {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    bankBranch: string;
    credentialId: string;
    ifscCode: string;
    default: boolean;
    otp: string;
    scope: string;
    selectedId: string;
}
export interface UpdateBankRequestPayload extends AddBankRequestPayload {
    id: number;
}

export type AddBankResponse = {
    status: boolean;
    id: number;
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    credentialId: string;
    ifscCode: string;
    default: boolean;
    updatedAt: string;
    createdAt: string;
};

export type BasicInfoResponse = {
    name: string;
    contactPersonName: string;
    mobileNo: string;
    city: string;
    designation: string;
    email: string;
    country: string;
    state: string;
    companyName: string;
    companySize: string;
    landlineNo: string;
    mobileVerified: number;
    logo: string;
    package: Package;
    credential: Credential;
};

export interface Package {
    packageName: string;
}

export interface Credential {
    username: string;
}

export type CompanyInfoResponse = {
    gstNumber: string;
    panNumber: string;
    tanNumber: string;
    cinNumber: string;
    tanDoc: string;
    panDoc: string;
    gstDoc: string;
    cinDoc: string;
    tradeLicenseNo: string;
    tradeLicenseDoc: string;
    issuingAuthority: string;
    activity: string;
    panVerified: boolean;
    gstVerified: boolean;
    cinVerified: boolean;
};

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

export interface UpdateBasicInfoRequestPayload extends UserPayload {
    name: string;
    mobileNo: string;
    city: string;
    designation: string;
    email: string;
    country: string;
    companyName: string;
    companySize: string;
    landlineNo: string;
    profileImageBase: string;
    profileImageFormat: string;
    scope: string;
    otp: string;
}

export type UpdateBasicInfoResponse = {
    result: string;
    docs: {
        logo: string;
    };
};

export interface UpdateCompanyInfoRequestPayload extends UserPayload {
    activity: string;
    cinNumber: string;
    gstNumber: string;
    panNumber: string;
    cinDoc?: string;
    gstDoc?: string;
    panDoc?: string;
    cinFormat?: string;
    gstFormat?: string;
    panFormat?: string;
    scope: string;
    otp: string;
}

export interface ChangePasswordRequestPayload extends UserPayload {
    id: string;
    oldPassword: string;
    newPassword: string;
}
export interface verifyGSTPayload extends UserPayload {
    value: string;
    type: 'gst' | 'pan' | 'cin';
}
export interface verifyPANPayload extends UserPayload {
    panNo: string;
}
export interface GSTDetailsResponse {
    requestId: string;
    result: {
        registrationDate: string;
        tradeName: string;
        natureOfBusiness: string[];
        principalBusinessAddress: {
            nature: string;
            email: string;
            mobile: string;
            address: string;
        };
        gstin: string;
        stateJurisdiction: string;
        taxPayerType: string;
        businessConstitution: string;
        gstRegistrationStatus: string;
        legalName: string;
    };
    source: string;
}
export interface PANDetailsResponse {
    requestId: string;
    result: {
        registrationDate: string;
        tradeName: string;
        natureOfBusiness: string[];
        principalBusinessAddress: {
            nature: string;
            email: string;
            mobile: string;
            address: string;
        };
        gstin: string;
        stateJurisdiction: string;
        taxPayerType: string;
        businessConstitution: string;
        gstRegistrationStatus: string;
        legalName: string;
    };
    source: string;
}
export interface progressResponse {
    addressDetailsProgress: number;
    progress: string;
    bankDetailsProgress: number;
    basicInfoProgress: number;
    companyInfoProgress: number;
    companyDocProgress: number;
    strength: string;
    tips: string;
    referralLink: string;
}

export interface UpdateGstandPan {
    userId?: number;
    userType?: string;
    activity: string;
    gstNumber?: string;
    panNumber?: string;
    gstDoc?: string | null;
    panDoc?: string | null;
    gstFormat?: string;
    panFormat?: string;
}
export interface UpdateGstandPanResponse {
    data: any;
}

export type SubCorporateProfileResponse = {
    name: string;
    mobileNo: string;
    email: string;
    role: string;
    credential: {
        username: string;
    };
};

export type PasswordPolicyResponse = {
    data: {
        id: number;
        level: number;
        minLength: number;
        minPasswordAge: number;
        maxPasswordAge: number;
        minChangeChars: number;
        prohibitPasswordReuse: boolean;
        prohibitPasswordReuseTimes: number | null;
        maxInvalidLoginAttempts?: number;
        lockEffectivePeriod?: number;
        lockoutTimespan?: number;
        enableBannedPasswords?: boolean;
        customBannedPasswords?: string;
        preventPersonalDataInPassword?: boolean;
        createdAt: string;
        updatedAt: string;
    }[];
};

export type PasswordPolicy = {
    id?: number;
    level: number;
    minLength: number;
    minPasswordAge: number;
    maxPasswordAge: number;
    minChangeChars: number;
    prohibitPasswordReuse?: boolean;
    prohibitPasswordReuseTimes?: number | null;
    maxInvalidLoginAttempts?: number;
    lockEffectivePeriod?: number;
    lockoutTimespan?: number;
    enableBannedPasswords?: boolean;
    customBannedPasswords?: string;
    preventPersonalDataInPassword?: boolean;
    createdAt?: string;
    updatedAt?: string;
};
