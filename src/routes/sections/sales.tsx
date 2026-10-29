import { lazy } from 'react';

import { paths } from '../paths';

const Dashboard = lazy(() => import('@src/domains/dashboard/Sales/Pages/Dashboard'));
const Customers = lazy(() => import('@src/domains/dashboard/Sales/Pages/Customers'));
const CustomerBulkUpload = lazy(
    () => import('@src/domains/dashboard/Sales/Pages/CustomerBulkUpload')
);
const Agreements = lazy(() => import('@src/domains/dashboard/Sales/Pages/Agreements'));
const AgreementDetail = lazy(() => import('@src/domains/dashboard/Sales/Pages/AgreementDetail'));
const CreateAgreement = lazy(() => import('@src/domains/dashboard/Sales/Pages/CreateAgreement'));
const Invoices = lazy(() => import('@src/domains/dashboard/Sales/Pages/Invoice'));
const SalesOrders = lazy(() => import('@src/domains/dashboard/Sales/Pages/SalesOrders'));
const Quotations = lazy(() => import('@src/domains/dashboard/Sales/Pages/Quotations'));
const CreateDocument = lazy(() => import('@src/domains/dashboard/Sales/Pages/CreateDocument'));
const DocumentDetails = lazy(() => import('@src/domains/dashboard/Sales/Pages/DocumentDetails'));
const Payments = lazy(() => import('@src/domains/dashboard/Sales/Pages/Payments'));

export const salesRoutes = [
    { element: <Dashboard />, index: true },
    { path: paths.sales.customerLeads, element: <Customers /> },
    {
        path: `${paths.sales.customerLeads}/${paths.sales.customersBulkUpload}`,
        element: <CustomerBulkUpload />,
    },
    { path: paths.sales.invoices, element: <Invoices /> },
    {
        path: `${paths.sales.invoices}/${paths.sales.createInvoice}`,
        element: <CreateDocument documentType="INVOICE" />,
    },
    {
        path: `${paths.sales.invoices}/${paths.sales.invoicedetails}`,
        element: <DocumentDetails documentType="INVOICE" />,
    },
    {
        path: `${paths.sales.invoices}/${paths.sales.editInvoice}`,
        element: <CreateDocument documentType="INVOICE" />,
    },
    { path: paths.sales.salesOrders, element: <SalesOrders /> },
    {
        path: `${paths.sales.salesOrders}/${paths.sales.createSalesOrder}`,
        element: <CreateDocument documentType="SALES_ORDER" />,
    },
    {
        path: `${paths.sales.salesOrders}/${paths.sales.editSalesOrder}`,
        element: <CreateDocument documentType="SALES_ORDER" />,
    },
    {
        path: `${paths.sales.salesOrders}/${paths.sales.salesOrderDetails}`,
        element: <DocumentDetails documentType="SALES_ORDER" />,
    },
    { path: paths.sales.quotations, element: <Quotations /> },
    {
        path: `${paths.sales.quotations}/${paths.sales.createQuotation}`,
        element: <CreateDocument documentType="QUOTATION" />,
    },
    {
        path: `${paths.sales.quotations}/${paths.sales.editQuotation}`,
        element: <CreateDocument documentType="QUOTATION" />,
    },
    {
        path: `${paths.sales.quotations}/${paths.sales.quotationDetails}`,
        element: <DocumentDetails documentType="QUOTATION" />,
    },
    { path: paths.sales.payment, element: <Payments /> },
    { path: paths.sales.agreements, element: <Agreements /> },
    { path: paths.sales.createAgreement, element: <CreateAgreement /> },
    { path: paths.sales.editAgreement, element: <CreateAgreement /> },
    { path: paths.sales.agreementDetail, element: <AgreementDetail /> },
];
