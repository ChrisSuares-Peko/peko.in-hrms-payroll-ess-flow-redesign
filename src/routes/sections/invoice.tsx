import { lazy } from 'react';

import EInvoiceAuthGuard from '@src/guard/EInvoiceAuthGuard';

import { paths } from '../paths';

const Customer = lazy(() => import('@domains/dashboard/invoiceV2/pages/Customers'));
const CustomerBulkUpload = lazy(
    () => import('@domains/dashboard/invoiceV2/pages/CustomerBulkUpload')
);
const LandingPage = lazy(() => import('@domains/dashboard/invoiceV2/pages/LandingPage'));
const ProductCatalog = lazy(
    () => import('@domains/dashboard/invoiceV2/pages/catalog/ProductCatalog')
);
const Invoice = lazy(() => import('@domains/dashboard/invoiceV2/pages/Invoice'));
const CreateInvoice = lazy(() => import('@domains/dashboard/invoiceV2/pages/CreateInvoice'));
const InvoiceDetails = lazy(() => import('@domains/dashboard/invoiceV2/pages/InvoiceDetails'));
const EInvoicingSign = lazy(() => import('@domains/dashboard/invoiceV2/pages/EInvoicingSign'));
const EInvoice = lazy(() => import('@domains/dashboard/invoiceV2/pages/EInvoice'));
const ConvertToEInvoice = lazy(
    () => import('@domains/dashboard/invoiceV2/pages/ConvertToEInvoice')
);
const EInvoiceRegister = lazy(() => import('@domains/dashboard/invoiceV2/pages/EInvoiceRegister'));
const GenerateIrn = lazy(() => import('@domains/dashboard/invoiceV2/pages/GenerateIrn'));
const EInvoiceDetails = lazy(() => import('@domains/dashboard/invoiceV2/pages/EInvoiceDetails'));
const EWaybill = lazy(() => import('@domains/dashboard/invoiceV2/pages/EWaybill'));
const GstinLookup = lazy(() => import('@domains/dashboard/invoiceV2/pages/GstinLookup'));
const ManageEInvoiceSubscription = lazy(
    () => import('@domains/dashboard/invoiceV2/pages/ManageEInvoiceSubscription')
);
const CreditNotesList = lazy(
    () => import('@domains/dashboard/invoiceV2/pages/creditNote/CreditNotesList')
);
const PaymentsReceived = lazy(() => import('@domains/dashboard/invoiceV2/pages/PaymentsReceived'));
const CreditNotePreview = lazy(
    () => import('@domains/dashboard/invoiceV2/pages/creditNote/CreditNotePreview')
);
const TemplateGallery = lazy(
    () => import('@domains/dashboard/invoiceV2/pages/templateGallery/TemplateGallery')
);
const RecurringList = lazy(
    () => import('@domains/dashboard/invoiceV2/pages/recurringInvoice/RecurringList')
);
const RecurringView = lazy(
    () => import('@domains/dashboard/invoiceV2/pages/recurringInvoice/RecurringView')
);
const AgingAnalysis = lazy(
    () => import('@domains/dashboard/invoiceV2/pages/agingAnalysis/AgingAnalysis')
);
const Reminders = lazy(() => import('@domains/dashboard/invoiceV2/pages/reminder/Reminders'));
const QuotationsList = lazy(() => import('@domains/dashboard/invoiceV2/pages/QuotationsList'));

export const invoiceRoutes = [
    { element: <LandingPage />, index: true },
    { element: <Invoice />, path: paths.invoice.allInvoice },
    { element: <CreditNotesList />, path: paths.invoice.creditNotes },
    { element: <PaymentsReceived />, path: paths.invoice.receipts },
    { element: <CreateInvoice />, path: paths.invoice.creditNoteCreate },
    { element: <CreditNotePreview />, path: paths.invoice.creditNotePreview },
    { element: <CreditNotePreview />, path: paths.invoice.creditNoteDetails },
    { element: <CreateInvoice />, path: paths.invoice.create },
    { element: <CreateInvoice />, path: paths.invoice.edit },
    { element: <QuotationsList />, path: paths.invoice.quotations },
    { element: <CreateInvoice />, path: paths.invoice.quotationCreate },
    { element: <CreateInvoice />, path: paths.invoice.quotationEdit },
    { element: <Customer />, path: paths.invoice.customers },
    {
        element: <CustomerBulkUpload />,
        path: `${paths.invoice.customers}/${paths.invoice.customersBulkUpload}`,
    },
    { element: <ProductCatalog />, path: paths.invoice.catalog },
    { element: <TemplateGallery />, path: paths.invoice.templates },
    { element: <RecurringList />, path: paths.invoice.recurring },
    { element: <RecurringView />, path: paths.invoice.recurringView },
    { element: <AgingAnalysis />, path: paths.invoice.agingAnalysis },
    { element: <Reminders />, path: paths.invoice.reminders },
    { element: <InvoiceDetails />, path: paths.invoice.invoicedetails },
    { element: <InvoiceDetails />, path: paths.invoice.quotationDetails },
    { element: <EInvoicingSign />, path: paths.invoice.eInvoicingSignIn },
    {
        element: <ManageEInvoiceSubscription />,
        path: paths.invoice.eInvoicingManageSubscription,
    },
    {
        element: <EInvoiceAuthGuard />,
        children: [
            { element: <EInvoice />, path: paths.invoice.eInvoicing },
            { element: <EInvoiceRegister />, path: paths.invoice.eInvoicingAll },
            { element: <ConvertToEInvoice />, path: paths.invoice.convertToEInvoice },
            { element: <GenerateIrn />, path: paths.invoice.generateIrn },
            { element: <EInvoiceDetails />, path: paths.invoice.eInvoiceDetails },
            { element: <EWaybill />, path: paths.invoice.eInvoicingWaybill },
            { element: <GstinLookup />, path: paths.invoice.eInvoicingGstinLookup },
        ],
    },
];
