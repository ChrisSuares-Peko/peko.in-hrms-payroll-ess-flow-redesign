export interface userPayload {
    userType: string;
    userId: number;
}
export interface AssetListingPayload extends userPayload {
    page?: number;
    itemsPerPage?: number;
    searchText?: string;
}
interface CloudEmployee {
    id: number;
    employeeName: string;
    employeeEmail: string;
    department: string;
    joiningDate: string;
    used: string;
    usingFor: string;
}

interface Asset {
    id: number;
    assetName: string;
    assetCategory: string;
    serialNumber: string;
    purchasedDate: string;
    assetType: string;
    warranty: string;
    amount: string;
    amountRecurring: null | string;
    vendor: null | string;
    batchNumber: null | string;
    createdAt: string;
    updatedAt: string;
    cloudEmployeeId: number;
    cloud_employee: CloudEmployee;
    status: string;
}
export interface AssetListingResponse {
    result: Asset[];
    totalData: number;
}
export interface AssetsInfoResponse {
    totalAssets: number;
    totalAssigned: number;
    availableAssets: number;
    totalSpent: number;
}
export interface AssetCreatePayload extends userPayload {
    cloudEmployeeId: number;
    assetName: string;
    assetCategory: string;
    serialNumber: string;
    purchasedDate: string;
    assetType: string;
    warranty: string;
    amount: string;
    amountRecurring?: string | null;
    vendor?: string | null;
    batchNumber?: string | null;
}
interface Asset {
    id: number;
    cloudEmployeeId: number;
    assetName: string;
    assetCategory: string;
    serialNumber: string;
    purchasedDate: string;
    assetType: string;
    warranty: string;
    amount: string;
    updatedAt: string;
    createdAt: string;
}
export interface AssetCreateResponse {
    success: boolean;
    data: Asset;
}
export interface AssetUpdatePayload extends userPayload {
    cloudEmployeeId: number;
    assetName: string;
    assetCategory: string;
    serialNumber: string;
    purchasedDate: string;
    assetType: string;
    warranty: string;
    amount: string;
    vendor: string;
    batchNumber: string;
    assetId: string;
}
export interface AssetDeletePayload extends userPayload {
    assetId: string;
}

export interface AssetDocListingPayload extends userPayload {
    page: number;
    itemsPerPage: number;
    searchText: string;
    assetId: number;
}
interface DocumentInfo {
    id: number;
    documentName: string;
    documentNumber: string;
    documentCategory: string;
    documentType: string;
    issueDate: string;
    expireDate: string;
    document: string;
    createdAt: string;
    updatedAt: string;
}
export interface AssetDocListingResponse {
    result: DocumentInfo[];
    totalData: number;
}
export interface AssetDocCreatePayload extends userPayload {
    documentName: string;
    documentNumber: string;
    documentType: string;
    issueDate: string;
    expireDate: string;
    documentBase: string;
    documentFormat: string;
}
interface DocumentData {
    id: number;
    documentName: string;
    documentNumber: string;
    documentType: string; // Usually an email here, consider a more appropriate name if possible.
    issueDate: string;
    expireDate: string;
    documentCategory: string; // Could be enum if there are limited set of categories.
    document: string;
    updatedAt: string;
    createdAt: string;
}
export interface AssetDocCreateResponse {
    success: boolean;
    data: DocumentData;
}
export interface AssetDocUpdatePayload extends userPayload {
    documentName: string;
    documentNumber: string;
    documentType: string; // Assuming this could be any string. If it has specific possible values, consider using an enum or union type.
    issueDate: string;
    expireDate: string;
    documentBase: string; // Assuming "base64" is a fixed value for this field, otherwise use string
    documentFormat: string;
    docId: number;
}
export interface AssetDocDeletePayload extends userPayload {
    docId: string;
}
export interface AssetUsageListingPayload extends userPayload {
    page: number;
    itemsPerPage: number;
    searchText: string;
    assetId: number;
}
interface CloudEmployee {
    id: number;
    employeeName: string;
    employeeEmail: string;
    department: string;
    joiningDate: string;
    employeeID: string;
}

interface AssetUsage {
    id: number;
    usageCategory: string;
    assignDate: string;
    returnDate: string | null;
    returnStatus: string | null;
    remarks: string | null;
    createdAt: string;
    updatedAt: string;
    cloudEmployeeId: number;
    cloudAssetId: number;
    cloud_employee: CloudEmployee;
}
export interface AssetUsageListingResponse {
    result: AssetUsage[];
    totalData: number;
}
export interface AssetUsageCreatePayload extends userPayload {
    cloudEmployeeId: number;
    assetId: number;
    existUsageId: number;
    assignDate: string;
}

interface AssignmentDetails {
    id: number;
    cloudEmployeeId: number;
    cloudAssetId: number;
    assignDate: string;
    usageCategory: 'ASSET' | string;
    updatedAt: string;
    createdAt: string;
}
export interface AssetUsageCreateResponse {
    success: boolean;
    data: AssignmentDetails;
}
export interface AssetUsageUpdatePayload extends userPayload {
    cloudEmployeeId: number;
    cloudAssetId: number;
    assignDate: string; // Consider using Date if handling dates as Date objects
    returnDate: string; // Consider using Date if handling dates as Date objects
    returnStatus: string; // Can be an enumeration if there are predefined statuses
    remarks: string;
    usageId: string;
}
export interface AssetUsageDeletePayload extends userPayload {
    usageId: string;
}

export interface SingleAssetDetailsPayload extends userPayload {
    assetId: string;
}
export interface SingleAssetDetailsResponse {
    success: boolean;
    data: {
        id: number;
        assetName: string;
        assetCategory: string;
        serialNumber: string;
        purchasedDate: string;
        assetType: string;
        warranty: string;
        amount: string;
        amountRecurring: string;
        vendor: string;
        batchNumber: string;
        createdAt: string;
        updatedAt: string;
        cloudEmployeeId: number;
        credentialId: number;
        status: string;
    };
}
export interface LatestAssetUsageResponse {
    id: number;
    usageCategory: string;
    assignDate: string;
    returnDate: string | null;
    returnStatus: string | null;
    remarks: string | null;
    createdAt: string;
    updatedAt: string;
    cloudEmployeeId: number;
    cloudAssetId: number;
    cloudFleetId: number | null;
    cloud_employee: CloudEmployee;
}

export interface TableDataItem {
    id: number;
    actions: string;
    amount: string;
    assetCategory: string;
    assetName: string;
    assetType: string;
    department: string;
    employeeId: number;
    joiningDate: string; // ISO date string
    purchasedDate: string; // ISO date string
    serialNumber: string;
    status: string;
    used: string;
    usedBy: string;
    usingFor: string;
    warranty: string;
}
