interface SignerInfo {
    sequence: string | number;
    signer_id: string;
    document_id: string;
    page_number: string[];
    signer_name: string;
    signer_email: string;
    signer_mobile: string;
    signer_ref_id: string;
    signer_position: string[];
    reference_doc_id: string;
}

interface Credential {
    name: string;
    username: string;
}

export type eSignBody = {
    id: number;
    docket_id: string;
    document_id: string;
    docket_title: string;
    docket_description: string | null;
    expiry_date: string; // ISO date string
    sequentialSignature: number;
    signers_info: SignerInfo[];
    document_url: string;
    status: string;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    credentialId: number;
    credential: Credential;
};

export interface eSignDataResponse {
    recordsTotal: number;
    data: eSignBody[];
}
