import { Suspense, lazy } from 'react';

import { Skeleton } from 'antd';
import { Navigate, Outlet } from 'react-router-dom';

// layouts
import DashboardLayout from '@layouts/DashboardLayout';
import { paths } from '@routes/paths';
import AuthGuard from '@src/guard/AuthGuard';
import RoleGuard from '@src/guard/RoleGuard';
import SystemUserGuard from '@src/guard/SystemUserGuard';
import { useAppSelector } from '@src/hooks/store';

const PartnerServices = lazy(() => import('@src/domains/admin/users/components/PartnerServices'));
const CreateTransactions = lazy(
    () => import('@src/domains/admin/accounts/components/CreateTransactions')
);
const RefundTransactions = lazy(
    () => import('@src/domains/admin/accounts/components/RefundTransactions')
);
const SelfTransfer = lazy(() => import('@src/domains/admin/accounts/components/SelfTransfer'));
const TransferFunds = lazy(() => import('@src/domains/admin/accounts/components/TransferFunds'));
const WalletReport = lazy(() => import('@src/domains/admin/accounts/components/WalletReport'));
const BillerManagement = lazy(
    () => import('@src/domains/admin/billPayments/pages/BillerManagement')
);
const QuoteRequests = lazy(() => import('@src/domains/admin/insuranceQuotes/pages/QuoteRequests'));
const AirlineAirports = lazy(
    () => import('@src/domains/admin/manage/component/airlineAirports/AirlineAirports')
);
const AttestationCategory = lazy(
    () => import('@src/domains/admin/manage/component/attestationCategory/AttestationCategory')
);
const BusinessRegistrationManage = lazy(
    () => import('@src/domains/admin/manage/component/businessRegistration/BusinessRegistration')
);
const CarReportPlans = lazy(
    () => import('@src/domains/admin/manage/component/carReportPlans/CarReportPlans')
);
const CollectorKyb = lazy(
    () => import('@src/domains/admin/manage/component/collectorKyb/CollectorKyb')
);
const AdminCompliance = lazy(
    () => import('@src/domains/admin/manage/component/compliance/AdminCompliance')
);
const ConnectPage = lazy(() => import('@src/domains/admin/manage/component/connect/Table'));
const CorporateCardApplications = lazy(
    () =>
        import('@src/domains/admin/manage/component/corporateCardApplications/CorporateCardApplications')
);
const CorporateDocumentsPage = lazy(
    () =>
        import('@src/domains/admin/manage/component/corporateCardApplications/CorporateDocumentsPage')
);
const CorporateCardClosures = lazy(
    () => import('@src/domains/admin/manage/component/corporateCardClosures/CorporateCardClosures')
);
const CorporateCardDocumentLimits = lazy(
    () =>
        import('@src/domains/admin/manage/component/corporateCardDocumentLimits/CorporateCardDocumentLimits')
);
const CorporateCardTerminations = lazy(
    () =>
        import('@src/domains/admin/manage/component/corporateCardTerminations/CorporateCardTerminations')
);
const DenominationWallet = lazy(
    () => import('@src/domains/admin/manage/component/DenominationWallet')
);
const DomainHostingCancellations = lazy(
    () =>
        import('@src/domains/admin/manage/component/domainHostingCancellations/DomainHostingCancellations')
);
const DomainHostingPlans = lazy(
    () => import('@src/domains/admin/manage/component/domainHostingPlans/DomainHostingPlans')
);
const DomainTlds = lazy(() => import('@src/domains/admin/manage/component/DomainTlds'));
const Edoc = lazy(() => import('@src/domains/admin/manage/component/edoc/Edoc'));
const EmailDomain = lazy(
    () => import('@src/domains/admin/manage/component/emailDomain/EmailDomain')
);
const EmailDomainPlans = lazy(
    () => import('@src/domains/admin/manage/component/emailDomainPlans/EmailDomainPlans')
);
const Plans = lazy(() => import('@src/domains/admin/manage/component/eSIM/Table'));
const GiftCardsPage = lazy(() => import('@src/domains/admin/manage/component/giftCards/Table'));
const GovtServices = lazy(
    () => import('@src/domains/admin/manage/component/govtServices/GovtServices')
);
const Hike = lazy(() => import('@src/domains/admin/manage/component/hike/Hike'));
const InvoiceKyb = lazy(() => import('@src/domains/admin/manage/component/invoiceKyb/InvoiceKyb'));
const KybVerification = lazy(
    () => import('@src/domains/admin/manage/component/kybVerification/KybVerification')
);
const LegalTemplatesPage = lazy(
    () => import('@src/domains/admin/manage/component/legalTemplates/Table')
);
const LogisticsCorporate = lazy(
    () => import('@src/domains/admin/manage/component/logistics/LogisticsCorporate')
);
const OfficeAddressPlans = lazy(
    () => import('@src/domains/admin/manage/component/officeAddress/Plan')
);
const PaymentMethods = lazy(
    () => import('@src/domains/admin/manage/component/paymentMethods/PaymentMethods')
);
const MswipeRefunds = lazy(
    () => import('@src/domains/admin/manage/component/mswipeRefunds/MswipeRefunds')
);
const PayoutOnboardingPage = lazy(
    () => import('@src/domains/admin/manage/component/payoutOnboarding/PayoutOnboarding')
);
const CompanyDocuments = lazy(
    () => import('@src/domains/admin/manage/component/payroll/CompanyDocuments')
);
const Works = lazy(() => import('@src/domains/admin/manage/component/pekoWorks/Works'));
const SubscriptionPlansPage = lazy(
    () => import('@src/domains/admin/manage/component/subscriptionPlans/Table')
);
const SubscriptionPage = lazy(
    () => import('@src/domains/admin/manage/component/subscriptions/Table')
);
const CorporateTax = lazy(
    () => import('@src/domains/admin/manage/component/taxRegistration/CorporateTax')
);
const VendorPayout = lazy(
    () => import('@src/domains/admin/manage/component/vendorPayout/vendorPayout')
);
const WorkPlan = lazy(() => import('@src/domains/admin/manage/component/workPlan/WorkPlan'));
const WorkspacePage = lazy(() => import('@src/domains/admin/manage/component/workspace/Table'));
const IssueDetails = lazy(
    () => import('@src/domains/admin/officeSupplies/components/IssueDetails')
);
const OndcOrderDetails = lazy(
    () => import('@src/domains/admin/officeSupplies/components/OndcOrderDetails')
);
const OrdersHub = lazy(() => import('@src/domains/admin/officeSupplies/components/OrdersHub'));
const OndcProductDetails = lazy(
    () => import('@src/domains/admin/officeSupplies/components/product/catalog/OndcProductDetails')
);
const ProductsCatalog = lazy(
    () => import('@src/domains/admin/officeSupplies/components/product/catalog/ProductsCatalog')
);
const SellerCategoryReview = lazy(
    () =>
        import('@src/domains/admin/officeSupplies/components/product/catalog/review/SellerCategoryReview')
);
const Airline = lazy(() => import('@src/domains/admin/reports/components/Airline'));
const AirlineBookings = lazy(
    () => import('@src/domains/admin/reports/components/AirlineBookings/Index')
);
const AirlineModification = lazy(
    () => import('@src/domains/admin/reports/components/AirlineModification/Index')
);
const Attestation = lazy(
    () => import('@src/domains/admin/reports/components/Attestation/Attestation')
);
const BusinessEmails = lazy(
    () => import('@src/domains/admin/reports/components/businessEmails/BusinessEmails')
);
const ConnectionRequests = lazy(
    () => import('@src/domains/admin/reports/components/connectionRequest/ConnectionRequests')
);
const Corporate = lazy(() => import('@src/domains/admin/reports/components/corporate/Corporate'));
const CorporateCardTransactionsTable = lazy(
    () =>
        import('@src/domains/admin/reports/components/corporateCards/CorporateCardTransactionsTable')
);
const DomainHostingRefunds = lazy(
    () => import('@src/domains/admin/reports/components/domainHostingRefunds/DomainHostingRefunds')
);
const Esim = lazy(() => import('@src/domains/admin/reports/components/esim/Orders'));
const GlobalBusinessSetupApplicationsReport = lazy(
    () => import('@src/domains/admin/reports/components/globalBusinessSetup/ApplicationsTable')
);
const GlobalBusinessSetupRenewalsReport = lazy(
    () => import('@src/domains/admin/reports/components/globalBusinessSetup/RenewalsTable')
);
const GovtServicesApplications = lazy(
    () => import('@src/domains/admin/reports/components/govtServices/GovtServicesApplications')
);
const HotelBookings = lazy(
    () => import('@src/domains/admin/reports/components/HotelBookings/Index')
);
const BusCancellation = lazy(
    () => import('@src/domains/admin/reports/components/BusCancellation/Index')
);
const HotelCancellation = lazy(
    () => import('@src/domains/admin/reports/components/HotelCancellation/Index')
);
const Invoices = lazy(() => import('@src/domains/admin/reports/components/invoices/Invoices'));
const ReportOrder = lazy(() => import('@src/domains/admin/reports/components/orders/Orders'));
const PaymentLinksReport = lazy(
    () => import('@src/domains/admin/reports/components/paymentLinks/PaymentLinks')
);
const ReportScheduling = lazy(
    () => import('@src/domains/admin/reports/components/SchedulingReport/ReportScheduling')
);
const SoftwareOrders = lazy(
    () => import('@src/domains/admin/reports/components/softwareOrders/SoftwareOrders')
);
const SubscriptionsTable = lazy(
    () => import('@src/domains/admin/reports/components/subscriptions/SubscriptionsTable')
);
const SubscriptionWebhooksTable = lazy(
    () =>
        import('@src/domains/admin/reports/components/subscriptionWebhooks/SubscriptionWebhooksTable')
);
const TransactionsReport = lazy(
    () => import('@src/domains/admin/reports/components/Transaction/TransactionsReport')
);
const Vendors = lazy(() => import('@src/domains/admin/reports/components/vendors/Vendors'));
const Verification = lazy(
    () => import('@src/domains/admin/reports/components/VerificationSuite/Verification')
);
const WhatsAppAddOn = lazy(
    () => import('@src/domains/admin/reports/components/WhatsAppForBusiness/WhatsAppAddOn')
);
const WorksOrders = lazy(() => import('@src/domains/admin/reports/components/Works/Orders'));
const Workspace = lazy(() => import('@src/domains/admin/reports/components/workspace/Workspace'));
const OrderJournalsReport = lazy(
    () => import('@src/domains/admin/reports/components/OrderJournal/OrderJournalsReport')
);
const Banners = lazy(() => import('@src/domains/admin/settings/component/banners/Banners'));
const Branding = lazy(() => import('@src/domains/admin/settings/component/branding/Branding'));
const BusinessRegistrationCatalog = lazy(
    () =>
        import('@src/domains/admin/settings/component/businessRegistrationCatalog/BusinessRegistrationCatalog')
);
const Cashback = lazy(() => import('@src/domains/admin/settings/component/cashback/Cashback'));
const Categories = lazy(
    () => import('@src/domains/admin/settings/component/categories/Categories')
);
const ChartOfAccount = lazy(
    () => import('@src/domains/admin/settings/component/chartOfAccounts/ChartOfAccount')
);
const CoaRules = lazy(() => import('@src/domains/admin/settings/component/coaRules/CoaRules'));
const CouponCode = lazy(
    () => import('@src/domains/admin/settings/component/couponCode/CouponCode')
);
const DisabledService = lazy(
    () => import('@src/domains/admin/settings/component/disableService/DisabledService')
);
const InternalAccountsPage = lazy(
    () => import('@src/domains/admin/settings/component/internalAccounts/InternalAccounts')
);
const AccountingApprovals = lazy(
    () => import('@src/domains/admin/settings/component/accountingApprovals/AccountingApprovals')
);
const ServiceClassification = lazy(
    () =>
        import('@src/domains/admin/settings/component/serviceClassification/ServiceClassification')
);
const Templates = lazy(
    () => import('@src/domains/admin/settings/component/emailTemplates/Templates')
);
const EmailTemplatesListPage = lazy(
    () =>
        import('@src/domains/admin/settings/component/emailTemplateManagement/EmailTemplatesListPage')
);
const EmailTemplateEditorPage = lazy(
    () =>
       
        import('@src/domains/admin/settings/component/emailTemplateManagement/editor/EmailTemplateEditorPage')
);
const EmailLayoutsListPage = lazy(
    () =>
        import('@src/domains/admin/settings/component/emailLayoutManagement/EmailLayoutsListPage')
);
const EmailLayoutEditorPage = lazy(
    () =>
        import('@src/domains/admin/settings/component/emailLayoutManagement/editor/EmailLayoutEditorPage')
);
const EmailTemplateVariablesPage = lazy(
    () =>
        import('@src/domains/admin/settings/component/emailTemplateManagement/variables/EmailTemplateVariablesPage')
);
const IpWhitelist = lazy(
    () => import('@src/domains/admin/settings/component/ipWhitelist/IpWhitelist')
);
const PackagePage = lazy(() => import('@src/domains/admin/settings/component/package/Package'));
const PartnerRoles = lazy(
    () => import('@src/domains/admin/settings/component/partnerPermission/Roles')
);
const PekoCredits = lazy(
    () => import('@src/domains/admin/settings/component/peko-credits/PekoCredits')
);
const RefferalCode = lazy(
    () => import('@src/domains/admin/settings/component/refferalCode/RefferalCode')
);
const ServiceOperatorPage = lazy(
    () => import('@src/domains/admin/settings/component/serviceOperator/ServiceOperators')
);
const ServicePackage = lazy(
    () => import('@src/domains/admin/settings/component/servicePackage/ServicePackage')
);
const SubscriptionCodes = lazy(
    () => import('@src/domains/admin/settings/component/subscriptionCodes/SubscriptionCodes')
);
const VendorPage = lazy(() => import('@src/domains/admin/settings/component/vendor/Vendors'));
const WhatsAppNumbers = lazy(
    () => import('@src/domains/admin/settings/component/whatsappNumber/WhatsAppNumbers')
);
const Tickets = lazy(() => import('@src/domains/admin/support/components/Tickets'));
const PasswordPolicy = lazy(
    () => import('@src/domains/admin/systemConfigration/components/passwordPolicy/PasswordPolicy')
);
const PasswordProtection = lazy(
    () =>
        import('@src/domains/admin/systemConfigration/components/passwordProtection/PasswordProtection')
);
const CorporateUser = lazy(() => import('@src/domains/admin/users/components/CorporateUser'));
const PartnerUser = lazy(() => import('@src/domains/admin/users/components/PartnerUser'));
const PendingSignUps = lazy(() => import('@src/domains/admin/users/components/PendingSignUps'));
const Roles = lazy(() => import('@src/domains/admin/users/components/Roles'));
const ServiceAccessConfigurationCorporateUser = lazy(
    () =>
        import('@src/domains/admin/users/components/serviceAccessConfiguration/corporateUser/index')
);
const ServiceAccessConfigurationSystemUser = lazy(
    () => import('@src/domains/admin/users/components/serviceAccessConfiguration/systemUser/index')
);
const SystemUser = lazy(() => import('@src/domains/admin/users/components/SystemUser'));

const ReminderForm = lazy(
    () => import('@src/domains/admin/settings/component/preReminder/preReminder')
);
const LinkCreated = lazy(() => import('@src/domains/admin/paymentLinks/pages/LinkCreated'));
const CreateLink = lazy(() => import('@src/domains/admin/paymentLinks/pages/CreateLinkPage'));
const PaymentLinks = lazy(() => import('@src/domains/admin/paymentLinks/pages/PaymentLinks'));
const Profile = lazy(() => import('@src/domains/systemUser/profile/pages/Profile'));
const Accounts = lazy(() => import('@src/domains/admin/accounts/pages/Accounts'));
const Settings = lazy(() => import('@src/domains/admin/settings/page/Settings'));
const Manage = lazy(() => import('@src/domains/admin/manage/pages/Manage'));
const MobileRechargeProviders = lazy(
    () =>
        import('@src/domains/admin/manage/component/mobileRechargeProviders/MobileRechargeProviders')
);
const PayrollConfig = lazy(() => import('@src/domains/admin/payroll/pages/PayrollConfig'));
const Reports = lazy(() => import('@src/domains/admin/reports/pages/Reports'));
const Users = lazy(() => import('@src/domains/admin/users/pages/Users'));
const CorporateLookup = lazy(
    () => import('@src/domains/admin/corporateLookup/pages/CorporateLookup')
);
const CorporateCardLookup = lazy(
    () => import('@src/domains/admin/corporateCardLookup/pages/CorporateCardLookup')
);
const Orders = lazy(() => import('@src/domains/admin/officeSupplies/pages/Home'));
const Notifications = lazy(
    () => import('@src/domains/admin/notifications/pages/NotificationsList')
);
const SystemConfigration = lazy(
    () => import('@src/domains/admin/systemConfigration/pages/SystemConfigration')
);
const NeedHelpAdmin = lazy(() => import('@src/domains/admin/support/pages/NeedHelp'));
const ProductsBulkUpload = lazy(() => import('@src/domains/admin/manage/pages/ProductsBulkUpload'));
const CommonBulkUpload = lazy(() => import('@src/domains/admin/manage/pages/BulkUploadPage'));
const AirlineView = lazy(() => import('@src/domains/admin/reports/components/AirlineDetails'));
const roleToDashboardComponent = {
    admin: lazy(() => import('@src/domains/admin/dashboard/pages/Dashboard')),
    ecom_manager: lazy(() => import('@src/domains/systemUser/ecom_manager/home/pages/Dashboard')),
    partner: lazy(() => import('@src/domains/systemUser/partner/home/pages/Dashboard')),
};

const LazyDashboard = () => {
    const { roleName } = useAppSelector(state => state.reducer.auth);
    let DashboardComponent = (roleToDashboardComponent as Record<string, any>)[roleName];
    if (!DashboardComponent) {
        DashboardComponent = roleToDashboardComponent.admin;
    }
    return <DashboardComponent />;
};

export const systemUserRoutes = [
    {
        path: '',
        element: (
            <AuthGuard>
                <SystemUserGuard>
                    <DashboardLayout>
                        <RoleGuard>
                            <Suspense fallback={<Skeleton active />}>
                                <Outlet />
                            </Suspense>
                        </RoleGuard>
                    </DashboardLayout>
                </SystemUserGuard>
            </AuthGuard>
        ),
        children: [
            {
                element: <Navigate to={paths.systemUser.dashboard} replace />,
                index: true,
            },
            { element: <Profile />, path: paths.systemUser.profile },
            {
                element: <LazyDashboard />,
                path: paths.systemUser.dashboard,
            },
            {
                path: paths.systemUser.users,
                children: [
                    { element: <Users />, index: true },
                    { element: <CorporateUser />, path: paths.users.corporateUser },
                    { element: <CorporateLookup />, path: paths.users.corporateLookup },
                    {
                        element: <CorporateCardLookup />,
                        path: paths.users.corporateCardLookup,
                    },
                    { element: <SystemUser />, path: paths.users.systemUser },
                    { element: <Roles />, path: paths.users.roles },
                    {
                        element: <ServiceAccessConfigurationSystemUser />,
                        path: paths.users.systemUserConfiguration,
                    },
                    {
                        element: <ServiceAccessConfigurationCorporateUser />,
                        path: paths.users.corporateUserConfiguration,
                    },
                    // settings -> users
                    { element: <PartnerRoles />, path: paths.users.PartnerRoles },
                    { element: <PartnerUser />, path: paths.users.Partners },
                    { element: <PartnerServices />, path: paths.users.partnerServices },
                ],
            },
            { element: <PayrollConfig />, path: paths.systemUser.payrollConfig },
            { element: <Orders />, path: paths.systemUser.officeSupplies },
            {
                path: paths.systemUser.accounts,
                children: [
                    { element: <Accounts />, index: true },
                    { element: <SelfTransfer />, path: paths.accounts.selfTransfer },
                    { element: <TransferFunds />, path: paths.accounts.transferFunds },
                    { element: <CreateTransactions />, path: paths.accounts.createTransactions },
                    { element: <RefundTransactions />, path: paths.accounts.refundTransactions },
                ],
            },
            {
                path: paths.systemUser.reports,
                children: [
                    { element: <Reports />, index: true },
                    {
                        element: <SubscriptionsTable />,
                        path: paths.reportsAdmin.SubscriptionsTable,
                    },
                    { element: <Vendors />, path: paths.reportsAdmin.Vendors },
                    { element: <Corporate />, path: paths.reportsAdmin.Corporate },
                    { element: <ReportOrder />, path: paths.reportsAdmin.Orders },
                    { element: <SoftwareOrders />, path: paths.reportsAdmin.SoftwareOrders },
                    { element: <Esim />, path: paths.reportsAdmin.Esim },
                    { element: <WhatsAppAddOn />, path: paths.reports.addOns },
                    { element: <WorksOrders />, path: paths.reportsAdmin.OrderContent },
                    {
                        element: <ConnectionRequests />,
                        path: paths.reportsAdmin.ConnectionRequests,
                    },
                    { element: <Workspace />, path: paths.reportsAdmin.Workspace },
                    { element: <Invoices />, path: paths.reportsAdmin.Invoices },
                    { element: <Attestation />, path: paths.reportsAdmin.Attestation },
                    { element: <Airline />, path: paths.reportsAdmin.Airline },
                    { element: <Verification />, path: paths.reportsAdmin.VerificationReports },
                    {
                        path: paths.reportsAdmin.AirlineModification.index,
                        children: [
                            { element: <AirlineModification />, index: true },
                            {
                                element: <AirlineView />,
                                path: paths.reportsAdmin.AirlineModification.modificationRequest,
                            },
                        ],
                    },
                    { element: <AirlineBookings />, path: paths.reportsAdmin.AirlineBookings },
                    { element: <HotelCancellation />, path: paths.reportsAdmin.HotelCancellation },
                    { element: <BusCancellation />, path: paths.reportsAdmin.BusCancellation },
                    { element: <HotelBookings />, path: paths.reportsAdmin.HotelBookings },
                    { element: <ReportScheduling />, path: paths.reportsAdmin.ReportScheduling },
                    { element: <PaymentLinksReport />, path: paths.reportsAdmin.PaymentLinks },
                    { element: <BusinessEmails />, path: paths.reportsAdmin.BusinessEmails },
                    {
                        element: <DomainHostingRefunds />,
                        path: paths.reportsAdmin.DomainHostingRefunds,
                    },
                    {
                        element: <TransactionsReport />,
                        path: paths.reportsAdmin.TransactionsReport,
                    },
                    {
                        element: <OrderJournalsReport />,
                        path: paths.reportsAdmin.OrderJournals,
                    },
                    {
                        element: <GovtServicesApplications />,

                        path: paths.reportsAdmin.GovtServicesApplications,
                    },
                    {
                        element: <QuoteRequests />,
                        path: paths.reportsAdmin.InsuranceQuoteRequests,
                    },
                    // accounts -> reports
                    { element: <WalletReport />, path: paths.reportsAdmin.walletReport },
                    // users -> reports
                    { element: <PendingSignUps />, path: paths.reportsAdmin.pendingSignups },
                    {
                        element: <CorporateCardTransactionsTable />,
                        path: paths.reportsAdmin.Transactions,
                    },
                    {
                        element: <SubscriptionWebhooksTable />,
                        path: paths.reportsAdmin.SubscriptionWebhooks,
                    },
                    {
                        element: <GlobalBusinessSetupApplicationsReport />,
                        path: paths.reportsAdmin.globalBusinessSetupApplications,
                    },
                    {
                        element: <GlobalBusinessSetupRenewalsReport />,
                        path: paths.reportsAdmin.globalBusinessSetupRenewals,
                    },
                ],
            },
            {
                path: paths.systemUser.manage,
                children: [
                    { element: <Manage />, index: true },
                    { element: <CommonBulkUpload />, path: paths.manage.bulk },
                    { element: <SubscriptionPage />, path: paths.manage.softwareProducts },
                    { element: <SubscriptionPlansPage />, path: paths.manage.softwarePlans },
                    { element: <OfficeAddressPlans />, path: paths.manage.officeAddress },
                    { element: <WorkspacePage />, path: paths.manage.workspaces },
                    { element: <CorporateTax />, path: paths.manage.corporateTaxRegistration },
                    { element: <LogisticsCorporate />, path: paths.manage.logisticsCorporate },
                    { element: <KybVerification />, path: paths.manage.kybVerifications },

                    { element: <Works />, path: paths.manage.pekoWorks },
                    { element: <CompanyDocuments />, path: paths.manage.companyDocuments },
                    { element: <WorkPlan />, path: paths.manage.workPlans },
                    { element: <GiftCardsPage />, path: paths.manage.giftCards },
                    { element: <LegalTemplatesPage />, path: paths.manage.legalTemplates },
                    { element: <Plans />, path: paths.manage.esimPlans },
                    { element: <InvoiceKyb />, path: paths.manage.invoiceKyb },
                    { element: <Edoc />, path: paths.manage.eDocs },
                    { element: <GovtServices />, path: paths.manage.govtServices },
                    { element: <AttestationCategory />, path: paths.manage.attestationCategory },
                    {
                        element: <MobileRechargeProviders />,
                        path: paths.manage.mobileRechargeProviders,
                    },
                    { element: <VendorPayout />, path: paths.manage.vendorPayouts },
                    { element: <Hike />, path: paths.manage.hike },
                    { element: <DenominationWallet />, path: paths.manage.walletDenomination },

                    { element: <EmailDomain />, path: paths.manage.bussinessEmails },
                    { element: <EmailDomainPlans />, path: paths.manage.bussinessEmailsplans },
                    { element: <DomainHostingPlans />, path: paths.manage.domainHostingPlans },
                    { element: <DomainTlds />, path: paths.manage.domainTlds },
                    { element: <CarReportPlans />, path: paths.manage.carReportPlans },
                    {
                        element: <DomainHostingCancellations />,
                        path: paths.manage.domainHostingCancellations,
                    },
                    { element: <CollectorKyb />, path: paths.manage.collectorKyb },
                    // office supplies — one hub page, 4 in-page tabs (see OrdersHub)
                    { element: <OrdersHub initialTab="orders" />, path: paths.manage.orders },
                    { element: <OndcOrderDetails />, path: paths.manage.orderDetails },
                    { element: <IssueDetails />, path: paths.manage.issueDetails },
                    {
                        element: <OrdersHub initialTab="cancellations" />,
                        path: paths.manage.cancelAndRefunds,
                    },
                    {
                        element: <OrdersHub initialTab="returns" />,

                        path: paths.manage.returnRequest,
                    },
                    { element: <OrdersHub initialTab="issues" />, path: paths.manage.issues },
                    { element: <ProductsCatalog />, path: paths.manage.products },
                    { element: <OndcProductDetails />, path: paths.manage.productDetails },
                    {
                        element: <ProductsCatalog initialTab="review" />,
                        path: paths.manage.productsReview,
                    },
                    { element: <SellerCategoryReview />, path: paths.manage.productsReviewDetail },
                    { element: <ProductsBulkUpload />, path: paths.manage.bulkUpload },
                    // announcements
                    { element: <Notifications />, path: paths.manage.notifications },
                    // payment links
                    {
                        element: <PaymentLinks />,
                        path: paths.manage.paymentLinks,
                    },
                    {
                        element: <CreateLink />,
                        path: `${paths.manage.paymentLinks}/create-payment-link`,
                    },
                    {
                        element: <LinkCreated />,
                        path: `${paths.manage.paymentLinks}/create-payment-link/created`,
                    },
                    { element: <ConnectPage />, path: paths.manage.connect },
                    { element: <PaymentMethods />, path: paths.manage.paymentMethods },
                    { element: <MswipeRefunds />, path: paths.manage.mswipeRefunds },
                    { element: <BillerManagement />, path: paths.manage.billPayments },
                    { element: <AirlineAirports />, path: paths.manage.airlineAirports },
                    { element: <AdminCompliance />, path: paths.manage.compliance },
                    {
                        element: <BusinessRegistrationManage />,
                        path: paths.manage.businessRegistrationAdmin,
                    },
                    { element: <AdminCompliance />, path: paths.manage.compliance },
                    { element: <PayoutOnboardingPage />, path: paths.manage.payoutOnboarding },
                    {
                        element: <CorporateCardApplications />,
                        path: paths.manage.corporateCardApplications,
                    },
                    {
                        element: <CorporateDocumentsPage />,
                        path: paths.manage.corporateCardApplicationDocuments,
                    },
                    {
                        element: <CorporateCardTerminations />,
                        path: paths.manage.corporateCardTerminations,
                    },
                    {
                        element: <CorporateCardClosures />,
                        path: paths.manage.corporateCardClosures,
                    },
                    {
                        element: <CorporateCardDocumentLimits />,
                        path: paths.manage.corporateCardDocumentLimits,
                    },
                ],
            },
            {
                path: paths.systemUser.settings,
                children: [
                    { element: <Settings />, index: true },
                    { element: <VendorPage />, path: paths.settingsAdmin.vendor },
                    {
                        element: <ServiceOperatorPage />,
                        path: paths.settingsAdmin.serviceOperators,
                    },
                    { element: <PackagePage />, path: paths.settingsAdmin.PackagePage },
                    { element: <Cashback />, path: paths.settingsAdmin.Cashback },
                    { element: <SubscriptionCodes />, path: paths.settingsAdmin.SubscriptionCodes },
                    { element: <DisabledService />, path: paths.settingsAdmin.DisabledService },
                    { element: <Banners />, path: paths.settingsAdmin.Banners },
                    { element: <Categories />, path: paths.settingsAdmin.Categories },
                    { element: <RefferalCode />, path: paths.settingsAdmin.RefferalCode },
                    { element: <Templates />, path: paths.settingsAdmin.Templates },
                    { element: <CouponCode />, path: paths.settingsAdmin.CouponCode },
                    { element: <WhatsAppNumbers />, path: paths.settingsAdmin.WhatsAppNumbers },
                    { element: <Branding />, path: paths.settingsAdmin.Branding },
                    { element: <IpWhitelist />, path: paths.settingsAdmin.IPWhitelist },
                    { element: <ReminderForm />, path: paths.settingsAdmin.subscriptionReminders },
                    { element: <ServicePackage />, path: paths.settingsAdmin.servicePackages },
                    { element: <PekoCredits />, path: paths.settingsAdmin.pekoCredits },
                    { element: <CoaRules />, path: paths.settingsAdmin.coaRules },
                    { element: <ChartOfAccount />, path: paths.settingsAdmin.chartOfAccounts },
                    {
                        element: <InternalAccountsPage />,
                        path: paths.settingsAdmin.InternalAccounts,
                    },
                    {
                        element: <AccountingApprovals />,
                        path: paths.settingsAdmin.accountingApprovals,
                    },
                    {
                        element: <ServiceClassification />,
                        path: paths.settingsAdmin.serviceClassification,
                    },
                    {
                        element: <EmailTemplatesListPage />,
                        path: paths.settingsAdmin.EmailTemplates,
                    },
                    {
                        element: <EmailTemplateEditorPage />,
                        path: paths.settingsAdmin.EmailTemplateEditor,
                    },
                    {
                        element: <EmailTemplateVariablesPage />,
                        path: paths.settingsAdmin.EmailTemplateVariables,
                    },
                    {
                        element: <BusinessRegistrationCatalog />,
                        path: paths.settingsAdmin.businessRegistrationCatalog,
                    },
                    {
                        element: <EmailTemplatesListPage />,
                        path: paths.settingsAdmin.EmailTemplates,
                    },
                    {
                        element: <EmailTemplateEditorPage />,
                        path: paths.settingsAdmin.EmailTemplateEditor,
                    },
                    { element: <EmailLayoutsListPage />, path: paths.settingsAdmin.EmailLayouts },
                    {
                        element: <EmailLayoutEditorPage />,
                        path: paths.settingsAdmin.EmailLayoutEditor,
                    },
                ],
            },
            {
                path: paths.systemUser.needHelp,
                children: [
                    { element: <NeedHelpAdmin />, index: true },
                    { element: <Tickets />, path: paths.needHelpAdmin.tickets },
                ],
            },
            { element: <Notifications />, path: paths.systemUser.announcement },
            {
                path: paths.systemUser.systemConfiguration,
                children: [
                    { element: <SystemConfigration />, index: true },
                    { element: <PasswordPolicy />, path: paths.systemConfiguration.passwordPolicy },
                    {
                        element: <PasswordProtection />,
                        path: paths.systemConfiguration.passwordProtection,
                    },
                ],
            },
        ],
    },
];
