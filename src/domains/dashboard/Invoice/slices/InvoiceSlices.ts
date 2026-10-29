import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { RecipientDetails, InvoiceDetails, ProductDetail, PaymentDetails } from '../types/index';
import { CorporateDocument } from '../types/paymentlinkType';

interface InvoicesState {
    step: number;
    recipientDetails: RecipientDetails;
    invoiceDetails: InvoiceDetails;
    productDetails: ProductDetail[];
    paymentDetails: PaymentDetails;
    paymentMode: string;
    comments: string;
    termsConditions: string;
    loading: boolean;
    error: string | null;
    Details: any;
    invoiceId: number;
    trackerData: any;
    paymentLink: string;
    invoiceResponse: any;
    paymentLinkForm: any;
    paymentLinkPayload: any;
    collectorKyb: {
        kybStatus:
            | 'PENDING'
            | 'INITIATED'
            | 'DOCUMENT UPLOADED'
            | 'APPROVED'
            | 'REJECTED'
            | 'E-SIGN PENDING'
            | 'PENDING REVIEW'
            | '';
        kybRejectReason: string;
        kybDocuments: CorporateDocument;
        userConsent: boolean;
        agreementEmail: string;
        agreementStatus: string;
    };
    pdfFile: string | ArrayBuffer | null;
}

const initialRecipientDetails: RecipientDetails = {
    billerName: '',
    billerEmail: '',
    billerCompanyAddress: '',
    billerPhone: 0,
    billerGST: '',
    customerName: '',
    customerEmail: '',
    customerAddress: '',
    customerPhone: '',
    logo: {
        imageBase: '',
        imageFormat: '',
    },
};

const initialInvoiceDetails: InvoiceDetails = {
    invoiceDate: null,
    invoiceNo: '',
    dueDate: null,
};

const initialProductDetails: ProductDetail[] = [
    { amount: '', discount: '', item: '', price: '', quantity: '', gst: '' },
];

const initialPaymentDetails: PaymentDetails = {
    subTotal: '',
    total: '',
    gst: '',
    discount: '',
    shipping: '',
    amountDue: '',
};

const initialState: InvoicesState = {
    step: 1,
    recipientDetails: initialRecipientDetails,
    invoiceDetails: initialInvoiceDetails,
    productDetails: initialProductDetails,
    paymentDetails: initialPaymentDetails,
    paymentMode: '',
    comments: '',
    termsConditions: '',
    loading: false,
    error: null,
    Details: {},
    invoiceId: 0,
    trackerData: {},
    paymentLink: '',
    invoiceResponse: {},
    paymentLinkForm: {},
    paymentLinkPayload: {},
    collectorKyb: {
        kybStatus: '',
        kybRejectReason: '',
        agreementEmail: '',
        agreementStatus: '',
        kybDocuments: {
            supplierDetails: {
                uploadedDocuments: {},
                companyLogo: '',
            },
        },
        userConsent: false,
    },
    pdfFile: null,
};

const invoicesSlice = createSlice({
    name: 'invoices',
    initialState,
    reducers: {
        nextStep: state => {
            state.step += 1;
        },
        previousStep: state => {
            state.step -= 1;
        },
        setRecipientDetails: (state, action: PayloadAction<RecipientDetails>) => {
            state.recipientDetails = { ...state.recipientDetails, ...action.payload };
        },
        setInvoiceDetails: (state, action: PayloadAction<InvoiceDetails>) => {
            state.invoiceDetails = { ...state.invoiceDetails, ...action.payload };
        },
        setProductDetails: (state, action: PayloadAction<ProductDetail[]>) => {
            state.productDetails = action.payload;
        },
        setPaymentDetails: (state, action: PayloadAction<PaymentDetails>) => {
            state.paymentDetails = { ...state.paymentDetails, ...action.payload };
        },
        setComments: (state, action: PayloadAction<string>) => {
            state.comments = action.payload;
        },
        setTermsConditions: (state, action: PayloadAction<string>) => {
            state.termsConditions = action.payload;
        },
        fetchInvoiceStart: state => {
            state.loading = true;
            state.error = null;
        },
        fetchInvoiceSuccess: state => {
            state.loading = false;
            state.error = null;
        },
        fetchInvoiceFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
        setDetails: (state, action: PayloadAction<any>) => {
            state.Details = action.payload;
        },
    },
});

export const {
    nextStep,
    previousStep,
    setRecipientDetails,
    setInvoiceDetails,
    setProductDetails,
    setPaymentDetails,
    setComments,
    setTermsConditions,
    fetchInvoiceStart,
    fetchInvoiceSuccess,
    fetchInvoiceFailure,
    setDetails,
} = invoicesSlice.actions;

export default invoicesSlice.reducer;
