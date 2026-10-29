import { ReactNode, useCallback, useMemo, useState } from 'react';

import {
    BankOutlined,
    FileExclamationOutlined,
    FileTextOutlined,
    PercentageOutlined,
    ProfileOutlined,
    ShoppingOutlined,
    SwapOutlined,
} from '@ant-design/icons';
import { Alert, Breadcrumb, Button, Card, DatePicker, Flex, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { useFindRolesService } from '@utils/findRolesService';

import VendorStatementPanel from '../components/ledgers/VendorStatementPanel';
import VendorTabPanel from '../components/ledgers/VendorTabPanel';
import SummaryStrip from '../components/serviceDetail/SummaryStrip';
import {
    LEDGER_LEAF_BY_KIND,
    LEDGER_TABS,
    LEDGER_TAB_LABELS,
    LedgerTabKey,
    accountingLedgerPath,
} from '../config/ledgerPaths';
import { ACCOUNTING_SERVICE_CATEGORY, accountingLeafPath } from '../config/servicePaths';
import { DrillPanel, DrillTab, useAccountingDrillPanel } from '../context/AccountingShellContext';
import { useVendorLedgerDetail } from '../hooks/useVendorLedger';
import { VendorLedgerRow, VendorLedgerSummary } from '../types/vendorLedger';
import { PillMeta, formatInr } from '../utils/commission';

const VENDOR_TAB_ICONS: Partial<Record<LedgerTabKey, ReactNode>> = {
    transactions: <SwapOutlined />,
    commissions: <PercentageOutlined />,
    'cost-of-sales': <ShoppingOutlined />,
    deposits: <BankOutlined />,
    'credit-notes': <FileTextOutlined />,
    'debit-notes': <FileExclamationOutlined />,
    'statement-of-accounts': <ProfileOutlined />,
};

const DATE_FORMAT = 'YYYY-MM-DD';

export const vendorStatusPill = (vendor: VendorLedgerRow): PillMeta => {
    if (!vendor.isActive) return { label: 'Inactive', tone: 'neutral' };
    return vendor.lowBalance
        ? { label: 'Low balance', tone: 'warning' }
        : { label: 'Healthy', tone: 'success' };
};

export const MISSING_OPENING_BALANCE_MESSAGE =
    'No opening balance is set for this vendor, so anything owed before this portal started recording is missing from the figures below.';

export const MISSING_ACCOUNT_MESSAGE =
    'The shared "Vendor Deposits" account is not set up in the chart of accounts, so vendor usage cannot be read from the journals yet.';

export const summaryItems = (summary: VendorLedgerSummary) => [
    { label: 'Opening Balance', value: formatInr(summary.openingBalance) },
    { label: 'Deposit', value: formatInr(summary.deposited) },
    { label: 'Total Transaction', value: formatInr(summary.totalTransaction) },
    { label: 'Commission earned', value: formatInr(summary.commission) },
    {
        label: 'Available',
        value: formatInr(summary.available),
        tone: summary.available < 0 ? ('warning' as const) : ('default' as const),
    },
];

export const summaryScopeNote = (range: { from: string; to: string }) =>
    `Opening Balance is the balance through ${dayjs(range.from)
        .subtract(1, 'day')
        .format(
            'DD MMM YYYY'
        )}. Deposit, Total Transaction, Commission earned and Available cover ${dayjs(
        range.from
    ).format('DD MMM YYYY')} to ${dayjs(range.to).format(
        'DD MMM YYYY'
    )}. Total Transaction includes the order amounts of sales on margin, credit notes and cost of sales, less debit notes, net of reversals; a sale on a markup basis, agent or principal, is listed under Transactions but never comes out of the advance. Available is the balance at the end of the selected period: Opening Balance + Deposit − Total Transaction + Commission earned. Commission earned is net of refunds and includes the commissions recorded by hand.`;

const VendorLedgerDetail = () => {
    const { id = '', tab } = useParams();
    const navigate = useNavigate();
    const leaf = LEDGER_LEAF_BY_KIND.vendors;
    const listPath = accountingLeafPath(leaf.slug);
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const access = useFindRolesService(services?.data, leaf.label, ACCOUNTING_SERVICE_CATEGORY);
    const canUpdate = Boolean(access?.update);

    const [range, setRange] = useState({
        from: dayjs().subtract(1, 'month').format(DATE_FORMAT),
        to: dayjs().format(DATE_FORMAT),
    });

    const { vendor, summary, accountConfigured, gstRate, isLoading, notFound, refetch } =
        useVendorLedgerDetail(id, range);

    const tabs = useMemo<DrillTab[]>(
        () =>
            leaf.tabs.map(key => ({
                key,
                label: LEDGER_TAB_LABELS[key],
                icon: VENDOR_TAB_ICONS[key],
            })),
        [leaf]
    );
    const activeTab = leaf.tabs.find(key => key === tab);

    const onTabChange = useCallback(
        (key: string) => navigate(accountingLedgerPath('vendors', id, key as LedgerTabKey)),
        [navigate, id]
    );

    const panel = useMemo<DrillPanel | null>(() => {
        if (!vendor || !activeTab) return null;
        return {
            backTo: listPath,
            backLabel: leaf.backLabel,
            title: vendor.vendorName,
            subtitle: vendor.services.length ? vendor.services.join(' · ') : 'No services linked',
            subtitleExpandable: true,
            status: vendorStatusPill(vendor),
            tabs,
            activeKey: activeTab,
            onTabChange,
        };
    }, [vendor, activeTab, listPath, leaf.backLabel, tabs, onTabChange]);

    useAccountingDrillPanel(panel);

    if (!activeTab) {
        return <Navigate to={accountingLedgerPath('vendors', id)} replace />;
    }

    if (isLoading) {
        return <Skeleton active paragraph={{ rows: 8 }} />;
    }

    if (notFound || !vendor || !summary) {
        return (
            <Card className="rounded-xl border border-borderCard shadow-none text-center">
                <Typography.Title level={5} className="!text-textHeadings">
                    {leaf.noun} not found
                </Typography.Title>
                <Typography.Text className="block mb-4 text-textBody">
                    This vendor does not exist or has no services linked to it.
                </Typography.Text>
                <Button type="primary" onClick={() => navigate(listPath)}>
                    Back to {leaf.label}
                </Button>
            </Card>
        );
    }

    return (
        <div>
            <Breadcrumb
                className="mb-5 text-sm"
                items={[
                    { title: <Link to={paths.systemUser.accounting}>Accounting</Link> },
                    { title: <Link to={listPath}>{leaf.label}</Link> },
                    { title: <span className="text-brandColor">{vendor.vendorName}</span> },
                ]}
            />
            {!accountConfigured && (
                <Alert
                    className="mb-4"
                    type="warning"
                    showIcon
                    message={MISSING_ACCOUNT_MESSAGE}
                    action={
                        <Link to={accountingLeafPath(paths.accountingAdmin.chartOfAccounts)}>
                            Open chart of accounts
                        </Link>
                    }
                />
            )}
            {!summary.openingBalanceSet && (
                <Alert
                    className="mb-4"
                    type="warning"
                    showIcon
                    message={MISSING_OPENING_BALANCE_MESSAGE}
                />
            )}
            <Flex justify="end" className="mb-4">
                <DatePicker.RangePicker
                    allowClear={false}
                    format={DATE_FORMAT}
                    value={[dayjs(range.from), dayjs(range.to)]}
                    onChange={values => {
                        if (!values || !values[0] || !values[1]) return;
                        setRange({
                            from: values[0].format(DATE_FORMAT),
                            to: values[1].format(DATE_FORMAT),
                        });
                    }}
                />
            </Flex>
            {activeTab === LEDGER_TABS.transactions && (
                <SummaryStrip
                    items={summaryItems(summary)}
                    footnote={summaryScopeNote(range)}
                    faq={{ screen: 'Vendors', tab: 'Summary' }}
                    distribution="space-between"
                />
            )}
            {activeTab === LEDGER_TABS.statement ? (
                <div className="mt-5">
                    <VendorStatementPanel
                        key={`${vendor.id}:statement`}
                        vendorId={id}
                        vendorName={vendor.vendorName}
                        range={range}
                        openingBalanceSet={Boolean(summary.openingBalanceSet)}
                    />
                </div>
            ) : (
                <Flex vertical gap={16} className="mt-5">
                    <VendorTabPanel
                        key={`${vendor.id}:${activeTab}`}
                        vendorId={id}
                        vendorName={vendor.vendorName}
                        gstRate={gstRate}
                        tab={activeTab}
                        range={range}
                        canUpdate={canUpdate}
                        openingBalanceSet={Boolean(summary.openingBalanceSet)}
                        onChanged={refetch}
                    />
                </Flex>
            )}
        </div>
    );
};

export default VendorLedgerDetail;
