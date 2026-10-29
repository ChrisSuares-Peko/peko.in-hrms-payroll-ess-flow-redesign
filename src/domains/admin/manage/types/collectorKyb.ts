export type collectorKybListResponse = {
    recordsTotal: number;
    rows: Records[];
};
export type Records = {
    id: number;
    supplierCode: number;
    supplierEmail: string;
    kybStatus: 'INITIATED' | 'DOCUMENT UPLOADED' | 'APPROVED' | 'REJECTED';
    eSignStatus: 'E-SIGN PENDING' | 'COMPLETED' | 'REJECTED';
    rejectReason: string;
    createdAt: string;
    updatedAt: string;
    corporateUserId: number;
    corporateUser: {
        id: number;
        name: string;
        mobileNo: string;
        credentialId: number;
        credential: Credential;
    };
    supplierDetails: {
        bankDetails: {
            iban: string;
            bankId: 1;
            bankName: string;
            bankAccount: string;
            bankAccountHolderName: string;
        };
        userConsent: boolean;
        websiteLink: string;
        natureOfBusiness: string;
        uploadedDocuments: {
            Passport: {
                fileUrl: string;
                isUploaded: boolean;
            };
            Bank_Letter: {
                fileUrl: string;
                isUploaded: boolean;
            };
            Emirates_ID: {
                fileUrl: string;
                isUploaded: boolean;
            };
            Trade_License: {
                fileUrl: string;
                isUploaded: boolean;
            };
            proofOfBusiness: {
                fileUrl: string;
                isUploaded: boolean;
            };
            Articles_Of_Association: {
                fileUrl: string;
                isUploaded: boolean;
            };
        };
    };
    agreementDetails: {
        status: string;
        docket_id: string;
        document_id: string;
        signer_info: [
            {
                signer_id: string;
                document_id: string;
                signer_ref_id: string;
                reference_doc_id: string;
            },
        ];
        signer_email: string;
        agreement_url: string;
        agreement_sent_date: string;
        agreement_signed_date: string;
    };
};
export type Credential = {
    id: number;
    username: string;
};

export type DocumentData = {
    tradeLicenseDoc_1?: string;
    tradeLicenseDoc_2?: string;
};

export type collectorKybListPayload = {
    page: number;
    searchText: string;
    pageSize: number;
    type?: string;
    sort?: string;
    sortField?: string;
};

export type ChangeStatusPayload = {
    kybStatus: string;
    rejectReason?: string;
    corporateUserId: number;
};
