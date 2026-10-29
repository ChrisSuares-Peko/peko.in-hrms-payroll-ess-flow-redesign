export interface ProcureStats {
    activePurchaseOrders: { count: number; vsLastMonth: number };
    unpaidInvoices:       { count: number; amount: number };
    openRfqs:             { count: number; vsLastMonth: number };
    committedSpend:       { amount: number; vsLastMonth: number; currency: string };
}

export interface DashboardActiveRfq {
    id: number;
    refNumber: string;
    title: string;
    type: string;
    submissionDeadline: string;
    daysRemaining: number;
    estimatedTotal: string;
    sentAt: string | null;
    vendorInvites: { total: number; submitted: number; pending: number; declined: number };
}

export interface DashboardActivity {
    type: string;
    message: string;
    date: string;
    refId: number;
    refType: string;
}

export interface DashboardData {
    stats:      ProcureStats;
    activeRfqs: DashboardActiveRfq[];
    activity:   DashboardActivity[];
}

export interface DashboardSpendCategory {
    category:   string;
    amount:     number;
    percentage: number;
}

export interface DashboardPOStatus {
    status:     string;
    count:      number;
    percentage: number;
}

export interface DashboardChartData {
    spendByCategory: { total: number; categories: DashboardSpendCategory[] };
    poStatus:        { total: number; statuses: DashboardPOStatus[] };
}

export interface PurchaseRequest {
    id: number;
    refNumber: string;
    title: string;
    requestedBy: string;
    department: string;
    category: string;
    estimatedBudget: string;
    currency: string;
    neededBy: string;
    status: string;
    rfqId: number | null;
    purchaseOrderId?: number | null;
    purchaseOrder?: { id: number; refNumber: string } | null;
    createdAt: string;
    updatedAt: string;
}

export interface PurchaseRequestLineItem {
    key?: string;
    itemName: string;
    description?: string;
    qty: number | string;
    unit: string;
    estUnitCost: number | string;
}

export interface CreatePurchaseRequestPayload {
    requestedBy?: string;
    department: string;
    category: string;
    estimatedBudget: number;
    currency: string;
    neededBy?: string;
    description: string;
    notes?: string;
    attachments?: { fileName: string; fileBase64: string; fileFormat: string }[];
    lineItems?: PurchaseRequestLineItem[];
}

export interface UpdatePurchaseRequestPayload {
    requestedBy?: string;
    department?: string;
    category?: string;
    estimatedBudget?: number;
    currency?: string;
    neededBy?: string;
    description?: string;
    notes?: string;
    status?: 'Open' | 'Draft';
    attachments?: { fileName: string; fileBase64: string; fileFormat: string }[];
    deletedAttachments?: string[];
    lineItems?: PurchaseRequestLineItem[];
}

export interface PurchaseRequestFilters {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

export interface PurchaseRequestsResponse {
    rows: PurchaseRequest[];
    count: number;
    page: number;
    totalPages: number;
    limit: number;
}

export interface PurchaseRequestAttachment {
    url: string;
    fileName: string;
    uploadedAt: string;
}

export interface PurchaseRequestDetail extends PurchaseRequest {
    corporateUserId: number;
    requestedByUserId: number;
    description: string | null;
    attachments: PurchaseRequestAttachment[];
    notes: string | null;
    lineItems?: PurchaseRequestLineItem[];
    submittedAt: string | null;
    approvedAt: string | null;
    approvedBy: string | null;
    rejectedAt: string | null;
    rejectedBy: string | null;
    rejectionReason: string | null;
    deletedAt: string | null;
}

export interface RFQ {
    id: number;
    title: string;
    closingDate: string;
    vendorsInvited: number;
    status: string;
}

export interface CreateRFQLineItem {
    description: string;
    qty: number;
    unit: string;
    estUnitCost: number;
    sortOrder: number;
}

export interface UpdateRFQPayload {
    title?: string;
    submissionDeadline?: string;
    termsAndConditions?: string;
    buyerNotes?: string;
    lineItems?: CreateRFQLineItem[];
    attachments?: { fileName: string; fileBase64: string; fileFormat: string }[];
    prAttachments?: { fileName: string; url: string }[];
    invitedVendors?: number[];
    invitedEmails?: string[];
    invitedEmailsCategory?: string;
}

export interface CreateRFQPayload {
    title: string;
    type: string;
    submissionDeadline: string;
    termsAndConditions?: string;
    buyerNotes?: string;
    purchaseRequestId?: number | null;
    invitedVendors: number[];
    invitedEmails?: string[];
    invitedEmailsCategory?: string;
    lineItems: CreateRFQLineItem[];
    attachments?: { fileName: string; fileBase64: string; fileFormat: string }[];
    prAttachments?: { fileName: string; url: string }[];
    send: boolean;
}

export interface RFQLineItem {
    id: number;
    rfqId: number;
    description: string;
    qty: string;
    unit: string;
    estUnitCost: string;
    total: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface RFQVendorInvite {
    id: number;
    rfqId: number;
    vendorId: number | null;
    externalEmail: string | null;
    invitedAt: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    vendor: {
        id: number;
        businessName: string;
        contactPerson: string;
        email: string;
        phone: string;
    } | null;
}

export interface RFQDetail {
    id: number;
    corporateUserId: number;
    refNumber: string;
    title: string;
    type: string;
    submissionDeadline: string;
    status: string;
    termsAndConditions: string;
    buyerNotes: string;
    attachments: { url: string; fileName: string; uploadedAt: string }[];
    estimatedTotal: string;
    purchaseRequestId: number | null;
    purchaseRequest: { id: number; status: string; requestedBy?: string } | null;
    sentAt: string | null;
    closedAt: string | null;
    awardedAt: string | null;
    reminderSentAt: string | null;
    createdAt: string;
    updatedAt: string;
    lineItems: RFQLineItem[];
    vendorInvites: RFQVendorInvite[];
}

export interface RFQFilters {
    search?: string;
    status?: string;
    type?: string;
    page: number;
    limit: number;
}

export interface RFQsResponse {
    rows: RFQDetail[];
    count: number;
}

export interface Proposal {
    id: number;
    rfqTitle: string;
    vendor: string;
    submittedDate: string;
    amount: number;
    status: string;
}

export interface PurchaseOrder {
    id: number;
    poNumber: string;
    vendor: string;
    date: string;
    amount: number;
    status: string;
}

export interface ProcureInvoice {
    id: number;
    invoiceNumber: string;
    vendor: string;
    dueDate: string;
    amount: number;
    status: string;
}

export interface Vendor {
    id: number;
    businessName: string;
    contactPerson: string;
    email: string;
    phone: string;
    tags: string[];
    paymentTerms: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface VendorDetail extends Vendor {
    corporateUserId: number;
    gstin: string | null;
    tradeLicenseNo: string | null;
    bankName: string | null;
    accountNumber: string | null;
    ifscCode: string | null;
}

export interface CreateVendorPayload {
    businessName: string;
    gstin?: string;
    contactPerson: string;
    email: string;
    phone: string;
    tags: string[];
    paymentTerms: string;
    status: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    tradeLicenseNo?: string;
    virtualAccountNumber?: string | null;
}

export interface VendorFilters {
    search?: string;
    status?: string;
    page: number;
    limit: number;
}

export interface VendorsResponse {
    rows: Vendor[];
    count: number;
    page: number;
    totalPages: number;
    limit: number;
}

export interface CreatePurchaseOrderLineItem {
    description: string;
    qty: number;
    unit: string;
    unitPrice: number;
    sortOrder: number;
}

export interface CreatePurchaseOrderPayload {
    vendorId: number;
    title?: string;
    proposalId?: number | null;
    rfqId?: number | null;
    purchaseRequestId?: number | null;
    currency?: string;
    deliveryAddress?: string;
    deliveryDate?: string;
    paymentTerms?: string;
    notesToVendor?: string;
    internalNotes?: string;
    lineItems: CreatePurchaseOrderLineItem[];
}

export interface PurchaseOrderVendor {
    id: number;
    businessName: string;
    contactPerson: string;
    email: string;
    phone: string;
    tradeLicenseNo: string | null;
}

export interface PurchaseOrderLineItem {
    id: number;
    purchaseOrderId: number;
    proposalLineItemId: number | null;
    description: string;
    qty: string;
    unit: string;
    unitPrice: string;
    total: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface PurchaseOrderFilters {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page: number;
    limit: number;
}

export interface PurchaseOrdersResponse {
    rows: PurchaseOrderDetail[];
    count: number;
    page: number;
    totalPages: number;
    limit: number;
}

export interface InvoiceData {
    id: number;
    corporateUserId: number;
    purchaseOrderId: number;
    vendorId: number;
    invoiceNumber: string;
    amount: string;
    accountNumber: string | null;
    ifscCode: string | null;
    bankName: string | null;
    bankAccountHolder: string | null;
    invoiceDate: string;
    receivedDate: string | null;
    dueDate: string;
    attachments: { fileName: string; url: string; uploadedAt: string }[];
    notes: string | null;
    status: string;
    paymentStatus: string | null;
    paymentReferenceId: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    purchaseOrder?: {
        id: number;
        refNumber: string;
        currency: string;
        totalAmount: string;
        status: string;
        vendor?: {
            id: number;
            businessName: string;
            email: string;
            phone: string;
            bankName: string | null;
            accountNumber: string | null;
            ifscCode: string | null;
            payoutBeneficiaryId: string | null;
        };
    };
}

export interface InvoiceFilters {
    searchText?: string;
    status?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    purchaseOrderId?: number;
}

export interface InvoicesResponse {
    data: InvoiceData[];
    total: number;
}

export interface CreateInvoicePayload {
    purchaseOrderId: number;
    vendorId: number;
    invoiceNumber: string;
    amount: number;
    invoiceDate: string;
    receivedDate?: string;
    dueDate?: string;
    accountNumber?: string;
    ifscCode?: string;
    notes?: string;
    attachments?: { fileName: string; fileBase64: string; fileFormat: string }[];
    lineItems?: { description: string; qty: number; unit: string; unitPrice: number; taxRate: string; gstType: string; total: number }[];
}

export interface PublicRFQLineItem {
    id: number;
    rfqId: number;
    description: string;
    qty: string;
    unit: string;
    estUnitCost: string;
    total: string;
    sortOrder: number;
}

export interface PublicRFQInviteData {
    rfq: {
        id: number;
        refNumber: string;
        title: string;
        type: string;
        submissionDeadline: string;
        termsAndConditions: string;
        buyerNotes: string;
        lineItems: PublicRFQLineItem[];
        attachments: { url: string; fileName: string; uploadedAt: string }[];
    };
    vendor: {
        id: number;
        businessName: string;
        contactPerson: string;
        email: string;
        phone: string;
        paymentTerms: string;
    };
    company?: {
        name?: string;
        address?: string;
        email?: string;
        phone?: string;
        gstin?: string;
    };
    invite: {
        status: string;
        expiresAt: string;
    };
}

export interface PublicPOLineItem {
    id: number;
    description: string;
    qty: string;
    unit: string;
    unitPrice: string;
    total: string;
    sortOrder: number;
    taxRate?: string;
    gstType?: 'inclusive' | 'exclusive';
}

export interface PublicPOInviteData {
    po: {
        id: number;
        refNumber: string;
        deliveryAddress: string;
        deliveryDate: string;
        paymentTerms: string;
        notesToVendor: string | null;
        currency: string;
        subtotal: string;
        taxAmount: string;
        totalAmount: string;
        sentAt: string | null;
        lineItems: PublicPOLineItem[];
    };
    rfq: {
        refNumber: string;
        title: string;
    } | null;
    vendor: {
        id: number;
        businessName: string;
        contactPerson: string;
        email: string;
        phone: string;
    };
    buyer: {
        companyName: string;
        contactEmail: string;
        contactPhone: string;
        initiatorName: string;
        initiatorDesignation: string;
    };
    invite: {
        status: string;
        expiresAt: string | null;
    };
}

export interface AcknowledgePOPayload {
    invoiceNumber: string;
    invoiceAmount: string;
    invoiceDate: string;
    invoiceFile?: { fileName: string; fileBase64: string; fileFormat: string };
    notesForBuyer?: string;
    bankAccountHolder: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
}

export interface SubmitProposalPayload {
    submissionMode: string;
    totalAmount: number;
    validUntil: string;
    paymentTerms: string;
    businessName?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactMobile?: string;
    deliveryTimeline?: string;
    warranty?: string;
    coverNote: string;
    lineItems: Array<{
        rfqLineItemId: number;
        description: string;
        unitPrice: number;
        qty: number;
        total: number;
    }>;
    pdfAttachment?: { fileName: string; fileBase64: string; fileFormat: string }[];
}

export type POBillingState = 'NONE' | 'PARTIAL' | 'FULL';

export interface PurchaseOrderDetail {
    id: number;
    corporateUserId: number;
    refNumber: string;
    title?: string | null;
    vendorId: number;
    proposalId: number | null;
    purchaseRequestId: number | null;
    currency: string;
    deliveryAddress: string;
    deliveryDate: string;
    paymentTerms: string;
    notesToVendor: string | null;
    subtotal: string;
    taxAmount: string;
    totalAmount: string;
    status: string;
    eSignStatus: string;
    eSignDocumentUrl: string | null;
    eSignSignersInfo: any[] | null;
    internalNotes: string | null;
    sentAt: string | null;
    acknowledgedAt: string | null;
    inProgressAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    cancelReason?: string | null;
    cancelledBy?: string | null;
    billedAmount?: string;
    billingState?: POBillingState;
    vendorToken: string | null;
    invoiceNumber: string | null;
    invoiceAmount: string | null;
    invoiceDate: string | null;
    invoiceFileUrl: string | null;
    invoiceNotes: string | null;
    bankAccountHolder: string | null;
    bankName: string | null;
    bankAccountNumber: string | null;
    bankIfsc: string | null;
    createdAt: string;
    updatedAt: string;
    vendor: PurchaseOrderVendor;
    lineItems: PurchaseOrderLineItem[];
}
export interface OnboardingRecord {
    id: number;
    credentialId: number;
    status: 'pending' | 'active' | 'suspended' | 'rejected';
    businessName: string;
    bankName: string | null;
    accountNumber: string | null;
    ifsc: string | null;
    virtualAccountId: string | null;
    virtualAccountNumber: string | null;
    virtualIfsc: string | null;
    consentAcceptedAt: string | null;
    activatedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

