export type QuoteRequestStatus =
    | 'NEW'
    | 'CONTACTED'
    | 'QUOTED'
    | 'CONVERTED'
    | 'CLOSED';

export type QuoteRequestCredential = {
    id: number;
    name: string;
    email: string;
    username?: string;
};

export type QuoteRequest = {
    id: number;
    fullName: string;
    mobileNumber: string;
    email: string;
    insuranceType: string;
    vehicleNumber: string | null;
    vehicleId: number | null;
    status: QuoteRequestStatus;
    remarks: string | null;
    createdAt: string;
    credential?: QuoteRequestCredential | null;
    subCorporateUser?: { id: number; name: string; email: string } | null;
};

export type QuoteRequestListResponse = {
    recordsTotal: number;
    data: QuoteRequest[];
};

export type GetQuoteRequestsParams = {
    page: number;
    itemsPerPage: number;
    searchText: string;
    sort: string;
    sortField?: string;
    status?: string;
    insuranceType?: string;
};

export type UpdateQuoteStatusPayload = {
    id: number | string;
    status: QuoteRequestStatus;
    remarks?: string;
};
