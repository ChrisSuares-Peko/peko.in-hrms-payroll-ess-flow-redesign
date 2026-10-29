// reimbursement Section
export type reimbursementAllListingPayload = {
    userId: number;
    userType: string;
    page: number;
    limit: number;
    year?: number;
    month?: number | string;
    search?: string;
};
interface Data {
    corporateUser: string;
    employee: {
        employeeInformation: {
            employeeId: string;
        };
        personalInformation: {
            fullName: string;
        };
        id: string;
    };
    expenseDate: string; // ISO 8601 formatted date string
    managerEmail: string;
    supportingDocs: string;
    expenseDetails: string;
    totalPay: number;
    transferMethod: string;
    paymentStatus: string;
    createdAt: string; // ISO 8601 formatted date string
    updatedAt: string; // ISO 8601 formatted date string
    id: string;
}
export type reimbursementAllListingResponse = {
    count: number;
    rows: Data[];
};
export type reimbursementListingPayload = {
    userId: number;
    userType: string;
    eId: string | undefined;
    page: number;
    limit: number;
    year: number;
    month: number | string;
    searchText?: string;
};
interface ExpenseData {
    corporateUser: string;
    employee: string;
    expenseDate: string; // ISO 8601 formatted date string
    managerEmail: string;
    supportingDocs: string;
    expenseDetails: string;
    totalPay: number;
    transferMethod: string;
    paymentStatus: string;
    createdAt: string; // ISO 8601 formatted date string
    updatedAt: string; // ISO 8601 formatted date string
    id: string;
}
export type reimbursementListingResponse = {
    count: number;
    rows: ExpenseData[];
};

export type reimbursementTableType = {
    id: string;
    expenseDate: string;
    expenseDetails: string;
    amountPaid: string;
    transferMethod: string;
    paymentStatus: string;
    invoice: string;
    action: any;
    supportingDocs: string;
    employeeId: string;
    employeeName: string;
    managerEmail: string;
    // Employee-submission lifecycle (ESS flow) — undefined for HR-created reimbursements.
    status?: string;
};
export type reimbursementDeletePayload = {
    userId: number;
    userType: string;
    rId: string | undefined;
};
export type reimbursementDeletedResponse = {
    status: boolean;
    responseCode: string;
    message: string;
    data: {
        corporateUser: string;
        employee: string;
        expenseDate: string;
        managerEmail: string;
        supportingDocs: string;
        expenseDetails: string;
        totalPay: number;
        transferMethod: string;
        paymentStatus: string;
        createdAt: string;
        updatedAt: string;
        id: string;
    };
};
type SupportingDocs = {
    base64: string;
    format: string;
};
export type createReimbursementPayload = {
    userId: number;
    userType: string;
    employeeId: string;
    expenseDate: string;
    supportingDocs: SupportingDocs | null | string;
    expenseDetails: string;
    totalPay: number;
    supportingDocFormat: string;
};
export type createReimbursementResponse = {
    corporateUser: string;
    employee: string;
    expenseDate: string; // Assuming ISO 8601 date format
    managerEmail: string;
    supportingDocs: string; // Assuming it's a URL to the supporting document
    expenseDetails: string;
    totalPay: number;
    transferMethod: string;
    paymentStatus: string;
    createdAt: string; // Assuming ISO 8601 date format
    updatedAt: string; // Assuming ISO 8601 date format
    id: string;
};
export type singleReimbursementPayload = {
    userId: number;
    userType: string;
    reimbursementId?: string;
};
export type singleReimbursementResponse = {
    corporateUser: string;
    employee: string;
    expenseDate: string;
    managerEmail: string;
    supportingDocs: string;
    expenseDetails: string;
    totalPay: number;
    transferMethod: string;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
    id: string;
};
export type updateReimbursementPayload = {
    userId: number;
    userType: string;
    reimbursementId: string;
    expenseDate: string;
    supportingDocs: SupportingDocs | null | string;
    supportingDocFormat: string;
    expenseDetails: string;
    totalPay: number;
};
export interface ReimbursementRequestFormType {
    employeeId: string;
    expenseDate: string;
    supportingDocs: string;
    supportingDocFormat: string;
    expenseDetails: string;
    category?: string;
    description?: string;
    totalPay: number;
}
