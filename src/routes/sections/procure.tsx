import { lazy } from 'react';

import { paths } from '../paths';

const ProcureLandingPage = lazy(() => import('@domains/dashboard/Procure/pages/ProcureLandingPage'));
const ProcureDashboardPage = lazy(() => import('@domains/dashboard/Procure/pages/LandingPage'));
const ProcureDashboardLayout = lazy(() => import('@domains/dashboard/Procure/components/layout/ProcureDashboardLayout'));
const PurchaseRequestsPage = lazy(
    () => import('@domains/dashboard/Procure/pages/PurchaseRequestsPage')
);
const NewPurchaseRequestPage = lazy(
    () => import('@domains/dashboard/Procure/components/PurchaseRequest/NewPurchaseRequest')
);
const EditPurchaseRequestPage = lazy(
    () => import('@domains/dashboard/Procure/components/PurchaseRequest/EditPurchaseRequest')
);
const PurchaseRequestDetailsPage = lazy(
    () => import('@domains/dashboard/Procure/pages/PurchaseRequestDetailsPage')
);
const RFQPage = lazy(() => import('@domains/dashboard/Procure/pages/RFQPage'));
const NewRFQPage = lazy(() => import('@domains/dashboard/Procure/components/RFQ/NewRFQ'));
const RFQViewPage = lazy(() => import('@domains/dashboard/Procure/components/RFQ/RFQView'));
const EditRFQPage = lazy(() => import('@domains/dashboard/Procure/components/RFQ/EditRFQ'));
const ProposalsPage = lazy(() => import('@domains/dashboard/Procure/pages/ProposalsPage'));
const ProposalDetailsPage = lazy(() => import('@domains/dashboard/Procure/components/Proposals/ProposalDetailsPage'));
const ProposalComparisonPage = lazy(() => import('@domains/dashboard/Procure/components/Proposals/ProposalComparisonPage'));
const PurchaseOrdersPage = lazy(
    () => import('@domains/dashboard/Procure/pages/PurchaseOrdersPage')
);
const InvoicingPage = lazy(
    () => import('@src/domains/dashboard/Procure/pages/InvoicingPage')
);
const UploadInvoicePage = lazy(
    () => import('@domains/dashboard/Procure/pages/UploadInvoicePage')
);
const InvoicingDetailPage = lazy(
    () => import('@domains/dashboard/Procure/pages/InvoicingDetailPage')
);
const VendorPage = lazy(
    () => import('@src/domains/dashboard/Procure/pages/VendorPage')
);
const AddVendorPage = lazy(
    () => import('@domains/dashboard/Procure/components/Vendor/AddVendor')
);
const EditVendorPage = lazy(
    () => import('@domains/dashboard/Procure/components/Vendor/EditVendor')
);
const VendorDetailsPage = lazy(
    () => import('@domains/dashboard/Procure/pages/VendorDetailsPage')
);
const NewPurchaseOrderPage = lazy(
    () => import('@domains/dashboard/Procure/components/PurchaseOrder/NewPurchaseOrder')
);
const EditPurchaseOrderPage = lazy(
    () => import('@domains/dashboard/Procure/components/PurchaseOrder/EditPurchaseOrder')
);
const PurchaseOrderDetailsPage = lazy(
    () => import('@domains/dashboard/Procure/pages/PurchaseOrderDetailsPage')
);
const UploadInvoiceForPOPage = lazy(
    () => import('@domains/dashboard/Procure/pages/UploadInvoiceForPOPage')
);
const OnboardingPage = lazy(
    () => import('@domains/dashboard/Procure/pages/PaymentLinkOnboardingPage')
);
const ActivityPage = lazy(
    () => import('@domains/dashboard/Procure/pages/ActivityPage')
);

export const procureRoutes = [
    { index: true, element: <ProcureLandingPage /> },
    {
        element: <ProcureDashboardLayout />,
        children: [
            { path: paths.procure.dashboard, element: <ProcureDashboardPage /> },
            {
                path: paths.procure.purchaseRequests.index,
                element: <PurchaseRequestsPage />,
            },
            {
                path: `${paths.procure.purchaseRequests.index}/${paths.procure.purchaseRequests.create}`,
                element: <NewPurchaseRequestPage />,
            },
            {
                path: `${paths.procure.purchaseRequests.index}/${paths.procure.purchaseRequests.view}`,
                element: <PurchaseRequestDetailsPage />,
            },
            {
                path: `${paths.procure.purchaseRequests.index}/${paths.procure.purchaseRequests.edit}`,
                element: <EditPurchaseRequestPage />,
            },
            { path: `${paths.procure.invoicing.index}/${paths.procure.onboarding}`, element: <OnboardingPage /> },
            { path: paths.procure.rfq.index,                                            element: <RFQPage /> },
            { path: `${paths.procure.rfq.index}/${paths.procure.rfq.create}`,           element: <NewRFQPage /> },
            { path: `${paths.procure.rfq.index}/${paths.procure.rfq.view}`,             element: <RFQViewPage /> },
            { path: `${paths.procure.rfq.index}/${paths.procure.rfq.edit}`,             element: <EditRFQPage /> },
            { path: paths.procure.proposals.index,                                                          element: <ProposalsPage /> },
            { path: `${paths.procure.proposals.index}/${paths.procure.proposals.view}`,                    element: <ProposalDetailsPage /> },
            { path: `${paths.procure.proposals.index}/${paths.procure.proposals.compare}`,                 element: <ProposalComparisonPage /> },
            { path: paths.procure.purchaseOrders.index,  element: <PurchaseOrdersPage /> },
            { path: `${paths.procure.purchaseOrders.index}/${paths.procure.purchaseOrders.uploadInvoice}`, element: <UploadInvoiceForPOPage /> },
            { path: `${paths.procure.purchaseOrders.index}/${paths.procure.purchaseOrders.view}`,   element: <PurchaseOrderDetailsPage /> },
            { path: `${paths.procure.purchaseOrders.index}/${paths.procure.purchaseOrders.create}`, element: <NewPurchaseOrderPage /> },
            { path: `${paths.procure.purchaseOrders.index}/${paths.procure.purchaseOrders.edit}`,   element: <EditPurchaseOrderPage /> },
            { path: paths.procure.invoicing.index,  element: <InvoicingPage /> },
            { path: `${paths.procure.invoicing.index}/upload`, element: <UploadInvoicePage /> },
            { path: `${paths.procure.invoicing.index}/${paths.procure.invoicing.view}`, element: <InvoicingDetailPage /> },
            { path: paths.procure.activity, element: <ActivityPage /> },
            { path: paths.procure.vendor.index,  element: <VendorPage /> },
            { path: `${paths.procure.vendor.index}/${paths.procure.vendor.create}`, element: <AddVendorPage /> },
            { path: `${paths.procure.vendor.index}/${paths.procure.vendor.edit}`, element: <EditVendorPage /> },
            { path: `${paths.procure.vendor.index}/${paths.procure.vendor.view}`, element: <VendorDetailsPage /> },
        ],
    },
];
