export type CustomerStats = {
    totalCustomers: number;
    activeCustomers: number;
    totalRevenue: number;
    avgTransaction: number;
};

export type TopCustomerBase = {
    id: number;
    rank: number;
    name: string;
    transactionCount: number;
    totalRevenue: number;
    changePercent?: number;
    percentOfTotal?: number;
};

export type CustomerDashboardResponse = {
    totalCustomers: number;
    activeCustomers: number;
    totalRevenue: number;
    avgTransaction: number;
    topByRevenue: TopCustomerBase[];
    topByTransactions: TopCustomerBase[];
};

export type BankAccountFormValues = {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    swiftCode?: string;
    verifyToken?: string;
    ifsc_details?: { bank: string };
};

export type VerifyCustomerBankPayload = {
    bank_account: string;
    ifsc: string;
    name: string;
};

export type VerifyCustomerBankResponse = {
    account_status: string;
    name_match_score: number;
    name_match_result: string;
    reference_id: string;
    verifyToken: string;
};

export type AddCustomerFormValues = {
    name: string;
    personOfContact?: string;
    gstin?: string;
    phoneNumber: string;
    email: string;
    upiId?: string;
    notes?: string;
    primaryAddress: string;
    primaryCity: string;
    primaryState: string;
    primaryPincode: string;
    primaryCountry: string;
    shippingSameAsPrimary?: boolean;
    shippingAddress?: string;
    shippingCity?: string;
    shippingState?: string;
    shippingPincode?: string;
    bankAccounts?: BankAccountFormValues[];
};

export type CustomerRow = Omit<AddCustomerFormValues, 'bankAccounts'> & {
    id: string;
    transactions: number;
    status: 'Active' | 'Inactive';
    bankDetails?: BankAccountFormValues[];
};

export type GetAllCustomersResponse = {
    customers: CustomerRow[];
    recordsTotal: number;
};

export interface GetAllCustomersPayload {
    sort?: 'ASC' | 'DESC';
    sortField?: string;
    page?: number;
    itemsPerPage?: number;
    searchText?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
}

// Bulk Upload Customer — bank details are intentionally excluded (see BulkUploadCustomerModal),
// so this only ever carries the fields also on AddCustomerFormValues minus bankAccounts.
export type BulkCustomerRow = {
    name: string;
    personOfContact: string;
    gstin: string;
    phoneNumber: string;
    email: string;
    upiId: string;
    notes: string;
    primaryAddress: string;
    primaryCity: string;
    primaryState: string;
    primaryPincode: string;
    primaryCountry: string;
    shippingAddress: string;
    shippingCity: string;
    shippingState: string;
    shippingPincode: string;
    // Never populated from the Excel sheet itself — added interactively in the row edit
    // drawer (same AddBankAccountModal + live verify-bank flow as the single Add Customer
    // form), since a bank account needs a live HMAC verification a spreadsheet cell can't do.
    bankDetails?: BankAccountFormValues[];
    validated: boolean;
    errors: string[];
};

export type BulkCustomerUploadResponse = {
    jsonData: BulkCustomerRow[];
    fullyValidated: boolean;
};

export type BulkCustomerCreatePayload = {
    jsonData: BulkCustomerRow[];
};
