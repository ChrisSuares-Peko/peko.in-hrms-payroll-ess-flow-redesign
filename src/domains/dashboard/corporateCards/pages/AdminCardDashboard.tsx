import { AdminDashboardHome, AuditTrailTrigger, CardsSection } from '../components/admin';
import AccountingExport from '../components/admin/accounting/AccountingExport';
import AdminReimbursementsSection from '../components/admin/AdminReimbursementsSection';
import AdminVendorInvoicesSection from '../components/admin/AdminVendorInvoicesSection';
import AuthSimulatorSection from '../components/admin/AuthSimulatorSection';
import { ApprovalRequests } from '../components/approvalRequests';
import { TabbedDashboard } from '../components/common';
import { PeopleLandingPage } from '../components/landingPage';
import { AccountStatementPage } from '../components/landingPage/statement';
import { TransactionsSection } from '../components/landingPage/transactions';
import { SettingsPage } from '../components/settings';
import { WalletTab } from '../components/wallet';
import { ADMIN_TABS } from '../utils/data';

/**
 * Admin-facing Corporate Cards dashboard (Figma: admin view).
 * Designed tabs go in the `content` map; everything else falls back to a Coming Soon page,
 * so other contributors can add a tab by dropping one entry here.
 */
const AdminCardDashboard = () => (
    <TabbedDashboard
        tabs={ADMIN_TABS}
        content={{
            dashboard: <AdminDashboardHome />,
            wallet: <WalletTab />,
            cards: <CardsSection />,
            people: <PeopleLandingPage />,
            transactions: <TransactionsSection />,
            reconciliation: <AccountStatementPage />,
            'account-statement': <AccountStatementPage />,
            'approval-requests': <ApprovalRequests />,
            reimbursements: <AdminReimbursementsSection />,
            'vendor-invoices': <AdminVendorInvoicesSection />,
            'accounting-export': <AccountingExport />,
            'auth-simulator': <AuthSimulatorSection />,
            'audit-trail': <AuditTrailTrigger />,
            settings: <SettingsPage />,
        }}
    />
);

export default AdminCardDashboard;
