export type taxResponse = {
    recordsTotal: number;
    rows: Records[];
};
export type Records = {
    id: number;
    companyName: string;
    tradeLicenseDoc: DocumentData[];
    corporateGovernanceDoc: string;
    emiratesIDDoc: string;
    passportDoc: string;
    taxPeriod: string;
    contactPerson: string;
    phoneNumber: string;
    email: string;
    selfDeclaration: number;
    amount: string;
    quantity: number | null;
    status: string;
    remarks: string | null;
    taxCertificateDoc: string | null;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
    credential: Credential;
};
export type Credential = {
    id: number;
    name: string;
};
export type StatusPayload = {
    status?: string;
    remarks?: string;
    registrationId?: number;
    corporateTax?: string;
};
export type DocumentData = {
    tradeLicenseDoc_1?: string;
    tradeLicenseDoc_2?: string;
};

export type taxPayload = {
    page: number;
    searchText: string;
    pageSize: number;
    type?: string;
    sort?: string;
    sortField?: string;
    from?: string;
    to?: string;
};
export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
