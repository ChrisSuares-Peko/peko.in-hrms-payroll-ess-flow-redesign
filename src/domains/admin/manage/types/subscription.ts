export type SubscriptionBody = {
    id: number;
    productId: string;
    name: string;
    description: string;
    features: string;
    image: string;
    pekoEmail: string[];
    sendMail: number;
    sendVendorMail: number;
    typeOfOrder: string;
    status: number;
    discount: number;
    createdAt: string;
    updatedAt: string;
    vendorId: number;
    categoryId: number;
    categoryName?: string;
    vendor: {
        vendorName: string;
        optional1: string;
    };
};

export type SubscriptionWithoutID = {
    id?: number;
    productId: string;
    name: string;
    description: string;
    features: string;
    image: string;
    pekoEmail: string[];
    sendMail: number;
    typeOfOrder: string;
    status: number;
    discount: number;
    createdAt: string;
    updatedAt: string;
    vendorId: number;
    categoryId: number;
    categoryName?: string;
    vendor: {
        vendorName: string;
        optional1: string;
    };
};

export type ApiResponseSubscriptions = {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: SubscriptionBody[];
};

export type getSubscription = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: 'ASC' | 'DESC';
    sortField?: string;
};

export type updateSubscriptionStatusPayload = {
    status: boolean;
    subscriptionId: string | number;
};

export type SubscriptionID = Omit<updateSubscriptionStatusPayload, 'status'>;

export type VendorResponse = {
    id: number;
    vendorName: string;
};

export type VendorApiResponse = {
    result: VendorResponse[];
};

export type DropDown = {
    value: number | string;
    label: string;
}[];

export type CategoryApiResponse = {
    categoryData: { id: number; categoryName: string }[];
};

export type SoftwareBulkExcelTemplateResponse = {
    softwareTemplateUrl: string;
};

export type SoftwareProductBulk = {
    TID: number;
    productId: string;
    name: string;
    description: string;
    discount: string;
    features: string;
    pekoEmail: string[];
    sendMail: string;
    typeOfOrder: 'MANUAL' | 'API';
    vendor: string;
    status: boolean;
    errors: string[];
    vendorId: number;
    categoryId: string;
    category: string;
};

export interface BulkSoftwareUploadResponse {
    softwaresJsonData: SoftwareProductBulk[];
    softwaresCreated: boolean;
}

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
