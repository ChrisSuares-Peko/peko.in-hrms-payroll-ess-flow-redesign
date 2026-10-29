export type getOperators = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: 'ASC' | 'DESC';
    deviceType?: 'WEB' | 'MOBILE';
    type?: string;
    sortField?: string;
};

interface ServiceVendor {
    vendorName: string;
    apiUrl: string;
    token: string;
}

export interface OidcDetails {
    active?: boolean;
    client_id?: string;
    client_secret?: string;
    client_name?: string;
    logo_uri?: string;
    redirect_uris?: string[];
}

export type serviceOperator = {
    id?: number;
    serviceProvider: string;
    accessKey: string;
    paymentclientid: string;
    paymentclientsecret: string;
    serviceStatus: boolean;
    providerCommission: string;
    serviceImage?: null | string;
    serviceCategory: string;
    balanceMethod: boolean;
    commissionMode?: 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
    commissionType: 'PERCENTAGE' | 'FLAT';
    serviceType: string;
    vendorId: number;
    vendor: ServiceVendor;
    isDynamicUnitPricing: boolean;
    fixedCommissionPerTransaction?: number;
    isCommissionInclGST?: boolean;
    recordJournalEntry?: boolean;
    oauth_client?: OidcDetails;
};

export type OperatorWithoutID = {
    id?: number;
    serviceProvider: string;
    accessKey: string;
    paymentclientid: string;
    paymentclientsecret: string;
    serviceStatus: boolean;
    providerCommission: string;
    serviceImage?: null | string;
    serviceCategory: string;
    balanceMethod: boolean;
    commissionMode?: 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
    commissionType: 'PERCENTAGE' | 'FLAT';
    serviceType: string;
    vendorId: number;
    vendor: ServiceVendor;
    isDynamicUnitPricing: boolean;
    fixedCommissionPerTransaction?: number;
    isCommissionInclGST?: boolean;
    recordJournalEntry?: boolean;
};

export type ApiResponseOperator = {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: serviceOperator[];
};

export type updateOperatorStatus = {
    serviceStatus: boolean;
    operatorId?: string | number;
};

export type vendorListingPayload = {
    searchText?: string;
};

export type Vendor = {
    id: number;
    vendorName: string;
};

export type IVendorListingResponse = {
    data: Vendor[];
};

export type ServiceType = {
    value: string;
    label: string;
};

export type IServiceTypeListingResponse = {
    serviceType: ServiceType[];
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
