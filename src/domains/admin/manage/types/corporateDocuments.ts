export interface CorporateDocumentEntry {
    document: string | null;
    documentType: string | null;
    fileName: string | null;
    expiryDate: string | null;
    status: string | null;
    uploadedAt: string | null;
}

/** Keyed by the backend documentName, which is driven by the per-business-type checklist. */
export type CorporateDocumentsMap = Record<string, CorporateDocumentEntry>;

export interface CorporateDocumentRow {
    documentName: string;
    label: string;
    required: boolean;
}

export type KybStepState = 'done' | 'in_progress' | 'pending' | 'not_applicable';

export interface KybProgressStep {
    key: string;
    label: string;
    state: KybStepState;
    detail: string | null;
}

export interface CorporateDocumentsResponse {
    businessType: string | null;
    kybStatus: string | null;
    rejectionReason: string | null;
    progress: KybProgressStep[];
    documents: CorporateDocumentRow[];
    corporateDocuments: CorporateDocumentsMap;
}

export interface AgreementReviewField {
    key: string;
    label: string;
    value: string | null;
    required: boolean;
}

export interface AgreementReviewGroup {
    key: string;
    label: string;
    fields: AgreementReviewField[];
}

export interface CorporateAgreementReview {
    groups: AgreementReviewGroup[] | null;
    isDraft: boolean | null;
    missingFields: string[] | null;
    signMethod: string | null;
    esignStatus: string | null;
    esignReference: string | null;
    generatedDocumentKey: string | null;
    generatedPdfKey: string | null;
    canResend: boolean;
    updatedAt: string | null;
}
