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
        kybStatus: 'PENDING' | 'INITIATED' | 'DOCUMENT UPLOADED' | 'APPROVED' | 'REJECTED' | '';
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
    billerPhone: '',
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
    invoiceName: '',
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
    amountPaid: '',
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
        setPaymentMode: (state, action: PayloadAction<string>) => {
            state.paymentMode = action.payload;
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
        resetState: state => {
            state.recipientDetails = initialRecipientDetails;
        },
        setDetails: (state, action: PayloadAction<any>) => {
            state.Details = action.payload;
        },
        resetDetails: state => {
            state.Details = initialState.Details;
            return state;
        },
        resetAll: state => {
            state = initialState;
            return state;
        },
        setPdfFile: (state, action: PayloadAction<string | ArrayBuffer | null>) => {
            state.pdfFile = action.payload;
            return state;
        },
        setInvoiceId: (state, action: PayloadAction<any>) => {
            state.invoiceId = action.payload;
        },
        setTrackerData: (state, action: PayloadAction<any>) => {
            state.trackerData = action.payload;
        },
        setPaymentLink: (state, action: PayloadAction<any>) => {
            state.paymentLink = action.payload;
        },
        setInvoiceResponse: (state, action: PayloadAction<any>) => {
            state.invoiceResponse = action.payload;
        },
        setpaymentLinkForm: (state, action: PayloadAction<any>) => {
            state.paymentLinkForm = action.payload;
        },
        setpaymentLinkPayload: (state, action: PayloadAction<any>) => {
            state.paymentLinkPayload = action.payload;
        },
        setpaymentLinkKybDetails: (state, action: PayloadAction<any>) => {
            // state.collectorKyb.kybStatus = action.payload.kybStatus;
            // state.collectorKyb.kybRejectReason = action.payload.rejectReason;
        },
        // setpaymentLinkKybDocumentSingle: (
        //     state,
        //     action: PayloadAction<{ documentName: KYBDocumentName | ''; file: any }>
        // ) => {
        //     if (action.payload.documentName) {
        //         state.collectorKyb.kybDocuments[action.payload.documentName] = action.payload.file;
        //         if (state.collectorKyb.kybDocuments.supplierDetails.uploadedDocuments) {
        //             state.collectorKyb.kybDocuments.supplierDetails.uploadedDocuments[
        //                 action.payload.documentName
        //             ] = {
        //                 fileUrl: action.payload.file,
        //                 isUploaded: true,
        //             };
        //         } else {
        //             state.collectorKyb.kybDocuments.supplierDetails.uploadedDocuments = {
        //                 [action.payload.documentName]: {
        //                     fileUrl: action.payload.file,
        //                     isUploaded: true,
        //                 },
        //             };
        //         }
        //     }
        //     return state;
        // },
        // setpaymentLinkKybDocuments: (state, action: PayloadAction<any>) => {
        //     state.collectorKyb.kybDocuments = action.payload;
        // },
        // setUserConsent: (state, action: PayloadAction<boolean>) => {
        //     state.collectorKyb.userConsent = action.payload;
        // },
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
    resetState,
    setDetails,
    setInvoiceId,
    setTrackerData,
    setPaymentLink,
    setInvoiceResponse,
    setpaymentLinkForm,
    resetDetails,
    setpaymentLinkPayload,
    setpaymentLinkKybDetails,
    // setpaymentLinkKybDocuments,
    setPaymentMode,
    resetAll,
    setPdfFile,
    // setpaymentLinkKybDocumentSingle,
    // setUserConsent,
} = invoicesSlice.actions;

export default invoicesSlice.reducer;
