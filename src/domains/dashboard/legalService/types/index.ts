export type LegalDocStatus = 'Draft' | 'Sent' | 'Signed';

export interface LegalTemplateDetail extends LegalTemplate {
    documentUrl?: string;
    html?: string | null;
    timeEstimate?: string;
}

export interface ESignSigner {
    signer_id: string;
    signer_name: string;
    signer_email: string;
    status: 'signed' | 'unsigned';
    signing_link?: string;
}

export interface LegalDocument {
    id: string;
    title: string;
    status: 'DRAFT' | 'SENT' | 'SIGNED';
    editorHtml?: string | null;
    documentUrl?: string;
    eSignId?: number;
    createdAt?: string;
    updatedAt?: string;
    eSign?: {
        id: number;
        status: string;
        signers_info: ESignSigner[];
        expiry_date?: string;
    };
}

export interface LegalTemplate {
    id: string;
    title: string;
    description: string;
    timeEstimate?: string;
    category: string;
    iconKey?: string;
}

export interface MyTemplate {
    id: string;
    title: string;
    subTitle: string;
    iconKey?: string;
    iconSrc?: string;
}

export interface SignerInfo {
    signer_name: string;
    signer_email: string;
    signer_mobile?: string;
    signingPolicy?: 'QUICKSIGN' | 'AADHAAR';
    sequence: number;
    page_number: string[];
    signer_position: {
        page: number;
        page_height: number;
        page_width: number;
        x1: number;
        x2: number;
        y1: number;
        y2: number;
    }[];
}

export interface SendForESignPayload {
    docket_title: string;
    documentBase64: string;
    expiry_date: string;
    initiator_email: string;
    reminder: boolean;
    sequentialSignature: boolean;
    sourceType: 'LEGAL_DOCUMENT';
    sourceId: number;
    signers_info: SignerInfo[];
    termsofUse: boolean;
}

export interface ResendSignatoryPayload {
    eSignId: number;
    email: string;
    name: string;
}

export interface UpdateDocumentPayload {
    documentId: string;
    editorHtml: string;
}

export interface RecentDocument {
    id: string;
    title: string;
    subTitle: string;
    date: string;
    status: LegalDocStatus;
    iconSrc?: string;
}
