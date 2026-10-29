export interface DocumentSizeLimitRow {
    documentName: string;
    label: string;
    maxSizeKb: number;
    defaultMaxSizeKb: number;
}

export type DocumentTotalKey = 'totalUploadKb' | 'vendorPackKb';

export type DocumentTotalValues = Record<DocumentTotalKey, number>;

export interface DocumentTotalLimits extends DocumentTotalValues {
    defaults: DocumentTotalValues;
}

export interface DocumentSizeLimitsResponse {
    documents: DocumentSizeLimitRow[];
    totals: DocumentTotalLimits;
    minSizeKb: number;
    maxSizeKb: number;
    minTotalKb: number;
    maxTotalKb: number;
}
