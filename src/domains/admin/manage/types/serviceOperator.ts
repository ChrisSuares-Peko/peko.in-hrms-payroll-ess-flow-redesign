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

export type serviceOperator = {
    id?: number;
    serviceProvider: string;
    accessKey: string;
    serviceStatus: boolean;
    providerCommission: string;
    serviceImage?: null | string;
    serviceCategory: string;
    balanceMethod: boolean;
    commissionType: 'PERCENTAGE' | 'FLAT';
    serviceType: string;
    vendorId: number;
    vendor: ServiceVendor;
    isDynamicUnitPricing: boolean;
};

export type Vendor = {
    id: number;
    vendorName: string;
};

export type IVendorListingResponse = {
    data: Vendor[];
};

type ServiceType = {
    value: string;
    label: string;
};

export type IServiceTypeListingResponse = {
    serviceType: ServiceType[];
};
