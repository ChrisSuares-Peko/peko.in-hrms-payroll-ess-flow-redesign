import { ReactNode, useCallback, useMemo, useState } from 'react';

import { FileTextOutlined, SwapOutlined, WalletOutlined } from '@ant-design/icons';
import { Alert, Breadcrumb, Button, Card, DatePicker, Flex, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import {
    partnerLabel,
    subscriberDisplayName,
    walletMismatchMessage,
} from '../components/ledgers/subscriberColumns';
import SubscriberTabPanel from '../components/ledgers/SubscriberTabPanel';
import SummaryStrip from '../components/serviceDetail/SummaryStrip';
import {
    LEDGER_LEAF_BY_KIND,
    LEDGER_TABS,
    LEDGER_TAB_LABELS,
    LedgerTabKey,
    accountingLedgerPath,
} from '../config/ledgerPaths';
import { accountingLeafPath } from '../config/servicePaths';
import { DrillPanel, DrillTab, useAccountingDrillPanel } from '../context/AccountingShellContext';
import { useSubscriberLedgerDetail } from '../hooks/useSubscriberLedger';
import { SubscriberLedgerRow, SubscriberSummary } from '../types/subscriberLedger';
import { PillMeta, formatInr } from '../utils/commission';

const SUBSCRIBER_TAB_ICONS: Partial<Record<LedgerTabKey, ReactNode>> = {
    transactions: <SwapOutlined />,
    wallet: <WalletOutlined />,
    bills: <FileTextOutlined />,
};

const DATE_FORMAT = 'YYYY-MM-DD';

export const subscriberStatusPill = (subscriber: {
    isActive: boolean;
    walletBalance: number;
}): PillMeta => {
    if (!subscriber.isActive) return { label: 'Inactive', tone: 'neutral' };
    return subscriber.walletBalance < 0
        ? { label: 'Negative balance', tone: 'warning' }
        : { label: 'Active', tone: 'success' };
};

export const subscriberSubtitle = (subscriber: SubscriberLedgerRow) =>
    [
        subscriber.username !== subscriberDisplayName(subscriber) ? subscriber.username : null,
        partnerLabel(subscriber.partnerName),
        subscriber.planName,
    ]
        .filter(Boolean)
        .join(' · ');

export const summaryItems = (summary: SubscriberSummary) => [
    { label: 'Top-ups', value: formatInr(summary.topUps) },
    { label: 'Spent from Wallet', value: formatInr(summary.spent) },
    { label: 'Paid via Gateway', value: formatInr(summary.paidViaGateway) },
    { label: 'Platform Fee', value: formatInr(summary.platformFee) },
    { label: 'Cashback', value: formatInr(summary.cashback) },
    {
        label: 'Wallet Balance',
        value: formatInr(summary.walletBalance),
        tone: summary.walletBalance < 0 ? ('warning' as const) : ('default' as const),
    },
];

export const summaryScopeNote = (
    range: { from: string; to: string },
    summary: SubscriberSummary
) => {
    const period = `${dayjs(range.from).format('DD MMM YYYY')} to ${dayjs(range.to).format('DD MMM YYYY')}`;
    const withdrawals =
        summary.withdrawals > 0
            ? ` Admin withdrawals of ${formatInr(summary.withdrawals)} in this period are listed on the Cashbacks & Rewards tab.`
            : '';
    return `Wallet Balance is what the subscriber holds today. Top-ups, Spent from Wallet, Paid via Gateway, Platform Fee and Cashback cover ${period}.${withdrawals}`;
};

const SubscriberLedgerDetail = () => {
    const { id = '', tab } = useParams();
    const navigate = useNavigate();
    const leaf = LEDGER_LEAF_BY_KIND.subscribers;
    const listPath = accountingLeafPath(leaf.slug);

    const [range, setRange] = useState({
        from: dayjs().subtract(1, 'month').format(DATE_FORMAT),
        to: dayjs().format(DATE_FORMAT),
    });

    const { subscriber, summary, isLoading, notFound } = useSubscriberLedgerDetail(id, range);
    const displayName = subscriber ? subscriberDisplayName(subscriber) : '';

    const tabs = useMemo<DrillTab[]>(
        () =>
            leaf.tabs.map(key => ({
                key,
                label: LEDGER_TAB_LABELS[key],
                icon: SUBSCRIBER_TAB_ICONS[key],
            })),
        [leaf]
    );
    const activeTab = leaf.tabs.find(key => key === tab);

    const onTabChange = useCallback(
        (key: string) => navigate(accountingLedgerPath('subscribers', id, key as LedgerTabKey)),
        [navigate, id]
    );

    const panel = useMemo<DrillPanel | null>(() => {
        if (!subscriber || !activeTab) return null;
        return {
            backTo: listPath,
            backLabel: leaf.backLabel,
            title: displayName,
            subtitle: subscriberSubtitle(subscriber),
            status: subscriberStatusPill(subscriber),
            tabs,
            activeKey: activeTab,
            onTabChange,
        };
    }, [subscriber, displayName, activeTab, listPath, leaf.backLabel, tabs, onTabChange]);

    useAccountingDrillPanel(panel);

    if (!activeTab) {
        return <Navigate to={accountingLedgerPath('subscribers', id)} replace />;
    }

    if (isLoading) {
        return <Skeleton active paragraph={{ rows: 8 }} />;
    }

    if (notFound || !subscriber || !summary) {
        return (
            <Card className="rounded-xl border border-borderCard shadow-none text-center">
                <Typography.Title level={5} className="!text-textHeadings">
                    {leaf.noun} not found
                </Typography.Title>
                <Typography.Text className="block mb-4 text-textBody">
                    This subscriber does not exist or is not a corporate account.
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
                    { title: <span className="text-brandColor">{displayName}</span> },
                ]}
            />
            {summary.walletDifference !== 0 && (
                <Alert
                    className="mb-4"
                    type="warning"
                    showIcon
                    message={walletMismatchMessage(summary.walletDifference)}
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
                    footnote={summaryScopeNote(range, summary)}
                    faq={{ screen: 'Subscribers', tab: 'Summary' }}
                />
            )}
            <Flex vertical gap={16} className="mt-5">
                <SubscriberTabPanel
                    key={`${subscriber.credentialId}:${activeTab}`}
                    credentialId={id}
                    subscriberName={displayName}
                    tab={activeTab}
                    range={range}
                />
            </Flex>
        </div>
    );
};

export default SubscriberLedgerDetail;
