export interface SubscriptionCode {
    id: number;
    activationCode: string;
    billingType: string;
    isUsed: boolean;
    status: boolean;
    createdAt: string;
    updatedAt: string;
    packageId: number;
    packageName: string;
    partnerName: string;
    partnerId: string;
}

export interface AllSubscriptionCodeResponse {
    count: number;
    rows: SubscriptionCode[];
}

export interface CodesFilterType {
    searchText: string;
    page: number;
    itemsPerPage: number;
    sort: string;
    sortField: string;
    partnerId?: string;
    type?: string;
}

export interface NewActivationCode {
    id?: number;
    billingType: string;
    packageId: number;
    activationCode?: string;
    partnerId?: string;
}

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
