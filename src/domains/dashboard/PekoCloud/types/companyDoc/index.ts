export interface CompanyDocInfoCardProps {
    icon: string;
    title: string;
    value: number | undefined | string;
    bgColor: string;
}
export interface userPayload {
    userType: string;
    userId: number;
}
export interface CompanyDocListingPayload extends userPayload {
    page: number;
    itemsPerPage: number;
    searchText: string;
}
interface DocumentInfo {
    id?: number;
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
export interface CompanyDocListingResponse {
    result: DocumentInfo[];
    totalData: number;
}
export interface CompanyDocInfoResponse {
    totalDocuments: number;
    activeDocuments: number;
    expiredDocuments: number;
    completionLevel: number | string;
}
export interface CompanyDocCreatePayload extends userPayload {
    documentName: string;
    documentNumber: string;
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
export interface CompanyDocCreateResponse {
    success: boolean;
    data: DocumentData;
}
export interface CompanyDocUpdatePayload extends userPayload {
    documentName: string;
    documentNumber: string;
    documentType: string; // Assuming this could be any string. If it has specific possible values, consider using an enum or union type.
    issueDate: string;
    expireDate: string;
    documentBase: string; // Assuming "base64" is a fixed value for this field, otherwise use string
    documentFormat: string;
    docId: number;
}
export interface CompanyDocDeletePayload extends userPayload {
    docId: string;
}
