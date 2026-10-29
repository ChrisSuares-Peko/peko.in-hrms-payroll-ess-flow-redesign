import { UserPayload } from '@customtypes/general';

export type PlansListResponse = {
    data: PlanDetail[];
};

export interface PlanDetail {
    id: number;
    name: string;
    price: string;
    billingCycle: 'MONTHLY' | 'YEARLY';
    description: string;
    highlights: string;
    logo: string;
    is_available: boolean;
    status: boolean;
}

export type WorkSpaceListResponse = {
    data: WorkspaceDetail[];
};
export type WorkspaceDetail = {
    id: number;
    name: string;
    monthlyPrice: string;
    yearlyPrice: string;
    address: string;
    latLng: string;
    logo: string;
    status: boolean;
    features: any;
    perks: any;
    planId: number;
};

export type WorkspaceFormValues = {
    licenseType: string;
    companyName: string;
    expiryDate: string;
    tradeLicenseDoc: string;
    tradeLicenseFormat?: string;
    visaDoc: string;
    visaDocFormat?: string;
};

export type ImageUpload = { file: string; base64String: string; imageFormat: string };

export type ImageUploadResponse = { tradeLicenseUrl: string; ownerVisUrl: string };

export type tablePayload = {
    sort: string;
    page: number;
    itemsPerPage: number;
    search?: string | null;
    fromDate: string;
    toDate: string;
};

export type orderHistoryPayload = UserPayload & tablePayload;

export type orderHistoryResponse = UserPayload & {
    totalData: number;
    result: any[];
};

export interface OrderTableItem {
    date: string;
    plan: string;
    transactionId: string;
    billingCycle: string;
    amount: number;
    status: string;
}
