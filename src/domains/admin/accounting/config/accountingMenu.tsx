import { ElementType, ReactNode, lazy } from 'react';

import {
    ApiOutlined,
    AppstoreOutlined,
    BankOutlined,
    BookOutlined,
    CheckCircleOutlined,
    CreditCardOutlined,
    GlobalOutlined,
    HistoryOutlined,
    InboxOutlined,
    QuestionCircleOutlined,
    SwapOutlined,
    SyncOutlined,
    TableOutlined,
    TeamOutlined,
    ToolOutlined,
    WalletOutlined,
} from '@ant-design/icons';
import { RouteObject } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { LEDGER_LEAF_BY_KIND, LedgerKind } from './ledgerPaths';
import { SERVICE_LEAF_BY_KIND } from './servicePaths';
import AccountingPlaceholder from '../components/AccountingPlaceholder';
import { AccountingPlanType } from '../types/services';

export { LEDGER_LEAF_BY_KIND, accountingLedgerPath } from './ledgerPaths';
export type { LedgerKind, LedgerTabKey } from './ledgerPaths';
export {
    ACCOUNTING_SERVICE_CATEGORY,
    ACCOUNTING_SERVICE_TABS,
    SERVICE_LEAF_BY_KIND,
    accountingLeafPath,
    accountingServicePath,
} from './servicePaths';
export type { AccountingServiceTab } from './servicePaths';

export type AccountingMenuLeaf = {
    label: string;
    // What's actually rendered, when it differs from label (the permission-matching string —
    // see SERVICE_LEAF_BY_KIND). Falls back to label when absent.
    displayLabel?: string;
    slug: string;
    icon: ReactNode;
    element: ReactNode;
    children?: RouteObject[];
};

export type AccountingMenuGroup = {
    category: string;
    leaves: AccountingMenuLeaf[];
};

const ServiceWithoutPlans = lazy(() => import('../pages/ServiceWithoutPlans'));
const ServiceWithPlans = lazy(() => import('../pages/ServiceWithPlans'));
const ServiceDetail = lazy(() => import('../pages/ServiceDetail'));
const WhitelabelPartners = lazy(() => import('../pages/WhitelabelPartners'));
const ThirdPartyConfiguration = lazy(() => import('../pages/ThirdPartyConfiguration'));
const PekoSubscriptions = lazy(() => import('../pages/PekoSubscriptions'));
const AccountingFaq = lazy(() => import('../pages/AccountingFaq'));
const AuditTrail = lazy(() => import('../pages/AuditTrail'));
const Approvals = lazy(() => import('../pages/Approvals'));
const ManualOperations = lazy(() => import('../pages/ManualOperations'));
const ManualJournal = lazy(() => import('../pages/ManualJournal'));
const CommissionInvoice = lazy(() => import('../pages/CommissionInvoice'));
const ManualOperationProfiles = lazy(() => import('../pages/ManualOperationProfiles'));
const OrderJournals = lazy(
    () => import('@src/domains/admin/reports/components/OrderJournal/OrderJournalsReport')
);
const WalletJournals = lazy(() => import('@src/domains/admin/accounts/components/WalletReport'));
const ChartOfAccount = lazy(
    () => import('@src/domains/admin/settings/component/chartOfAccounts/ChartOfAccount')
);
const InternalAccounts = lazy(
    () => import('@src/domains/admin/settings/component/internalAccounts/InternalAccounts')
);
const VendorLedgerList = lazy(() => import('../pages/VendorLedgerList'));
const VendorLedgerDetail = lazy(() => import('../pages/VendorLedgerDetail'));
const SubscriberLedgerList = lazy(() => import('../pages/SubscriberLedgerList'));
const SubscriberLedgerDetail = lazy(() => import('../pages/SubscriberLedgerDetail'));
const PartnerLedgerList = lazy(() => import('../pages/PartnerLedgerList'));
const PartnerLedgerDetail = lazy(() => import('../pages/PartnerLedgerDetail'));
const PaymentGatewayLedgerList = lazy(() => import('../pages/PaymentGatewayLedgerList'));
const PaymentGatewayLedgerDetail = lazy(() => import('../pages/PaymentGatewayLedgerDetail'));

type LedgerPages = { List: ElementType; Detail: ElementType };

export const LEDGER_PAGES: Record<LedgerKind, LedgerPages> = {
    vendors: { List: VendorLedgerList, Detail: VendorLedgerDetail },
    subscribers: { List: SubscriberLedgerList, Detail: SubscriberLedgerDetail },
    partners: { List: PartnerLedgerList, Detail: PartnerLedgerDetail },
    payment_gateways: { List: PaymentGatewayLedgerList, Detail: PaymentGatewayLedgerDetail },
};

const leaf = (
    label: string,
    slug: string,
    icon: ReactNode,
    element?: ReactNode
): AccountingMenuLeaf => ({
    label,
    slug,
    icon,
    element: element ?? <AccountingPlaceholder title={label} />,
});

const serviceLeaf = (
    kind: AccountingPlanType,
    icon: ReactNode,
    List: typeof ServiceWithPlans
): AccountingMenuLeaf => ({
    label: SERVICE_LEAF_BY_KIND[kind].label,
    displayLabel: SERVICE_LEAF_BY_KIND[kind].displayLabel,
    slug: SERVICE_LEAF_BY_KIND[kind].slug,
    icon,
    element: <List />,
    children: [{ path: ':accessKey/:tab?', element: <ServiceDetail kind={kind} /> }],
});

const ledgerLeaf = (kind: LedgerKind, icon: ReactNode): AccountingMenuLeaf => {
    const { List, Detail } = LEDGER_PAGES[kind];
    return {
        label: LEDGER_LEAF_BY_KIND[kind].label,
        slug: LEDGER_LEAF_BY_KIND[kind].slug,
        icon,
        element: <List />,
        children: [{ path: ':id/:tab?', element: <Detail /> }],
    };
};

export const ACCOUNTING_MENU: AccountingMenuGroup[] = [
    {
        category: 'Operations',
        leaves: [
            leaf(
                'Order Journals',
                paths.accountingAdmin.orderJournals,
                <BookOutlined />,
                <OrderJournals />
            ),
            leaf(
                'Wallet Journals',
                paths.accountingAdmin.walletJournals,
                <WalletOutlined />,
                <WalletJournals />
            ),
            serviceLeaf('without_plans', <InboxOutlined />, ServiceWithoutPlans),
            serviceLeaf('with_plans', <AppstoreOutlined />, ServiceWithPlans),
            leaf(
                'Peko Subscriptions',
                paths.accountingAdmin.pekoSubscriptions,
                <SyncOutlined />,
                <PekoSubscriptions />
            ),
            leaf(
                'Whitelabel Partners',
                paths.accountingAdmin.whitelabelPartners,
                <GlobalOutlined />,
                <WhitelabelPartners />
            ),
            leaf(
                'Chart of Accounts',
                paths.accountingAdmin.chartOfAccounts,
                <TableOutlined />,
                <ChartOfAccount permissionCategory="Accounting" />
            ),
            leaf(
                'Internal Purchase Accounts',
                paths.accountingAdmin.internalPurchaseAccounts,
                <TeamOutlined />,
                <InternalAccounts permissionCategory="Accounting" />
            ),
            {
                ...leaf(
                    'Third Party Configuration',
                    paths.accountingAdmin.thirdPartyConfiguration,
                    <ApiOutlined />,
                    <ThirdPartyConfiguration />
                ),
                children: [{ path: ':tab', element: <ThirdPartyConfiguration /> }],
            },
        ],
    },
    {
        category: 'Ledgers',
        leaves: [
            ledgerLeaf('vendors', <BankOutlined />),
            ledgerLeaf('subscribers', <WalletOutlined />),
            ledgerLeaf('partners', <CreditCardOutlined />),
            ledgerLeaf('payment_gateways', <SwapOutlined />),
        ],
    },
    {
        category: 'Others',
        leaves: [
            leaf(
                'Approvals',
                paths.accountingAdmin.approvals,
                <CheckCircleOutlined />,
                <Approvals />
            ),
            {
                ...leaf(
                    'Manual Operations',
                    paths.accountingAdmin.manualOperations,
                    <ToolOutlined />,
                    <ManualOperations />
                ),
                children: [
                    { path: 'journal', element: <ManualJournal /> },
                    { path: 'journal/:corporateTxnId', element: <ManualJournal /> },
                    { path: 'commission-invoice', element: <CommissionInvoice /> },
                    { path: ':operation', element: <ManualOperationProfiles /> },
                ],
            },
            leaf(
                'Audit Trail',
                paths.accountingAdmin.auditTrail,
                <HistoryOutlined />,
                <AuditTrail />
            ),
            leaf('FAQ', paths.accountingAdmin.faq, <QuestionCircleOutlined />, <AccountingFaq />),
        ],
    },
];
