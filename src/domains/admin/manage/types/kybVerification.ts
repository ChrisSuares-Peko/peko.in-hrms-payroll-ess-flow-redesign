export type VerificationResponse = {
    GSTIN: string;
    valid: boolean;
    message: string;
    reference_id: number;
    legal_name_of_business: string;
    trade_name_of_business: string;
};

export type KYBVerification = {
    id: number;
    documentType: string;
    documentNumber: string;
    legalNameOfBusiness: string;
    nameMatchingScore: number | null;
    verificationResponse: VerificationResponse;
    createdAt: string;
    updatedAt: string;
    corporateUserId: number;
    verificationStatus: boolean;
};

export type KYBResponseData = {
    count: number;
    rows: KYBVerification[];
};

export type KYBResponse = {
    success: boolean;
    data: KYBResponseData;
    message: string;
    responseCode: string;
};

export type KYBPayload = {
    from?: string;
    to?: string;
    searchText?: string;
    page?: number;
    itemsPerPage?: number;
    sort?: 'ASC' | 'DESC';
};

export type UpdateKybPayload = {
    gstVerified?: boolean;
    panVerified?: boolean;
    id?: number;
};
