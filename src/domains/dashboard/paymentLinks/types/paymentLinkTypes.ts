
export interface CreatePaymentLinkPayload {
    userId: string | number;
    userType: string;
    amount: number;
    purpose_message: string;
    expiry_time: number; // in minutes
    customerName?:string;
    customerEmail?:string;
    customerPhone?:string;
    accessKey?:"invoice" | "payment_link";
}

export interface ProviderResponse {
    decentro_txn_id: string;
    api_status: string;
    message: string;
    data?: {
        upi_uris?: {
            common_uri?: string;
        };
        transaction_status?: string;
    };
    response_key: string;
}

export interface CreatePaymentLinkResponse {
    paymentLink?: string;
    reference_id?: string;
    decentro_txn_id?: string | null;
    transaction_status?: string;
    providerResponse?: ProviderResponse;
    // NuPay initiate_transaction fields
    nupayTxnId?: string | null;
    transactionStatus?: string;
    payeeVpa?: string | null;
    requestAmount?: string;
    totalAmount?: string;
    expiresAt?: string | null;
}

export interface CreateDynamicQrPayload {
    userId: string | number;
    userType: string;
    amount: number;
    purpose_message: string;
    expiry_time: number;
}

export interface CreateDynamicQrResponse {
    dynamic_qr_image: string;
    reference_id: string;
    decentro_txn_id: string | null;
    transaction_status: string;
    providerResponse?: Record<string, any>;
}

// ── UPI Collect ──────────────────────────────────────────────────────────────

export interface SendUpiCollectPayload {
    userId: string | number;
    userType: string;
    full_name: string;
    email: string;
    phone_number: string;
    amount: string;          // string per backend validation
    expires_at: number;      // integer hours
    purpose_message?: string;
    payer_upi:string;
}

export interface SendUpiCollectResponse {
    paymentLink: string;
    createdAt: string;
    orderId: string;
    customerName: string;
    expires_at: string;
}

export type ENachFrequency =
    | 'Adhoc'
    | 'Daily'
    | 'Weekly'
    | 'Monthly'
    | 'Quarterly'
    | 'Semi-Annually'
    | 'Yearly'
    | 'Bi-Monthly';

export type ENachCategoryCode =
    | 'API'
    | 'B2B'
    | 'CRED'
    | 'MAND'
    | 'EDU'
    | 'PREM'
    | 'PAYM'
    | 'LONS'
    | 'LONP'
    | 'MF'
    | 'OTH'
    | 'SUB'
    | 'TRE'
    | 'TAX'
    | 'ELEC'
    | 'GAS'
    | 'TELE'
    | 'WAT';

export interface ENachMandatePayload {
    userId: string | number;
    userType: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    account_number: string;
    account_type: string;
    bank_code: string;
    authentication_mode: string;
    amount_rule: 'fixed' | 'max';
    category_code: ENachCategoryCode;
    amount: number;
    frequency: ENachFrequency;
    start_date: string;
    end_date: string;
}

export interface ENachMandateData {
    reference_id: string;
    decentro_txn_id: string;
    status: string;
    mandate_link: string;
    message: string;
    providerResponse: Record<string, any>;
}

export interface ENachMandateValidationError {
    code: number;
    status: 'error';
    errors: string[];
}

export interface ENachMandateListItem {
    id: string;
    reference_id?: string;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    account_number?: string;
    account_type?: string;
    authentication_mode?: string;
    amount?: number;
    frequency?: string;
    start_date?: string;
    end_date?: string;
    amount_rule?: 'fixed' | 'max' | string;
    category_code?: ENachCategoryCode | string;
    status?: string;
    mandate_link?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ENachMandateListResponse {
    rows: ENachMandateListItem[];
    total: number;
}

export interface ManageENachMandatePayload {
    userId: string | number;
    userType: string;
    reference_id: string;
    action?: 'CANCEL';
}

export interface ManageENachMandateData {
    action: 'CANCEL';
    status: string;
    message?: string;
    reference_id: string;
    decentro_txn_id?: string;
    decentro_mandate_id?: string;
    mandate_status_description?: string;
    response_key?: string;
    provider_reference_id?: string;
}

export interface ExecuteENachMandatePaymentPayload {
    userId: string | number;
    userType: string;
    reference_id: string;
    amount: number;
    debit_date: string;
    split_settlement_rule_urn?: string;
}

export interface ExecuteENachMandatePaymentData {
    reference_id: string;
    execution_reference_id: string;
    status: string;
    amount: number;
    payment_date?: string | null;
    split_settlement_rule_urn?: string | null;
    decentro_txn_id?: string | null;
    decentro_mandate_id?: string | null;
    response_key?: string | null;
}

export interface ENachMandateExecutionListItem {
    id: number | string;
    execution_reference_id: string;
    mandate_reference_id: string;
    payment_date?: string | null;
    processed_or_failed_at?: string | null;
    amount: number | string;
    status: string;
    createdAt?: string;
}

export interface ENachMandateInitiationGuard {
    can_initiate: boolean;
    frequency: string;
    last_counted_execution_at?: string | null;
    next_allowed_at?: string | null;
    message?: string;
}

export interface ENachMandateExecutionListResponse {
    rows: ENachMandateExecutionListItem[];
    total: number;
    initiation_guard?: ENachMandateInitiationGuard;
}

export interface ENachMandateStatusData {
    status: string;
    status_type: 'success' | 'failed' | 'pending';
    reference_id: string;
    decentro_txn_id?: string;
    decentro_mandate_id?: string;
    providerResponse?: Record<string, any> | null;
}

export interface GetENachMandatesParams {
    userId: string | number;
    userType: string;
    page?: number;
    limit?: number;
    search?: string;
}



export interface OnboardingRecord {
    id: number;
    credentialId: number;
    status: 'pending' | 'active' | 'suspended' | 'rejected' | 'approval-pending' | 'on_hold';
    vendor?: string | null;
    entityType?: string | null;
    remarks?: string | null;
    providerResponse?: Record<string, any> | null;
    businessName: string;
    bankName: string | null;
    accountNumber: string | null;
    ifsc: string | null;
    pan: string | null;
    panVerifiedAt: string | null;
    accountHolderName: string | null;
    bankVerifiedAt: string | null;
    bankVerificationResponse: Record<string, any> | null;
    virtualAccountId: string | null;
    virtualAccountNumber: string | null;
    virtualIfsc: string | null;
    virtualAccountIdV3: string | null;
    virtualAccountNumberV3: string | null;
    virtualIfscV3: string | null;
    settlementAccountUrn: string | null;
    settlementSetupAt: string | null;
    consentAcceptedAt: string | null;
    activatedAt: string | null;
    createdAt: string;
    updatedAt: string;
    phone: string | null;
    email: string | null;
    savedBankPhone: string | null;
    profileCompanyName: string | null;
    profilePan: string | null;
    profilePanVerified: boolean;
    profileBankName: string | null;
    profileAccountNumber: string | null;
    profileIfsc: string | null;
}

export interface VerifyBankResponse {
    match: boolean;
    bankNameFromIfsc: string | null;
}

export interface OnboardingProfileContext {
    phone: string | null;
    profileCompanyName: string | null;
    profilePan: string | null;
    profilePanVerified: boolean;
    profileBankName: string | null;
    profileAccountNumber: string | null;
    profileIfsc: string | null;
}

export interface Step1Payload {
    userId: string | number;
    userType: string;
    businessName: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
}

export interface Step2Payload {
    userId: string | number;
    userType: string;
    consentAccepted: true;
}
export interface TransactionRecord {
    key: string;
    source?: 'payment_link' | 'payment_qr';
    dateTime: string;
    transactionId: string;
    amount: number;
    status: string;
    reference: string;
    customerName: string | null;
    customerPhone: string | null;
}

export interface TransactionsPaginatedData {
    transactions: TransactionRecord[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface TransactionDetailData {
    key: string;
    source?: 'payment_link' | 'payment_qr';
    transactionId: string;
    dateTime: string;
    amount: number;
    status: string;
    statusColor: string;
    reference: string;
    customerName: string;
    customerPhone: string;
    paymentAmount: number;
    paymentMethod: string;
    paymentLink:string;
    dynamic_qr_image?: string | null;
    purpose_message:string;
    utr?: string | null;
    settlementUtr?: string | null;
    settledDate?: string | null;
    timeline: { label: string; time: string; color: string }[];
}

export interface GetTransactionsParams {
    userId: string | number;
    userType: string;
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    paymentMethod?: string;
}

export interface ExportTransactionsParams {
    userId: string | number;
    userType: string;
    type: 'excel';
    status?: string;
    search?: string;
}

export interface ExportBankDetailsPdfParams {
    userId: string | number;
    userType: string;
    type: 'pdf';
}

export type DashboardData = {
    activePaymentLinksCount: number;
    pendingPaymentLinksCount: number;
    totalAmountThisMonth:number;
    transactions: {
        key?: string;
        source?: 'payment_link' | 'payment_qr';
        customerName: string | null;
        customerPhone: string | null;
        reference_id: string | null;
        decentro_txn_id: string | null;
        status: string;
        createdAt: string;
        amount:number;
    }[];
};

export type CollectPaymentAction =
    | 'createLink'
    | 'generateQr'
    | 'bankDetails'
    | 'upiCollect'
    | 'enach'
    | 'virtualAccountStatement'
    | null;

export interface VirtualAccountStatementSummary {
    accountName: string;
    virtualAccountNumber: string;
    ifsc: string;
    currentBalance: number;
}

export interface VirtualAccountStatementRow {
    key: string;
    dateTime: string;
    transactionId: string;
    description: string;
    type: 'Credit' | 'Debit';
    amount: number;
    balance: number;
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

// ── Virtual Account Statement API types ──────────────────────────────────────

export interface VirtualAccountAccountDetails {
    accountName: string | null;
    virtualAccountNumber: string;
    ifsc: string | null;
}

export interface VirtualAccountStatementSummaryApi {
    totalAmountPaid: number;
    totalAmountReceived: number;
    totalTransactions: number;
}

export interface VirtualAccountStatementApiRow {
    key: string;
    dateTime: string | null;
    transactionId: string | null;
    description: string | null;
    type: string | null;
    amount: number | null;
    paymentMode: string | null;
    payerName: string | null;
    payerAccountNumber: string | null;
    payerIfsc: string | null;
    transferType: string | null;
    customerReferenceNumber: string | null;
    raw: Record<string, any>;
}

export interface VirtualAccountStatementApiResponse {
    accountDetails: VirtualAccountAccountDetails;
    summary: VirtualAccountStatementSummaryApi;
    statement: {
        from: string;
        to: string;
        page: number;
        rows: VirtualAccountStatementApiRow[];
    };
}

export interface GetVirtualAccountStatementParams {
    userId: string | number;
    userType: string;
    from: string;
    to: string;
    page?: number;
}

export interface VirtualAccountBalanceData {
    virtualAccountNumber: string;
    accountName: string | null;
    ifsc: string | null;
    balance: number | null;
    providerData: Record<string, any>;
}

export interface VirtualAccountDetailsData {
    name: string | null;
    pan: string | null;
    mobile: string | null;
    email: string | null;
    address: string | null;
    profileAddress?: string | null;
    virtualAccountNumber: string | null;
    activatedAt: string | null;
}

export interface UpdateVirtualAccountPayload {
    userId: string | number;
    userType: string;
    name: string;
    pan: string;
    email?: string;
    mobile?: string;
    address?: string;
}

export interface SettlementRequestRow {
    key: string;
    requestedOn: string;
    requestId: string;
    amount: number;
    remarks: string;
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

export interface CreateSettlementRequestPayload {
    userId: string | number;
    userType: string;
    amount: number;
    transferType?: 'IMPS' | 'NEFT';
    remarks?: string;
}

export interface CreateSettlementRequestResponse {
    id: string;
    referenceId: string;
    decentroTxnId: string | null;
    amount: number;
    transferType: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    settledAt: string | null;
    availableBalance: number;
    providerResponse: Record<string, any> | null;
}

export interface SettlementRequestDbRow {
    id: string;
    credential_id: number;
    amount: string;
    transfer_type: string;
    reference_id: string;
    decentro_txn_id: string | null;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    beneficiary_name: string | null;
    beneficiary_account_number: string | null;
    beneficiary_ifsc: string | null;
    settled_at: string | null;
    metadata: { remarks?: string; providerResponse?: any; virtualAccountNumber?: string } | null;
    created_at: string;
    updated_at: string;
}

export interface SettlementRequestsListResponse {
    rows: SettlementRequestDbRow[];
    count: number;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}


export interface PaymentLinkOnboardingProps {
    onboardingRecord?: OnboardingRecord | null;
    refresh:()=>void;
    title?:string;
}
export interface CreatePaymentLinkModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit:()=>void;
}
export interface ENachManageModalProps {
    open: boolean;
    mandate: ENachMandateListItem | null;
    onClose: () => void;
    onUpdated?: () => void;
}



export interface UpiCollectFormState {
    amount: string;
    upiId: string;
    customerName: string;
    email: string;
    phone: string;
    expiry: number;
}

export const upiCollectInitialValues: UpiCollectFormState = {
    amount: '',
    upiId: '',
    customerName: '',
    email: '',
    phone: '',
    expiry: 24,
};

export interface UpiCollectFormViewProps {
    onCancel: () => void;
    onSend: (values: UpiCollectFormState) => void;
    loading?: boolean;
}
