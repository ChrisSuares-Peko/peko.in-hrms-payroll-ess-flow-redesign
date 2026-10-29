import { ReactNode, useMemo, useState } from 'react';

import {
    ClockCircleOutlined,
    GlobalOutlined,
    MinusCircleOutlined,
    PlusCircleOutlined,
    ReloadOutlined,
    RightOutlined,
    SearchOutlined,
    ShopOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { Alert, Button, Col, Flex, Input, Pagination, Row, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Link, useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import StatusPill from '../components/common/StatusPill';
import KpiCard from '../components/dashboard/KpiCard';
import { LEDGER_LEAF_BY_KIND, LedgerListProps, accountingLedgerPath } from '../config/ledgerPaths';
import { accountingLeafPath } from '../config/servicePaths';
import { faqHint, withFaqTitles } from '../faq/FaqHint';
import { usePartnerLedgerList } from '../hooks/usePartnerLedger';
import { PartnerLedgerKpis, PartnerLedgerRow } from '../types/partnerLedger';
import { PillMeta, formatInr } from '../utils/commission';

const PAGE_SIZE = 10;

export const MISSING_ACCOUNT_MESSAGE =
    'The shared "Partnership Fee Payable" account is not set up in the chart of accounts, so what partners have earned cannot be read from the journals yet.';

export const partnerStatusPill = (partner: PartnerLedgerRow): PillMeta => {
    if (!partner.isActive) return { label: 'Inactive', tone: 'neutral' };
    if (partner.sharePercentage === null) return { label: 'No share set', tone: 'warning' };
    return partner.owed > 0
        ? { label: 'Payout due', tone: 'warning' }
        : { label: 'Settled', tone: 'success' };
};

type KpiDefinition = {
    key: keyof PartnerLedgerKpis;
    title: string;
    icon: ReactNode;
    kind: 'count' | 'amount';
    tone?: 'danger' | 'warning';
};

export const KPI_CARDS: KpiDefinition[] = [
    { key: 'totalPartners', title: 'Total Partners', icon: <GlobalOutlined />, kind: 'count' },
    { key: 'owedTotal', title: 'Owed To Partners', icon: <ClockCircleOutlined />, kind: 'amount' },
    {
        key: 'awaitingPayout',
        title: 'Awaiting Payout',
        icon: <WarningOutlined />,
        kind: 'count',
        tone: 'warning',
    },
    {
        key: 'partnersWithoutShare',
        title: 'No Share Configured',
        icon: <WarningOutlined />,
        kind: 'count',
        tone: 'warning',
    },
    {
        key: 'earnedThisMonth',
        title: 'Earned This Month',
        icon: <PlusCircleOutlined />,
        kind: 'amount',
    },
    {
        key: 'paidThisMonth',
        title: 'Paid This Month',
        icon: <MinusCircleOutlined />,
        kind: 'amount',
    },
    {
        key: 'gmvThisMonth',
        title: 'GMV This Month',
        icon: <ShopOutlined />,
        kind: 'amount',
    },
];

export const partnerListColumns: ColumnsType<PartnerLedgerRow> = [
    {
        title: 'Partner',
        key: 'partnerName',
        width: 240,
        render: (_, row) => (
            <Flex vertical>
                <Typography.Text className="font-medium">{row.partnerName}</Typography.Text>
                <Typography.Text className="text-xs text-navTextColor">
                    {row.portalUrl || row.branding || 'No portal linked'}
                </Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Share %',
        key: 'sharePercentage',
        width: 120,
        render: (_, row) =>
            row.sharePercentage === null ? (
                <Typography.Text className="text-amber-600">Not set</Typography.Text>
            ) : (
                `${formatNumberWithLocalString(row.sharePercentage)} %`
            ),
    },
    { title: 'Earned', key: 'earned', width: 150, render: (_, row) => formatInr(row.earned) },
    { title: 'Paid', key: 'paid', width: 150, render: (_, row) => formatInr(row.paid) },
    {
        title: 'Debit Notes',
        key: 'debitNotes',
        width: 150,
        render: (_, row) => formatInr(row.debitNotes),
    },
    {
        title: 'Left To Pay',
        key: 'owed',
        width: 160,
        render: (_, row) => (
            <span className={row.owed < 0 ? 'text-red-600' : undefined}>{formatInr(row.owed)}</span>
        ),
    },
    {
        title: 'Status',
        key: 'status',
        width: 140,
        render: (_, row) => <StatusPill {...partnerStatusPill(row)} />,
    },
    { title: '', key: 'chevron', width: 60, render: () => <RightOutlined /> },
];

export const formatKpi = (card: KpiDefinition, value: number) =>
    card.kind === 'amount' ? formatInr(value) : formatNumberWithLocalString(value, 0, 0);

const PartnerLedgerList = ({ openTab, intro }: LedgerListProps) => {
    const navigate = useNavigate();
    const leaf = LEDGER_LEAF_BY_KIND.partners;
    const [filters, setFilters] = useState({ page: 1, itemsPerPage: PAGE_SIZE, searchText: '' });
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const {
        partners,
        kpis,
        count,
        generatedAt,
        accountConfigured,
        isLoading,
        isRefreshing,
        refresh,
    } = usePartnerLedgerList(filters);

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

    const emptyText = filters.searchText ? 'No partners match your search.' : 'No partners yet.';

    return (
        <Flex vertical gap={16}>
            {!accountConfigured && (
                <Alert
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
            <Row gutter={[20, 20]}>
                {cards.map(card => (
                    <Col key={card.key} xs={24} sm={12} xl={6}>
                        <KpiCard
                            title={card.title}
                            value={card.value}
                            icon={card.icon}
                            tone={card.tone}
                            help={faqHint('Partners', 'KPIs', card.title)}
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
                        placeholder="Search partners"
                        value={searchText}
                        onChange={updateSearchText}
                        className="w-full sm:w-72"
                    />
                </Flex>
            </Flex>
            <GenericTable
                rowKey={(record: PartnerLedgerRow) => record.credentialId}
                columns={withFaqTitles(partnerListColumns, 'Partners', 'List')}
                dataSource={partners}
                loading={isLoading}
                pagination={false}
                locale={{ emptyText }}
                rowClassName="cursor-pointer"
                onRow={(record: PartnerLedgerRow) => ({
                    onClick: () =>
                        navigate(
                            accountingLedgerPath('partners', String(record.credentialId), openTab)
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

export default PartnerLedgerList;
