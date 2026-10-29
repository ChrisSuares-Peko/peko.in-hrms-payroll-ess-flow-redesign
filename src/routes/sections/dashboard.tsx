import { Suspense, lazy } from 'react';

import { Skeleton } from 'antd';
import { ErrorBoundary } from 'react-error-boundary';
// layouts
import { Navigate,Outlet, useLocation } from 'react-router-dom';

import DashboardLayout from '@layouts/DashboardLayout';
import ServiceNotFound from '@src/domains/dashboard/503/pages/ServiceNotFound';
import ServiceNotAvailable from '@src/domains/failed/pages/ServiceNotAvailable';
import SessionExpired from '@src/domains/failed/pages/SessionExpired';
import AuthGuard from '@src/guard/AuthGuard';
import CorporateAccessGuard from '@src/guard/CorporateAccessGuard';
import CorporateUserGuard from '@src/guard/CorporateUserGuard';
import PrototypeScope from '@src/prototype/PrototypeScope';
import { toServiceRoute } from '@utils/serviceRoute';

import { accountingRoutes } from './accounting';
import { billPaymentRoutes } from './billPayments';
import { businessRegistrationRoutes } from './businessRegistration';
import { bussinessDocsRoutes } from './bussinessDocs';
import { carbonFootprintRoutes } from './carbonFootprint';
import { complianceRoutes } from './compliance';
import { connectRoutes } from './connect';
import { corporateTravelRoutes } from './corporateTravel';
import { domainHostingRoutes } from './domainHosting';
import { ecommerceRoutes } from './ecommerce';
import { emailDomainRoutes } from './emailDomain';
import { essRoutes } from './ess';
import { eSignRoutes } from './eSign';
import { giftCardsRoutes } from './giftCards';
import { GlobalBusinessSetupRoutes } from './globalBusinessSetup';
import { governmentServicesRoutes } from './governmentServices';
import { HikeRoutes } from './Hike';
import { homeRoutes } from './home';
import { insuranceRoutes } from './insurance';
import { invoiceRoutes } from './invoice';
import { legalServiceRoutes } from './legalService';
import { logisticsRoutes } from './logistics';
import { needHelpRoutes } from './needHelp';
import { officeAddressRoutes } from './officeAddress';
import { onboardingRoutes } from './onboarding';
import { officeSuppliesRoutes } from './officeSupplies';
import { paymentLinkRoutes } from './paymentLinks';
import { paymentRoutes } from './paymentRoutes';
import { payoutRoutes } from './payouts';
import { payrollRoutes } from './payroll';
import { paytmBposRoutes } from './paytmBpos';
import { pekoCloudRoutes } from './pekoCloud';
import { pekoConnectRoutes } from './pekoConnect';
import { pekoCreditRoutes } from './pekoCredit';
import { pekoPosRoutes } from './pekoPos';
import { PekoWalletRoutes } from './pekoWallet';
import { planRoutes } from './plans';
import { procureRoutes } from './procure';
import { profileRoutes } from './profile';
import { reportsRoutes } from './reports';
import { salesRoutes } from './sales';
import { settingsRoutes } from './settings';
import { soundBoxRoutes } from './soundbox';
import { subscriptionRoutes } from './subscriptions';
import { taxMoreRoutes } from './taxMore';
import { telecomPaymentsRoutes } from './telecomPayments';
import { TurboRoutes } from './turbo';
import { verificationSuiteRoutes } from './verificationSuite';
import { WhatsappForBusinessRoutes } from './whatsappForBusiness';
import { workRoutes } from './works';
import { paths } from '../paths';

// ----------------------------------------------------------------------
const HomePage = lazy(() => import('@domains/dashboard/Home/pages/Home'));
const CorporateCardsPage = lazy(
    () => import('@domains/dashboard/corporateCards/pages/CorporateCardsPage')
);
const MoreServices = lazy(() => import('@domains/dashboard/MoreServices/pages/MoreServices'));
const Reports = lazy(() => import('@domains/dashboard/Reports/pages/Reports'));
const NotificationsPage = lazy(
    () => import('@src/domains/dashboard/notifications/pages/NotificationsList')
);
// ----------------------------------------------------------------------


// Services flagged `enableMoreService` are linked as `/more-services/<slug>` by the
// sidebar / More Services page. We mount each one's FULL route tree (not just its
// landing page) under that prefix, so in-service navigation — e.g. Hike's relative
// `navigate('purchase-hike')` from its Buy Now button — resolves to
// `/more-services/hike/purchase-hike` instead of 404ing. This only works because every
// tree below uses `index: true` / relative sub-paths; `corporateTravelRoutes` was the
// one exception (it used to hardcode its own top-level absolute path) and has been
// changed to `index: true` so it nests cleanly here too.
//
// IMPORTANT: every service that can be flagged enableMoreService must have an entry
// here — its canonical `paths.dashboard.*` route (below) is NOT reachable at
// `/more-services/<slug>` on its own.
const moreServiceAliasRoutes = [
    { path: toServiceRoute('eSign', true), children: eSignRoutes },
    { path: toServiceRoute('Compliance', true), children: complianceRoutes },
    { path: toServiceRoute('Government Services', true), children: governmentServicesRoutes },
    { path: toServiceRoute('Office Address', true), children: officeAddressRoutes },
    { path: toServiceRoute('Works', true), children: workRoutes },
    { path: toServiceRoute('Zero Carbon', true), children: carbonFootprintRoutes },
    { path: toServiceRoute('Business Docs', true), children: bussinessDocsRoutes },
    { path: toServiceRoute('Connect', true), children: pekoConnectRoutes },
    { path: toServiceRoute('Hike', true), children: HikeRoutes },
    { path: toServiceRoute('Business Emails', true), children: emailDomainRoutes },
    { path: toServiceRoute('Payment Links', true), children: paymentLinkRoutes },
    { path: toServiceRoute('Business Registration', true), children: businessRegistrationRoutes },
    { path: toServiceRoute('Global Business Setup', true), children: GlobalBusinessSetupRoutes },
    { path: toServiceRoute('Domain & Hosting', true), children: domainHostingRoutes },
    { path: toServiceRoute('Legal Service', true), children: legalServiceRoutes },
    { path: toServiceRoute('Peko Commerce', true), children: ecommerceRoutes },
    { path: toServiceRoute('Peko POS', true), children: pekoPosRoutes },
];

// Fallback for any enableMoreService service NOT listed above (e.g. a new one added to
// the backend before its route entry lands here): redirect /more-services/<rest> to the
// canonical /<rest> route. Explicit aliases above win by route specificity, so this only
// ever catches the unlisted case.
const MoreServicesRedirect = () => {
    const { pathname, search } = useLocation();
    const target = pathname.replace(/^\/more-services/, '') || paths.dashboard.home;
    return <Navigate to={`${target}${search}`} replace />;
};


export const dashboardRoutes = [
    {
        path: '',
        element: (
            <AuthGuard>
                <CorporateUserGuard>
                    <DashboardLayout>
                        {/* PROTOTYPE-SETUP: any service outside Payroll / ESS / Onboarding redirects to /payroll. */}
                        <PrototypeScope>
                            <CorporateAccessGuard>
                                <ErrorBoundary fallback={<ServiceNotAvailable />}>
                                    <Suspense fallback={<Skeleton />}>
                                        <Outlet />
                                    </Suspense>
                                </ErrorBoundary>
                            </CorporateAccessGuard>
                        </PrototypeScope>
                    </DashboardLayout>
                </CorporateUserGuard>
            </AuthGuard>
        ),
        children: [
            // Full route trees mounted under /more-services/<slug> for every service
            // that can be flagged enableMoreService, then a fallback redirect for
            // anything not yet listed above.
            // PROTOTYPE-SETUP: ESS pages and onboarding flows mounted inside the dashboard layout.
            { path: '/ess', children: essRoutes },
            { path: '/onboarding', children: onboardingRoutes },
            ...moreServiceAliasRoutes,
            { path: '/more-services/*', element: <MoreServicesRedirect /> },
            { path: paths.dashboard.home, children: homeRoutes },
            { element: <HomePage />, path: paths.dashboard.logistics },
            { element: <HomePage />, path: paths.dashboard.tax },
            { path: paths.dashboard.accounting, children: accountingRoutes },
            { path: paths.dashboard.taxMore, children: taxMoreRoutes },
            { element: <Reports />, path: paths.dashboard.reports },
            { element: <MoreServices />, path: paths.dashboard.moreServices },
            { element: <HomePage />, path: paths.dashboard.vendorPayouts },
            { element: <CorporateCardsPage />, path: paths.dashboard.corporateCard },
            { element: <NotificationsPage />, path: paths.dashboard.notifications },
            { element: <ServiceNotFound />, path: '503' },
            { element: <ServiceNotAvailable />, path: paths.dashboard.serviceNotAvailable },
            { element: <SessionExpired />, path: paths.auth.sessionExpired },
            {
                path: paths.dashboard.profile,
                children: profileRoutes,
            },
            {
                path: paths.dashboard.subscriptions,
                children: subscriptionRoutes,
            },
            {
                path: paths.dashboard.sales,
                children: salesRoutes,
            },
            {
                path: paths.dashboard.officeSupplies,
                children: officeSuppliesRoutes,
            },
            { path: paths.dashboard.plans, children: planRoutes },
            {
                path: paths.dashboard.mobileRecharge,
                children: telecomPaymentsRoutes,
            },
            {
                path: paths.dashboard.billPayments,
                children: billPaymentRoutes,
            },
            {
                path: paths.dashboard.corporateTravel,
                children: corporateTravelRoutes,
            },
            {
                path: paths.dashboard.connect,
                children: connectRoutes,
            },
            {
                path: paths.dashboard.turbo,
                children: TurboRoutes,
            },
            {
                path: paths.dashboard.works,
                children: workRoutes,
            },
            {
                path: paths.dashboard.giftCards,
                children: giftCardsRoutes,
            },
            {
                path: paths.dashboard.businessDocs,
                children: bussinessDocsRoutes,
            },
            {
                path: paths.dashboard.officeAddress,
                children: officeAddressRoutes,
            },
            {
                path: paths.dashboard.zeroCarbon,
                children: carbonFootprintRoutes,
            },
            {
                path: paths.dashboard.needHelp,
                children: needHelpRoutes,
            },
            {
                path: paths.dashboard.hike,
                children: HikeRoutes,
            },
            {
                path: paths.dashboard.reports,
                children: reportsRoutes,
            },
            {
                path: paths.dashboard.insurance,
                children: insuranceRoutes,
            },
            {
                path: paths.dashboard.whatsappForBusiness,
                children: WhatsappForBusinessRoutes,
            },
            {
                path: paths.paymentLinks.index,
                children: paymentLinkRoutes,
            },
            {
                path: paths.dashboard.soundBox,
                children: soundBoxRoutes,
            },
            {
                path: paths.dashboard.invoicing,
                children: invoiceRoutes,
            },
            {
                path: paths.dashboard.payments,
                children: paymentRoutes,
            },
            {
                path: paths.dashboard.payout,
                children: payoutRoutes,
            },
            {
                path: paths.dashboard.logistics,
                children: logisticsRoutes,
            },
            {
                path: paths.dashboard.payroll,
                children: payrollRoutes,
            },
            {
                path: paths.dashboard.paytmBpos,
                children: paytmBposRoutes,
            },
            {
                path: paths.dashboard.eSign,
                children: eSignRoutes,
            },
            {
                path: paths.dashboard.pekoCloud,
                children: pekoCloudRoutes,
            },
            {
                path: paths.dashboard.pekoCredit,
                children: pekoCreditRoutes,
            },
            {
                path: paths.dashboard.settings,
                children: settingsRoutes,
            },
            {
                path: paths.dashboard.emailDomain,
                children: emailDomainRoutes,
            },
            {
                path: paths.dashboard.pekoConnect,
                children: pekoConnectRoutes,
            },
            {
                path: paths.dashboard.pekoWallet,
                children: PekoWalletRoutes,
            },
            {
                path: paths.dashboard.verificationSuite,
                children: verificationSuiteRoutes,
            },
            {
                path: paths.dashboard.domainHosting,
                children: domainHostingRoutes,
            },
            {
                path: paths.dashboard.globalBusinessSetup,
                children: GlobalBusinessSetupRoutes,
            },
            {
                path: paths.dashboard.businessRegistration,
                children: businessRegistrationRoutes,
            },
            {
                path: paths.dashboard.globalBusinessSetup,
                children: GlobalBusinessSetupRoutes,
            },
            {
                path: paths.dashboard.procure,
                children: procureRoutes,
            },
            {
                path: paths.dashboard.governmentServices,
                children: governmentServicesRoutes,
            },
            {
                path: paths.dashboard.compliance,
                children: complianceRoutes,
            },
            {
                path: paths.dashboard.legalService,
                children: legalServiceRoutes,
            },
            {
                path: paths.dashboard.compliance,
                children: complianceRoutes,
            },
            {
                path: paths.dashboard.ecommerce,
                children: ecommerceRoutes,
            },
            {
                path: paths.dashboard.pekoPos,
                children: pekoPosRoutes,
            },
        ],
    },
];
