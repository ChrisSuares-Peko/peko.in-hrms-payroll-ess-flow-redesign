interface RecipientDetails {
    billerName: string;
    billerEmail: string;
    billerCompanyAddress: string;
    billerPhone: string;
    billerGST: string; // You might want to define the type more accurately if it's not always empty
    customerName: string;
    customerAddress: string;
    customerEmail: string;
    customerPhone: string;
}

interface InvoiceDetails {
    invoiceNo: string;
    dueDate: string;
    invoiceDate: string;
    logo: string;
    invoiceName?: string; // This property is optional based on the provided data
}

interface ProductDetail {
    amount: string; // Changed to string based on the provided data
    discount: string;
    item: string;
    price: string;
    quantity: string;
    vat: string;
}

interface PaymentDetails {
    subTotal: string;
    vat: string;
    discount: string; // Assuming discount is always provided, but you can adjust it if it's optional
    shipping?: string; // This property is optional based on the provided data
    total: string;
    amountDue: string;
    amountPaid: string; // You might want to define the type more accurately if it's not always empty
}

export interface InvoiceData {
    id: number;
    recipientDetails: RecipientDetails;
    invoiceDetails: InvoiceDetails;
    productDetails: ProductDetail[];
    paymentDetails: PaymentDetails;
    comments: string;
    termsConditions: string;
    paymentMode: string; // Changed to string based on the provided data
    createdAt: string;
    updatedAt: string;
    credentialId: number;
}

export type InvoiceDataResponse = {
    recordsTotal: number;
    data: InvoiceData[];
};
