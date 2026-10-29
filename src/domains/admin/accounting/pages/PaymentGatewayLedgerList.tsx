import { ReactNode, useMemo, useState } from 'react';

import {
    ClockCircleOutlined,
    MinusCircleOutlined,
    PlusCircleOutlined,
    ReloadOutlined,
    RightOutlined,
    SearchOutlined,
    SwapOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { Button, Col, Flex, Input, Pagination, Row, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import StatusPill from '../components/common/StatusPill';
import KpiCard from '../components/dashboard/KpiCard';
import { LEDGER_LEAF_BY_KIND, LedgerListProps, accountingLedgerPath } from '../config/ledgerPaths';
import { faqHint, withFaqTitles } from '../faq/FaqHint';
import { usePaymentGatewayList } from '../hooks/usePaymentGatewayLedger';
import { PaymentGatewayKpis, PaymentGatewayRow } from '../types/paymentGatewayLedger';
import { PillMeta, formatInr } from '../utils/commission';

const PAGE_SIZE = 10;

export const gatewayStatusPill = (gateway: PaymentGatewayRow): PillMeta =>
    gateway.outstanding > 0
        ? { label: 'Settlement pending', tone: 'warning' }
        : { label: 'Reconciled', tone: 'success' };

type KpiDefinition = {
    key: keyof PaymentGatewayKpis;
    title: string;
    icon: ReactNode;
    kind: 'count' | 'amount';
    tone?: 'danger' | 'warning';
};

export const KPI_CARDS: KpiDefinition[] = [
    { key: 'totalGateways', title: 'Gateways', icon: <SwapOutlined />, kind: 'count' },
    {
        key: 'outstandingTotal',
        title: 'Yet To Receive',
        icon: <ClockCircleOutlined />,
        kind: 'amount',
    },
    {
        key: 'awaitingSettlement',
        title: 'Awaiting Settlement',
        icon: <WarningOutlined />,
        kind: 'count',
        tone: 'warning',
    },
    {
        key: 'collectedThisMonth',
        title: 'Collected This Month',
        icon: <PlusCircleOutlined />,
        kind: 'amount',
    },
    {
        key: 'receivedThisMonth',
        title: 'Received This Month',
        icon: <MinusCircleOutlined />,
        kind: 'amount',
    },
];

export const gatewayListColumns: ColumnsType<PaymentGatewayRow> = [
    {
        title: 'Gateway',
        key: 'gatewayName',
        width: 240,
        render: (_, row) => (
            <Flex vertical>
                <Typography.Text className="font-medium">{row.gatewayName}</Typography.Text>
                <Typography.Text className="text-xs text-navTextColor">
                    {row.gatewayAccountId}
                </Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Collected',
        key: 'collected',
        width: 160,
        render: (_, row) => formatInr(row.collected),
    },
    { title: 'Received', key: 'received', width: 150, render: (_, row) => formatInr(row.received) },
    { title: 'Charges', key: 'fees', width: 150, render: (_, row) => formatInr(row.fees) },
    {
        title: 'Yet To Receive',
        key: 'outstanding',
        width: 170,
        render: (_, row) => (
            <span className={row.outstanding < 0 ? 'text-red-600' : undefined}>
                {formatInr(row.outstanding)}
            </span>
        ),
    },
    {
        title: 'Status',
        key: 'status',
        width: 160,
        render: (_, row) => <StatusPill {...gatewayStatusPill(row)} />,
    },
    { title: '', key: 'chevron', width: 60, render: () => <RightOutlined /> },
];

export const formatKpi = (card: KpiDefinition, value: number) =>
    card.kind === 'amount' ? formatInr(value) : formatNumberWithLocalString(value, 0, 0);

const PaymentGatewayLedgerList = ({ openTab, intro }: LedgerListProps) => {
    const navigate = useNavigate();
    const leaf = LEDGER_LEAF_BY_KIND.payment_gateways;
    const [filters, setFilters] = useState({ page: 1, itemsPerPage: PAGE_SIZE, searchText: '' });
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { gateways, kpis, count, generatedAt, isLoading, isRefreshing, refresh } =
        usePaymentGatewayList(filters);

    const cards = useMemo(
        () =>
            KPI_CARDS.map(card => ({
                key: card.key,
                title: card.title,
                icon: card.icon,
                tone: card.tone,
                value: formatKpi(card, kpis ? Number(kpis[card.key]) || 0 : 0),
            })),
        [kpis]
    );

    // A gateway is its chart-of-accounts row, so one only appears once the journal has
    // actually posted to it. An empty list means no gateway account has been set up.
    const emptyText = filters.searchText
        ? 'No gateways match your search.'
        : 'No payment gateway has been posted to yet.';

    return (
        <Flex vertical gap={16}>
            <Row gutter={[20, 20]}>
                {cards.map(card => (
                    <Col key={card.key} xs={24} sm={12} xl={6}>
                        <KpiCard
                            title={card.title}
                            value={card.value}
                            icon={card.icon}
                            tone={card.tone}
                            help={faqHint('Payment Gateways', 'KPIs', card.title)}
                        />
                    </Col>
                ))}
            </Row>
            <div className="border-t border-solid border-borderCard" />
            <Flex justify="space-between" align="center" gap={16} wrap="wrap">
                <Typography.Text className="text-[13px] text-textBody max-w-[640px]">
                    {intro ?? leaf.intro}
                </Typography.Text>
                <Flex align="center" gap={12} wrap="wrap">
                    {generatedAt && (
                        <Typography.Text className="text-[13px] text-textBody">
                            Updated {dayjs(generatedAt).format('DD MMM YYYY, HH:mm')}
                        </Typography.Text>
                    )}
                    <Button icon={<ReloadOutlined />} loading={isRefreshing} onClick={refresh}>
                        Refresh
                    </Button>
                    <Input
                        allowClear
                        prefix={<SearchOutlined className="text-navTextColor" />}
                        placeholder="Search gateways"
                        value={searchText}
                        onChange={updateSearchText}
                        className="w-full sm:w-72"
                    />
                </Flex>
            </Flex>
            <GenericTable
                rowKey={(record: PaymentGatewayRow) => record.gatewayAccountId}
                columns={withFaqTitles(gatewayListColumns, 'Payment Gateways', 'List')}
                dataSource={gateways}
                loading={isLoading}
                pagination={false}
                locale={{ emptyText }}
                rowClassName="cursor-pointer"
                onRow={(record: PaymentGatewayRow) => ({
                    onClick: () =>
                        navigate(
                            accountingLedgerPath(
                                'payment_gateways',
                                record.gatewayAccountId,
                                openTab
                            )
                        ),
                })}
            />
            <Pagination
                current={filters.page}
                pageSize={PAGE_SIZE}
                total={count}
                onChange={page => setFilters(prev => ({ ...prev, page }))}
                showSizeChanger={false}
                hideOnSinglePage
                className="text-end justify-end"
            />
        </Flex>
    );
};

export default PaymentGatewayLedgerList;
