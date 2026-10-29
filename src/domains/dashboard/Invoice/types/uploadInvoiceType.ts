interface InvoiceItem {
    item: string;
    quantity: string; // Assuming quantity is a string based on the example
    price: string; // Assuming value is also a string representing the currency amount
}

export interface InvoiceDataType {
    invoice_due_date: string;
    customer_name: string;
    issued_date: string;
    line_items: string; // Assuming this is a string representation of line items
    invoice_number: string;
    merchant_name: string;
    tax_amount: string; // Assuming tax amount is a string representing the currency
    subtotal_amount: string; // Assuming subtotal is also a string
    total_amount: string; // Assuming total amount is a string
    address: string;
    invoiceItems: InvoiceItem[]; // Array of invoice items
}

export interface UploadInvoiceResponse {
    invoiceData: InvoiceDataType;
}

export interface GetAgreementRespnse {
    isSignLimitReached: boolean;
    kybStatus: string;
    sampleAgreement: string;
    signerEmail: string;
    signerName: string;
    isSupplierExist: boolean;
    designation: string;
    city: string;
    address: string;
    url: string;
    isFirstStepCompleted: boolean;
}
