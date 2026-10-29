import { UserPayload } from '@customtypes/general';

export interface Biller {
    blr_id: string;
    blr_name: string;
    blr_category_name: string;
    blr_coverage?: string;
    isExisting?: boolean;
    isDisabled?: boolean;
    selected?: boolean;
}

export type FetchMDMMode = 'first100' | 'byCategory' | 'selected';

export interface FetchBillerMDMPayload extends UserPayload {
    mode: FetchMDMMode;
    category?: string;
    billerIds?: string[];
}

export interface BillerMDMRecord {
    billerId: string;
    billerName: string | null;
    billerCategory: string | null;
    billerCoverage: string | null;
    data: Record<string, unknown>;
    updatedAt: string;
}

export interface FetchBillerMDMResponse {
    billers: BillerMDMRecord[];
    totalCount: number;
}

export interface RefreshMDMPayload extends UserPayload {
    mode?: FetchMDMMode;
    category?: string;
    billerIds?: string[];
}

export interface BillerPreviewResponse {
    preview: Biller[];
    totalCount: number;
}

export interface BillerRecord {
    billerId: string;
    billerName: string | null;
    /**
     * The raw MDM billerName from the latest BillAvenue refresh. May differ from `billerName`
     * if an admin updated the display name or the MDM record has changed since insert.
     */
    mdmBillerName: string | null;
    /** True when mdmBillerName differs from the saved billerName — shows the "changed in MDM" badge. */
    hasMdmNameChanged: boolean;
    billerCategory: string | null;
    billerCoverage: string | null;
    hasMDMData: boolean;
    mdmUpdatedAt: string | null;
    status: 'active' | 'disabled';
}

export interface BillerTableParams {
    page: number;
    pageSize: number;
    sortField?: string;
    sortOrder?: 'ASC' | 'DESC';
    status?: string;
    category?: string;
    search?: string;
    hasMDMData?: string;
}

export interface BillersListResponse {
    billers: BillerRecord[];
    total: number;
    activeCount: number;
    disabledCount: number;
    lastUpdated: string | null;
}

export interface RefreshBillersResponse {
    totalFetched: number;
    failedCount: number;
    autoDisabledCount: number;
    lastUpdated: string;
}

export interface RefreshProgressEvent {
    type: 'progress';
    batchNumber: number;
    totalBatches: number;
    totalFetched: number;
    failedCount: number;
}

export interface AddBillerPayload {
    billerId: string;
    billerName?: string;
    billerCategory?: string;
    billerCoverage?: string;
}

export interface AddBillerResponse {
    billerId: string;
    billerName: string | null;
    billerCategory: string | null;
    billerCoverage: string | null;
    apiData: Record<string, unknown> | null;
    totalBillers: number;
}

export interface RemoveBillerPayload {
    billerIds: string[];
}

export interface DisableBillerPayload {
    billerIds: string[];
}

export interface EnableBillerPayload {
    billerIds: string[];
}

export interface PreviewExcelPayload extends UserPayload {
    file: File;
}

export interface PreviewJsonPayload extends UserPayload {
    billersJsonData: Array<{ billerId: string }>;
}

export interface BulkUploadPayload extends UserPayload {
    selectedBillers: Biller[];
}

export interface BulkUploadPayloadForHook {
    selectedBillers: Biller[];
}

export interface BulkRemovePayload extends UserPayload {
    billerIds: string[];
}

export interface ApiResponse<T> {
    status: boolean;
    message: string;
    data?: T;
    responseCode: string;
}

// Internally-tracked BillAvenue vendor wallet balance (no vendor balance API).
export interface BillAvenueWallet {
    configured: boolean;
    balance: number | null;
    threshold: number;
    currency: string;
    updatedAt: string | null;
    updatedBy: number | string | null;
}

export interface UpdateBillAvenueWalletPayload {
    balance: number;
    threshold?: number;
}
