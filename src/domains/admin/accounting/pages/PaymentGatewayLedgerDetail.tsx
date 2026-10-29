import { ReactNode, useCallback, useMemo, useState } from 'react';

import { BankOutlined, ProfileOutlined, SwapOutlined } from '@ant-design/icons';
import { Alert, Breadcrumb, Button, Card, DatePicker, Flex, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { useFindRolesService } from '@utils/findRolesService';

import { gatewayStatusPill } from './PaymentGatewayLedgerList';
import PaymentGatewayStatementPanel from '../components/ledgers/PaymentGatewayStatementPanel';
import PaymentGatewayTabPanel from '../components/ledgers/PaymentGatewayTabPanel';
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
import { usePaymentGatewayDetail } from '../hooks/usePaymentGatewayLedger';
import { PaymentGatewaySummary } from '../types/paymentGatewayLedger';
import { formatInr } from '../utils/commission';

const GATEWAY_TAB_ICONS: Partial<Record<LedgerTabKey, ReactNode>> = {
    transactions: <SwapOutlined />,
    'received-and-bills': <BankOutlined />,
    'statement-of-accounts': <ProfileOutlined />,
};

const DATE_FORMAT = 'YYYY-MM-DD';

export const MISSING_OPENING_BALANCE_MESSAGE =
    'No opening balance is set for this gateway, so everything it collected before this portal started recording still counts as outstanding. Set one as of the go-live date.';

export const summaryItems = (summary: PaymentGatewaySummary) => [
    { label: 'Collected', value: formatInr(summary.collected) },
    { label: 'Received', value: formatInr(summary.received) },
    { label: 'Charges', value: formatInr(summary.fees) },
    {
        label: 'Yet To Receive',
        value: formatInr(summary.outstanding),
        tone: summary.outstanding > 0 ? ('warning' as const) : ('default' as const),
    },
    {
        label: 'Last Receipt',
        value: summary.lastReceiptDate
            ? dayjs(summary.lastReceiptDate).format('DD MMM YYYY')
            : 'None yet',
    },
];

export const summaryScopeNote = (range: { from: string; to: string }) =>
    `Yet To Receive is everything collected to date less everything received and charged to date. Collected, Received and Charges cover ${dayjs(
        range.from
    ).format('DD MMM YYYY')} to ${dayjs(range.to).format(
        'DD MMM YYYY'
    )}. A refund takes the money back off the gateway on the day it went back.`;

const PaymentGatewayLedgerDetail = () => {
    const { id = '', tab } = useParams();
    const navigate = useNavigate();
    const leaf = LEDGER_LEAF_BY_KIND.payment_gateways;
    const listPath = accountingLeafPath(leaf.slug);
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const access = useFindRolesService(services?.data, leaf.label, ACCOUNTING_SERVICE_CATEGORY);
    const canUpdate = Boolean(access?.update);

    const [range, setRange] = useState({
        from: dayjs().subtract(1, 'month').format(DATE_FORMAT),
        to: dayjs().format(DATE_FORMAT),
    });

    const { gateway, summary, isLoading, notFound, refetch } = usePaymentGatewayDetail(id, range);

    const tabs = useMemo<DrillTab[]>(
        () =>
            leaf.tabs.map(key => ({
                key,
                label: LEDGER_TAB_LABELS[key],
                icon: GATEWAY_TAB_ICONS[key],
            })),
        [leaf]
    );
    const activeTab = leaf.tabs.find(key => key === tab);

    const onTabChange = useCallback(
        (key: string) =>
            navigate(accountingLedgerPath('payment_gateways', id, key as LedgerTabKey)),
        [navigate, id]
    );

    const panel = useMemo<DrillPanel | null>(() => {
        if (!gateway || !activeTab) return null;
        return {
            backTo: listPath,
            backLabel: leaf.backLabel,
            title: gateway.gatewayName,
            subtitle: gateway.gatewayAccountId,
            status: gatewayStatusPill(gateway),
            tabs,
            activeKey: activeTab,
            onTabChange,
        };
    }, [gateway, activeTab, listPath, leaf.backLabel, tabs, onTabChange]);

    useAccountingDrillPanel(panel);

    if (!activeTab) {
        return <Navigate to={accountingLedgerPath('payment_gateways', id)} replace />;
    }

    if (isLoading) {
        return <Skeleton active paragraph={{ rows: 8 }} />;
    }

    if (notFound || !gateway || !summary) {
        return (
            <Card className="rounded-xl border border-borderCard shadow-none text-center">
                <Typography.Title level={5} className="!text-textHeadings">
                    {leaf.noun} not found
                </Typography.Title>
                <Typography.Text className="block mb-4 text-textBody">
                    No chart-of-accounts row matches this gateway, or nothing has been posted to it
                    yet.
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
                    { title: <span className="text-brandColor">{gateway.gatewayName}</span> },
                ]}
            />
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
                    faq={{ screen: 'Payment Gateways', tab: 'Summary' }}
                />
            )}
            {activeTab === LEDGER_TABS.statement ? (
                <div className="mt-5">
                    <PaymentGatewayStatementPanel
                        key={`${gateway.gatewayAccountId}:statement`}
                        gatewayId={id}
                        gatewayName={gateway.gatewayName}
                        range={range}
                    />
                </div>
            ) : (
                <Flex vertical gap={16} className="mt-5">
                    <PaymentGatewayTabPanel
                        key={`${gateway.gatewayAccountId}:${activeTab}`}
                        gatewayId={id}
                        gatewayName={gateway.gatewayName}
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

export default PaymentGatewayLedgerDetail;
