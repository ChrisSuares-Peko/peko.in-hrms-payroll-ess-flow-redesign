export interface FinancialsInfoCardProps {
    icon: string;
    title: string;
    value: number | undefined | string;
    bgColor: string;
}
export interface userPayload {
    userType: string;
    userId: number;
}
export interface FinancialDocListingPayload extends userPayload {
    page: number;
    itemsPerPage: number;
    searchText: string;
}
interface DocumentInfo {
    id: number;
    documentName: string;
    documentNumber: string;
    documentCategory: string; // This could be an enum if there are a limited number of categories.
    documentType: string; // This appears to be an email, but the name suggests a type. Consider renaming if appropriate.
    issueDate: string;
    expireDate: string;
    document: string; // URL to the document
    createdAt: string;
    updatedAt: string;
}
export interface FinancialDocListingResponse {
    result: DocumentInfo[];
    totalData: number;
}
export interface FinancialDocCreatePayload extends userPayload {
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
export interface FinancialDocCreateResponse {
    success: boolean;
    data: DocumentData;
}
export interface FinancialDocUpdatePayload extends userPayload {
    documentName: string;
    documentNumber: string;
    documentType: string; // Assuming this could be any string. If it has specific possible values, consider using an enum or union type.
    issueDate: string;
    expireDate: string;
    documentBase: string; // Assuming "base64" is a fixed value for this field, otherwise use string
    documentFormat: string;
    docId: number;
}
export interface FinancialDocDeletePayload extends userPayload {
    docId: string;
}

export interface ChequeBookListingPayload extends userPayload {
    page?: number;
    itemsPerPage?: number;
    searchText?: string;
}
type ChequeBook = {
    id: number;
    bookId: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    currency: string;
    currencyDivision: string;
    chequeStarting: string;
    numberOfLeaves: string;
    accountBalance: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
    document: string;
};
export interface ChequeBookListingResponse {
    result: ChequeBook[];
    totalData: number;
}

export interface SingleChequeBookPayload extends userPayload {
    chequeBookId: string;
}
type ChequeBookData = {
    id: number;
    bookId: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    currency: string;
    currencyDivision: string;
    chequeStarting: string;
    numberOfLeaves: string;
    accountBalance: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
};
export interface SingleChequeBookResponse {
    success: boolean;
    data: ChequeBookData;
}
type ChequeBookCreateData = {
    id: number;
    bookId: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    currency: string;
    currencyDivision: string;
    chequeStarting: string;
    numberOfLeaves: number;
    accountBalance: string;
    status: string;
    credentialId: number;
    updatedAt: string;
    createdAt: string;
};
export interface CreateChequeBookResponse {
    success: boolean;
    data: ChequeBookCreateData;
}
export interface CreateChequeBookPayload extends userPayload {
    bookId: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    currency: string;
    currencyDivision: string;
    chequeStarting: string;
    numberOfLeaves: number;
    accountBalance: string;
    status: string;
}
export interface ChequeBookUpdatePayload extends userPayload {
    bookId: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    currency: string;
    currencyDivision: string;
    chequeStarting: string;
    numberOfLeaves: number;
    accountBalance: string;
    status: string;
    chequeBookId: string;
}

export interface ChequeBookDeletePayload extends userPayload {
    chequeBookId: string;
}
// cheque leaves
export interface ChequeLeavesListingPayload extends userPayload {
    page?: number;
    itemsPerPage?: number;
    searchText?: string;
    chequeBookId?: string;
}
type Cheque = {
    id: number;
    type: string;
    payeeName: string;
    chequeBookNumber: string;
    bankAccount: string;
    chequeNumber: string;
    dateOfCheque: string;
    dueDate: string;
    amount: string;
    signedBy: string;
    remarks: string;
    voucherReferance: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
    cloudChequeBookId: number;
    document: string;
};
export interface ChequeLeavesListingResponse {
    result: Cheque[];
    totalData: number;
}
export interface SingleChequeLeafPayload extends userPayload {
    chequeLeafId: string;
}
type ChequeData = {
    id: number;
    type: string;
    payeeName: string;
    chequeBookNumber: string;
    bankAccount: string;
    chequeNumber: string;
    dateOfCheque: string;
    dueDate: string;
    amount: string;
    signedBy: string;
    remarks: string;
    voucherReferance: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
    cloudChequeBookId: number;
};

export interface SingleChequeLeafResponse {
    success: boolean;
    data: ChequeData;
}
type ChequeLeafData = {
    id: number;
    cloudChequeBookId: number;
    type: 'Credit' | 'Debit';
    payeeName: string;
    chequeBookNumber: string;
    bankAccount: string;
    chequeNumber: string;
    dateOfCheque: string;
    dueDate: string;
    amount: string;
    signedBy: string;
    remarks?: string; // optional
    voucherReferance?: string; // optional
    status: string;
    credentialId: number;
    updatedAt: string;
    createdAt: string;
};

export interface CreateChequeLeafResponse {
    success: boolean;
    data: ChequeLeafData;
}
export interface CreateChequeLeafPayload extends userPayload {
    cloudChequeBookId: number;
    type: 'Credit' | 'Debit';
    payeeName: string;
    chequeBookNumber: string;
    bankAccount: string;
    chequeNumber: string;
    dateOfCheque: string;
    dueDate: string;
    amount: string;
    signedBy: string;
    remarks?: string; // optional
    voucherReferance?: string; // optional
    status: string;
}
export interface ChequeLeafUpdatePayload extends userPayload {
    type: 'Credit' | 'Debit';
    payeeName: string;
    chequeBookNumber: string;
    bankAccount: string;
    chequeNumber: string;
    dateOfCheque: string;
    dueDate: string;
    amount: string;
    signedBy: string;
    remarks?: string; // optional
    voucherReferance?: string; // optional
    status: string;
    chequeLeafId: string;
}

export interface ChequeLeafDeletePayload extends userPayload {
    chequeLeafId: string;
}

export interface FinancialInfoResponse {
    totalDocuments: number;
    totalCheques: number;
    chequesPending: number;
    chequesCleared: number;
}
