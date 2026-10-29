type Credential = {
    id: number;
    name: string;
};
export type Insurance = {
    id: number;
    transactionDate: string;
    transactionID: string;
    paymentMode: string;
    policyName: string;
    policyPremium: string;
    policyTenure: string;
    policydocument: string | null;
    insuranceStatus: string;
    statusMessage: string;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
    credential: Credential;
};

export type InsuranceResponse = {
    status: boolean;
    message: string;
    recordsTotal: number;
    recordsFiltered: number;
    data: Insurance[];
};

export type getData = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    sortField?: string;
    from?: string;
    to?: string;
    id?: string | number;
    category?: string | number;
    type?: string;
};
