export type AddOnsPayload = {
    searchText?: string;
    pageSize?: number;
    category?: string | number;
    page?: number;
    sort?: string;
    sortField?: string;
    type?: string;
    from?: string;
    to?: string;
};

export type AddOnsResponse = {
    recordsTotal: number;
    recordsFiltered: number;
    data: Record[];
};

export type Record = {
    id: number;
    subscriptionStartDate: string | null;
    subscriptionEndDate: string | null;
    subscriptionPrice: string;
    subscriptionAmountPaid: string;
    discount: string;
    status: string;
    billingType: string;
    projectId: string;
    invoiceId: string | null;
    createdAt: string;
    isCustom: boolean;
    addOnType?: 'BOT_BUILDER' | 'SHOPIFY_INTEGRATION' | null;
    credential: Credential;
};

export type Credential = {
    id: number;
    name: string;
    username: string;
    registeredByCredential: RegisteredByCredential | null;
};

export type RegisteredByCredential = {
    name: string;
};
