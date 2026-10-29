export interface UserPayload {
    userId: number;
    userType: string;
}

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

export type CreateRequest = {
    id: number;
    storeName: string;
    businessCategory: string;
    contactPerson: string;
    mobileNumber: string;
    email: string;
    city: string;
    preferredLanguage: string;
    updatedAt: string;
    createdAt: string;
};
export type CreateRequestResponse = {
    result: CreateRequest;
};

export type RequestFormValues = {
    storeName: string;
    businessCategory: string;
    contactPerson: string;
    mobileNumber: string;
    email: string;
    city: string;
    preferredLanguage: string;
};

export interface Package {
    packageName: string;
}

export type FilterState = {
    search: string;
    start: number;
    length: number;
};

export type OrderHistoryTablePayload = {
    userId: number;
    userType: string;
    start: number;
    length: number;
    search: string;
};

export type OrderHistoryListResponse = {
    result: BPOSHistory[];
    totalData: number;
};

export type BPOSHistory = {
    id: number;
    storeName: string;
    businessCategory: string;
    contactPerson: string;
    mobileNumber: string;
    email: string;
    city: string;
    preferredLanguage: string;
    status: 'Customer Contacted' | 'Product Demo Done' | 'Payment Received' | 'Setup Completed';
    createdAt: string;
    updatedAt: string;
    credentialId: number;
};
