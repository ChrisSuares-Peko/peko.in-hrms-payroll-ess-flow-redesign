export type DashboardApiResponse = {
    lapsedInvoiceCount: number;
    paidInvoiceAmount: number;
    paidInvoiceCount: number;
    pendingInvoiceAmount: number;
    pendingInvoiceCount: number;
    totalInvoiceCount: number;
    paymentLinkKYB: {
        kybStatus: 'PENDING' | 'IN PROGRESS' | 'UNDER REVIEW' | 'APPROVED' | 'REJECTED';
        rejectReason: string;
    };
    paymentLinkCommission: {
        isPercentage: boolean;
        charge: string;
    };
};

export type RecipientDetails = {
    billerName?: string;
    billerEmail?: string;
    billerCompanyAddress?: string;
    billerPhone?: number | string | undefined;
    billerGST?: string;
    billerTRNNumber?: string;
    customerName: string;
    customerEmail: string;
    customerAddress: string;
    customerPhone: string;
    customerTRNNumber?: string;
    logo:
        | {
              imageBase: string;
              imageFormat: string;
          }
        | undefined;
};

export type InvoiceDetails = {
    invoiceDate?: string | null;
    invoiceNo?: string;
    dueDate?: string | null;
    invoiceName?: string;
    comments?: string | undefined;
    termsConditions?: string | undefined;
};

export type ProductDetail = {
    item: string;
    quantity: string;
    price: string;
    gst: string;
    discount: string;
    amount: string;
};

export type PaymentDetails = {
    subTotal: string;
    gst: string;
    discount: string;
    shipping: string;
    total: string;
    amountDue: string;
    amountPaid?: string;
};

export type BasicDetailsTypes = {
    id?: number;
    invoiceId: number;
    updatedAt?: string;
    createdAt?: string;
    comments: string | undefined;
    termsConditions: string | undefined;
    paymentMode: string;
    paymentDetails: PaymentDetails;
    productDetails: ProductDetail[];
    invoiceDetails: InvoiceDetails;
    recipientDetails: RecipientDetails;
};

export type resetForm = {
    resetForm: () => void;
};
export type InvoiceResponse = {
    id: number;
    recipientDetails: string;
    invoiceDetails: string;
    productDetails: string;
    paymentDetails: string;
    comments: string;
    termsConditions: string;
    updatedAt: string;
    createdAt: string;
    invoiceId: number;
    paymentMode: string;
};
export type getAllInvoicesTypes = {
    invoiceData: invoicedatatypes[];
    recordsTotal: number;
};
export type invoicedatatypes = {
    id: number;
    recipientDetails: RecipientDetails;
    invoiceDetails: InvoiceDetails;
    productDetails: ProductDetail;
    paymentDetails: PaymentDetails;
    comments: string;
    termsConditions: string;
    updatedAt: string;
    createdAt: BasicDetailsTypes;
};

export type ParsedResponse = {
    id: number;
    recipientDetails: RecipientDetails;
    invoiceDetails: InvoiceDetails;
    productDetails: ProductDetail[];
    paymentDetails: PaymentDetails;
    comments: string;
    termsConditions: string;
    updatedAt: string;
    createdAt: string;
    invoiceId: number;
};
export type sendEmailTypes = {
    invoiceId?: any;
    email: string;
    invoiceOnly?: boolean;
};
export type linkTypes = {
    note: string;
    amount: string;
    purpose: string;
    customer_email: string;
    customer_phone: string;
};

export type responseLinkTypes = {
    note: string;
    amount: string;
    purpose: string;
    customer_email: string;
    customer_phone: string;
    link: string;
    dateCreated: string;
    expiry: string;
};
export type downloadInvoicePayload = {
    userType: string;
    userId: number;
    invoiceId: string;
};
export type downloadInvoiceResponse = {
    pdfBuffer: {
        type: 'Buffer';
        data: [];
    };
};
export type UserDetailsPayload = {
    userId: number;
    userType: string;
};
export type userDetailsResponse = {
    addressId: number;
    addressLine1: string;
    addressLine2: string;
    userName: string;
    userEmail: string;
    userCountry: string;
    mobileNo: number;
};
export type userBankDetailsResponse = {
    accountHolderName: string;
    accountNumber: string;
    iban: string;
    bankName: string;
};
export type sendEmailResponse = {
    status: boolean;
    message: string;
    data: {};
    responseCode: string;
};

export type paymentlinkPayload = {
    invoiceId: number;
};

export type stepPayload = {
    isFirstStepCompleted: boolean;
    businessType: string;
};
