export type Template = {
    email?: {
        emailId: string;
        subject: string;
        body: string;
    };
    sms?: {
        mobileNo: string | number;
        body: string;
    };
};

export type NotificationDetails = {
    id?: number;
    days: string;
    sms: boolean;
    email: boolean;
    notification: boolean;
    actionDate: string;
    templet: Template;
    invoiceId: string | number;
    status?: string;
};

export type guidelineRequest = {
    data: NotificationDetails[];
    invoiceId?: number;
};

export type Row = {
    id: number;
    type: string;
    subject: string | null;
    body: string;
    status: number;
    createdAt: string;
    updatedAt: string;
};

export type Data = {
    count: number;
    rows: Row[];
};

export type ApiResponse = {
    data: Data;
};
export type statusPayload = {
    status: string;
    id: number;
};
export type getGuidelinePayload = {
    invoiceId?: number;
};

export type DataResponse = {
    data: {
        count: number;
        rows: Rows[];
    };
};

export type Rows = {
    id: number;
    days: string;
    name: string;
    actionDate: string;
    email: number;
    sms: number;
    notification: number;
    templet: Templet;
    status: string;
    createdAt: string;
    updatedAt: string;
    invoiceId: number;
    invoice: Invoice;
};

export type Templet = {
    sms?: SmsTemplet;
    email: EmailTemplet;
};

export type SmsTemplet = {
    body: string;
    index: number;
    mobileNo: number;
};

export type EmailTemplet = {
    body: string;
    index: number;
    emailId: string;
    subject: string;
};

export type Invoice = {
    id: number;
    recipientDetails: RecipientDetails;
    invoiceDetails: InvoiceDetails;
    productDetails: ProductDetail[];
    paymentDetails: PaymentDetails;
    comments: string;
    termsConditions: string;
    paymentMode: string;
    status: string;
    dueDate: string | null;
    amount: number | null;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
};

export type RecipientDetails = {
    billerName: string;
    billerEmail: string;
    billerCompanyAddress: string;
    billerPhone: string;
    billerGST: string;
    customerName: string;
    customerAddress: string;
    customerEmail: string;
    customerPhone: string;
};

export type InvoiceDetails = {
    invoiceNo: string;
    dueDate: string | null;
    invoiceDate: string;
    logo: string;
    invoiceName: string;
};

export type ProductDetail = {
    amount: string;
    discount: string;
    item: string;
    price: string;
    quantity: string;
    gst: string;
};

export type PaymentDetails = {
    subTotal: string;
    gst: string;
    discount: string;
    shipping: string;
    total: string;
    amountDue: string;
    amountPaid: string;
};

export type getCustomers = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
};
