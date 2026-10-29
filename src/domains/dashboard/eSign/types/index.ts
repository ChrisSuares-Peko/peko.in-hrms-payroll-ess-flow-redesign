export interface SignerInfo {
    sequence: string;
    signer_id: string;
    document_id: string;
    page_number: string[];
    signer_name: string;
    signer_email: string;
    signer_mobile: string;
    signer_ref_id: string;
    signer_position: string[];
    reference_doc_id: string;
    signingPolicy?: SigningPolicy;
}

export interface HistoryTableItem {
    id: number;
    docket_id: string;
    document_id: string;
    docket_title: string;
    docket_description: string;
    expiry_date: string;
    sequentialSignature: boolean;
    signers_info: SignerDetailsType[];
    initiator_email: string;
    document_url: string;
    audit_trail_url?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
    credential: {
        id: number;
        name: string;
    };
    signingPolicy?: SigningPolicy;
}

export interface OrderHistoryApiPayload {
    page: number;
    searchText: string;
    pageSize: number;
    from: string;
    to: string;
}
export interface OrderHistoryApiResponse {
    recordsTotal: number;
    rows: HistoryTableItem[];
}
export interface OrderDetailsApiPayload {
    id: number;
}
export interface OrderDetailsApiResponse extends HistoryTableItem {
    documentBase64: string;
}

export type SigningPolicy = 'QUICKSIGN' | 'AADHAAR';

export interface SignerDetailsTypes {
    signer_name: string;
    signer_email: string;
    signer_mobile?: string;
    signingPolicy?: SigningPolicy;
    sequence: string;
    signer_id?: string;
    status?: string;
    signer_index?: number;
}
type SignerPositionType = {
    id: string;
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    page: number;
    page_width: number;
    page_height: number;
};

type SignerDetailsType = {
    status?: string; // E.g., "unsigned", "signed"
    sequence: string; // Sequence number as string
    signer_id: string; // Unique ID for the signer
    document_id: string; // ID of the document being signed
    page_number: string[]; // Array of page numbers as strings
    signer_name: string; // Name of the signer
    signer_email: string; // Email address of the signer
    signer_mobile: string; // Mobile number of the signer
    signer_ref_id: string; // Reference ID for the signer
    signer_position: SignerPositionType[]; // Array of positions for the signer
    reference_doc_id: string; // Reference document ID
    signingPolicy?: SigningPolicy;
};
export interface SavedSignersTypes {
    signer_name: string;
    signer_email: string;
    signer_mobile?: string;
    sequence?: string;
    signer_position?: {};
    page_number?: string[];
    signer_index: number;
}
export interface SignerCoordinate {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    page: number;
    pageHeight: number;
    pageWidth: number;
}
export interface ESignDocState {
    docket_title: string;
    expiry_date: string | undefined;
    reminder: boolean;
    reminder_interval: string;
    document_url?: string;
    audit_trail_url?: string;
    documentBase64: string;
    sequentialSignature: boolean;
    signingPolicy?: SigningPolicy;
    signers_info: SignerDetailsType[];
    saved_signers: SavedSignersTypes[];
    initiator_name: string;
    initiator_email: string;
    isDisabled: boolean;
    status?: string;
    pageNumbers?: number | null;
    id?: string | number;
    signerCoordinates: {
        id: string;
        signer_index: number;
        signer_position: any;
        page_height: number;
        page_width: number;
        page: number;
    }[];
    doc_expiry_date?: string;
    signerCo: Record<string, SignerCoordinate[]>;
    termsofUse: boolean;
    signerArray: string[];
}

export interface signRequestApiPayload {
    docket_title: string;
    expiry_date?: string | undefined;
    reminder: boolean;
    reminder_interval?: string | undefined;
    documentBase64: string;
    sequentialSignature: boolean;
    signingPolicy?: SigningPolicy;
    signers_info: SignerDetailsTypes[];
    initiator_email: string;
}
export interface signRequestApiResponse extends ESignDocState {}

export interface resendInvitationApiPayload {
    id: string | number;
    signer_id: string;
    name: string;
    email: string;
}
export interface resendInvitationApiResponse {}

export interface eSignResponse {
    count: number;
    lastESignAddedDate?: string;
    pendingCount: number;
    completedCount: number;
}
interface Signer {
    signer_name: string;
    signer_email: string;
    signer_mobile?: string;
    sequence: string;
    page_number: string;
    signer_position: string;
}

export interface FormValues {
    docket_title: string;
    expiry_date: string;
    reminder: boolean;
    reminder_interval?: string;
    documentBase64: string;
    sequentialSignature: boolean;
    signingPolicy: SigningPolicy;
    signers_info: Signer[];
    initiator_email: string;
    termsofUse: boolean;
}
export type useFilterCommon = {
    searchText: string;
    page: number;
    itemsPerPage: number;
    partnerId?: string | number;
    sort?: 'ASC' | 'DESC';
    sortField?: string;
    from?: string;
    to?: string;
    corporateId?: string | number;
    category?: string | number;
};
