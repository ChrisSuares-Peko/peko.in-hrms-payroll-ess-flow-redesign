import { lazy } from 'react';

const LandingPage = lazy(() => import('@src/domains/dashboard/taxAndMore/pages/LandingPage'));
const VerifyPanPage = lazy(
    () => import('@src/domains/dashboard/taxAndMore/pages/kyc/VerifyPanPage')
);
const ChooseBusinessPage = lazy(
    () => import('@src/domains/dashboard/taxAndMore/pages/kyc/ChooseBusinessPage')
);
const FinaliseSetupPage = lazy(
    () => import('@src/domains/dashboard/taxAndMore/pages/kyc/FinaliseSetupPage')
);
const GstFilingPage = lazy(() => import('@src/domains/dashboard/taxAndMore/pages/GstFilingPage'));
const UploadSalesInvoicesPage = lazy(
    () => import('@src/domains/dashboard/taxAndMore/pages/UploadSalesInvoicesPage')
);
const Gstr1FilingPage = lazy(
    () => import('@src/domains/dashboard/taxAndMore/pages/Gstr1FilingPage')
);
const ImsPage = lazy(() => import('@src/domains/dashboard/taxAndMore/pages/ImsPage'));
const Gstr2bPage = lazy(() => import('@src/domains/dashboard/taxAndMore/pages/Gstr2bPage'));
const Gstr3bFilingPage = lazy(
    () => import('@src/domains/dashboard/taxAndMore/pages/Gstr3bFilingPage')
);
const GstLedgerPage = lazy(() => import('@src/domains/dashboard/taxAndMore/pages/GstLedgerPage'));
const SupplierCompliancePage = lazy(
    () => import('@src/domains/dashboard/taxAndMore/pages/SupplierCompliancePage')
);
const GstinLookupPage = lazy(
    () => import('@src/domains/dashboard/taxAndMore/pages/GstinLookupPage')
);
const FilingHistoryPage = lazy(
    () => import('@src/domains/dashboard/taxAndMore/pages/FilingHistoryPage')
);
const Gstr9FilingPage = lazy(
    () => import('@src/domains/dashboard/taxAndMore/pages/Gstr9FilingPage')
);

export const taxMoreRoutes = [
    { element: <LandingPage />, index: true },
    { element: <VerifyPanPage />, path: 'kyc/verify-pan' },
    { element: <ChooseBusinessPage />, path: 'kyc/choose-business' },
    { element: <FinaliseSetupPage />, path: 'kyc/finalise' },
    { element: <GstFilingPage />, path: 'gst-filing' },
    { element: <UploadSalesInvoicesPage />, path: 'gst-filing/upload-invoices' },
    { element: <Gstr1FilingPage />, path: 'gst-filing/file-gstr1' },
    { element: <ImsPage />, path: 'ims' },
    { element: <Gstr2bPage />, path: 'gstr-2b' },
    { element: <Gstr3bFilingPage />, path: 'gst-filing/file-gstr3b' },
    { element: <GstLedgerPage />, path: 'gst-ledger' },
    { element: <SupplierCompliancePage />, path: 'supplier-compliance' },
    { element: <GstinLookupPage />, path: 'gstin-lookup' },
    { element: <FilingHistoryPage />, path: 'filing-history' },
    { element: <Gstr9FilingPage />, path: 'gst-filing/file-gstr9' },
];
