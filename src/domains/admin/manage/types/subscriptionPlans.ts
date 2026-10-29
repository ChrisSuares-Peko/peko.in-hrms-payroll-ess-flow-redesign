export type SubscriptionPlan = {
    id: number;
    planId: string;
    name: string;
    vendorPrice: string;
    price: string;
    validity: string;
    noOfUsers: number;
    features: string;
    status: number;
    createdAt: string;
    updatedAt: string;
    softwareId: number;
    software: {
        name: string;
    };
    GST: string;
    gstType: string;
};

export type SubscriptionPlanWithoutID = {
    id?: number;
    planId: string;
    name: string;
    vendorPrice: string;
    price: string;
    validity: string;
    noOfUsers: number;
    features: string;
    status: number;
    createdAt: string;
    updatedAt: string;
    softwareId: number;
    software: {
        name: string;
    };
};

export type ApiResponseSubscriptionPlans = {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: SubscriptionPlan[];
};

export type getSubscriptionPlans = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: 'ASC' | 'DESC';
    sortField?: string;
};

export type updateSubscriptionPlanStatusPayload = {
    status: boolean;
    subscriptionId: string | number;
};

export type SubscriptionID = Omit<updateSubscriptionPlanStatusPayload, 'status'>;

export type SotwareResponse = {
    id: number;
    name: string;
};

export type FetchSoftwareApiResponse = {
    result: SotwareResponse[];
};

export type SoftwaresDropDown = {
    value: number;
    label: string;
}[];

export type SoftwarePlansBulkTemplateResponse = {
    planTemplateUrl: string;
};

export type SoftwarePlansBulk = {
    TID: number;
    planId: string;
    name: string;
    validity: string;
    discount: string;
    vendorPrice: string;
    price: string;
    noOfUsers: string;
    features: string;
    software: string;
    status: boolean;
    errors: string[];
    softwareId: number;
};

export interface BulkSoftwarePlansUploadResponse {
    softwaresJsonData: SoftwarePlansBulk[];
    plansCreated: boolean;
}

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
