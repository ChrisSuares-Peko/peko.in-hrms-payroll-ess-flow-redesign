import { ReactNode, useCallback, useMemo, useState } from 'react';

import {
    CreditCardOutlined,
    FileTextOutlined,
    ProfileOutlined,
    SwapOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { Alert, Breadcrumb, Button, Card, DatePicker, Flex, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { useFindRolesService } from '@utils/findRolesService';

import { MISSING_ACCOUNT_MESSAGE, partnerStatusPill } from './PartnerLedgerList';
import PartnerStatementPanel from '../components/ledgers/PartnerStatementPanel';
import PartnerTabPanel from '../components/ledgers/PartnerTabPanel';
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
import { usePartnerLedgerDetail } from '../hooks/usePartnerLedger';
import { PartnerSummary } from '../types/partnerLedger';
import { formatInr } from '../utils/commission';

const PARTNER_TAB_ICONS: Partial<Record<LedgerTabKey, ReactNode>> = {
    transactions: <SwapOutlined />,
    'own-subscriptions': <SyncOutlined />,
    payments: <CreditCardOutlined />,
    'debit-notes': <FileTextOutlined />,
    'statement-of-accounts': <ProfileOutlined />,
};

const DATE_FORMAT = 'YYYY-MM-DD';

export const MISSING_OPENING_BALANCE_MESSAGE =
    'No opening balance is set for this partner, so everything it earned before this portal started recording still counts as unpaid. Set one as of the go-live date.';

export const MISSING_SHARE_MESSAGE =
    'This partner has no share percentage configured, so every order placed through its portal earns it nothing. Set the share on Whitelabel Partners; it applies to orders placed from then on, not to past ones.';

export const summaryItems = (summary: PartnerSummary) => [
    { label: 'Earned', value: formatInr(summary.earned) },
    { label: 'Paid', value: formatInr(summary.paid) },
    { label: 'Debit Notes', value: formatInr(summary.debitNotes) },
    { label: 'GMV', value: formatInr(summary.gmv) },
    {
        label: 'Left To Pay',
        value: formatInr(summary.owed),
        tone: summary.owed > 0 ? ('warning' as const) : ('default' as const),
    },
    {
        label: 'Last Payment',
        value: summary.lastPayoutDate
            ? dayjs(summary.lastPayoutDate).format('DD MMM YYYY')
            : 'None yet',
    },
];

export const summaryScopeNote = (range: { from: string; to: string }) =>
    `GMV is the full value of every successful order for this partner, before any discount, whether or not an accounting entry exists. GMV, Earned, Paid and Debit Notes cover ${dayjs(
        range.from
    ).format('DD MMM YYYY')} to ${dayjs(range.to).format(
        'DD MMM YYYY'
    )}. A refund takes the share back on the day it came back.`;

const PartnerLedgerDetail = () => {
    const { id = '', tab } = useParams();
    const navigate = useNavigate();
    const leaf = LEDGER_LEAF_BY_KIND.partners;
    const listPath = accountingLeafPath(leaf.slug);
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const access = useFindRolesService(services?.data, leaf.label, ACCOUNTING_SERVICE_CATEGORY);
    const canUpdate = Boolean(access?.update);

    const [range, setRange] = useState({
        from: dayjs().subtract(1, 'month').format(DATE_FORMAT),
        to: dayjs().format(DATE_FORMAT),
    });

    const { partner, summary, accountConfigured, gstRate, isLoading, notFound, refetch } =
        usePartnerLedgerDetail(id, range);

    const tabs = useMemo<DrillTab[]>(
        () =>
            leaf.tabs.map(key => ({
                key,
                label: LEDGER_TAB_LABELS[key],
                icon: PARTNER_TAB_ICONS[key],
            })),
        [leaf]
    );
    const activeTab = leaf.tabs.find(key => key === tab);

    const onTabChange = useCallback(
        (key: string) => navigate(accountingLedgerPath('partners', id, key as LedgerTabKey)),
        [navigate, id]
    );

    const panel = useMemo<DrillPanel | null>(() => {
        if (!partner || !activeTab) return null;
        return {
            backTo: listPath,
            backLabel: leaf.backLabel,
            title: partner.partnerName,
            subtitle:
                partner.sharePercentage === null
                    ? 'No share configured'
                    : `${partner.sharePercentage}% share · ${partner.portalUrl || 'No portal linked'}`,
            status: partnerStatusPill(partner),
            tabs,
            activeKey: activeTab,
            onTabChange,
        };
    }, [partner, activeTab, listPath, leaf.backLabel, tabs, onTabChange]);

    useAccountingDrillPanel(panel);

    if (!activeTab) {
        return <Navigate to={accountingLedgerPath('partners', id)} replace />;
    }

    if (isLoading) {
        return <Skeleton active paragraph={{ rows: 8 }} />;
    }

    if (notFound || !partner || !summary) {
        return (
            <Card className="rounded-xl border border-borderCard shadow-none text-center">
                <Typography.Title level={5} className="!text-textHeadings">
                    {leaf.noun} not found
                </Typography.Title>
                <Typography.Text className="block mb-4 text-textBody">
                    This partner does not exist or is not a whitelabel partner.
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
                    { title: <span className="text-brandColor">{partner.partnerName}</span> },
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
            {partner.sharePercentage === null && (
                <Alert
                    className="mb-4"
                    type="warning"
                    showIcon
                    message={MISSING_SHARE_MESSAGE}
                    action={
                        <Link to={accountingLeafPath(paths.accountingAdmin.whitelabelPartners)}>
                            Open whitelabel partners
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
                    faq={{ screen: 'Partners', tab: 'Summary' }}
                />
            )}
            {activeTab === LEDGER_TABS.statement ? (
                <div className="mt-5">
                    <PartnerStatementPanel
                        key={`${partner.credentialId}:statement`}
                        partnerId={id}
                        partnerName={partner.partnerName}
                        range={range}
                    />
                </div>
            ) : (
                <Flex vertical gap={16} className="mt-5">
                    <PartnerTabPanel
                        key={`${partner.credentialId}:${activeTab}`}
                        partnerId={id}
                        partnerName={partner.partnerName}
                        gstRate={gstRate}
                        tab={activeTab}
                        range={range}
                        canUpdate={canUpdate}
                        onChanged={refetch}
                    />
                </Flex>
            )}
        </div>
    );
};

export default PartnerLedgerDetail;
