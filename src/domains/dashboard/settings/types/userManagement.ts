export interface SubCorporateQueryParams {
    page: number;
    itemsPerPage: number;
    reload?: boolean;
    status?: string;
    searchText?: string;
}

export interface SubCorporate {
    id: number;
    name: string;
    email: string;
    mobileNo: string;
    role: string;
    services: { label: string; hasAccess: boolean }[];
    corporateCredentialID: string;
    status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
    isDeleted: number;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
    corporateUserId: number;
}

export interface allSubCorporatesResponse {
    count: number;
    rows: SubCorporate[];
}

export interface FormValues {
    name: string;
    email: string;
    confirmemail?: string;
    mobileNo: number;
    role: string;
    username: string;
}

export type serviceType = {
    label: string;
    hasAccess: boolean;
};
export interface updateAccessPayload {
    services: serviceType[];
    subUserId: number;
}
