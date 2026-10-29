export type AccessData = {
    id: number;
    access_code: string;
    partnerId: string;
    groupId: number;
    isAssigned: number;
    status: number;
    createdAt: string;
    updatedAt: string;
    corporateUserId: null | number; // Depending on whether corporateUserId can be null or a number
};
export type AccessDataResponse = {
    data: AccessData[];
    recordsTotal: number;
};

export type refresh = {
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};
export type updateStatus = {
    AccessId: string | number;
    status: any;
};
export type activeResponse = {
    data: string;
};
export type getData = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    type?: string;
};

export type AccessDataPartial = {
    id?: number;
    access_code: string;
    partnerId: string;
};
export interface BulkAccessCodeUploadPayload {
    userId?: number;
    userType?: string;
    file?: any;
}

export type AccessCodeBulkExcelTemplateResponse = {
    accessCodeTemplateUrl: string;
};

export type AccessCodeBulkExcelTemplatePayload = {
    userId?: number;
    userType?: string;
};

export type BulkAccessCodeUploadResponse = {
    uploaded: boolean;
};
