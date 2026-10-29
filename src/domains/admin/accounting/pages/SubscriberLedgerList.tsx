import { ReactNode, useMemo, useState } from 'react';

import {
    BankOutlined,
    CheckCircleOutlined,
    GiftOutlined,
    PercentageOutlined,
    ReloadOutlined,
    RightOutlined,
    SearchOutlined,
    ShoppingOutlined,
    TeamOutlined,
    WalletOutlined,
} from '@ant-design/icons';
import { Button, Col, Flex, Input, Pagination, Row, Select, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { subscriberStatusPill } from './SubscriberLedgerDetail';
import StatusPill from '../components/common/StatusPill';
import KpiCard from '../components/dashboard/KpiCard';
import {
    PEKO_DEFAULT_PARTNER,
    partnerLabel,
    subscriberDisplayName,
} from '../components/ledgers/subscriberColumns';
import { LEDGER_LEAF_BY_KIND, LedgerListProps, accountingLedgerPath } from '../config/ledgerPaths';
import { faqHint, withFaqTitles } from '../faq/FaqHint';
import { useSubscriberLedgerList } from '../hooks/useSubscriberLedger';
import { SubscriberLedgerKpis, SubscriberLedgerRow } from '../types/subscriberLedger';
import { formatInr } from '../utils/commission';

const PAGE_SIZE = 10;

type KpiDefinition = {
    key: keyof SubscriberLedgerKpis;
    title: string;
    icon: ReactNode;
    kind: 'count' | 'amount';
};

export const KPI_CARDS: KpiDefinition[] = [
    { key: 'totalSubscribers', title: 'Total Subscribers', icon: <TeamOutlined />, kind: 'count' },
    {
        key: 'walletBalancesHeld',
        title: 'Cashback and Rewards',
        icon: <WalletOutlined />,
        kind: 'amount',
    },
    {
        key: 'subscribersWithBalance',
        title: 'Subscribers With Balance',
        icon: <CheckCircleOutlined />,
        kind: 'count',
    },
    {
        key: 'gmvThisMonth',
        title: 'GMV This Month',
        icon: <BankOutlined />,
        kind: 'amount',
    },
    {
        key: 'spentThisMonth',
        title: 'Cashbacks Spent This Month',
        icon: <ShoppingOutlined />,
        kind: 'amount',
    },
    {
        key: 'platformFeeThisMonth',
        title: 'Platform Fee This Month',
        icon: <PercentageOutlined />,
        kind: 'amount',
    },
    {
        key: 'cashbackThisMonth',
        title: 'Cashbacks Provided This Month',
        icon: <GiftOutlined />,
        kind: 'amount',
    },
];

export const subscriberListColumns: ColumnsType<SubscriberLedgerRow> = [
    {
        title: 'Subscriber',
        key: 'name',
        width: 260,
        render: (_, row) => {
            const displayName = subscriberDisplayName(row);
            return (
                <Flex vertical>
                    <Typography.Text className="font-medium text-textHeadings">
                        {displayName}
                    </Typography.Text>
                    {row.username && row.username !== displayName && (
                        <Typography.Text className="text-xs text-navTextColor">
                            {row.username}
                        </Typography.Text>
                    )}
                </Flex>
            );
        },
    },
    {
        title: 'Partner',
        key: 'partnerName',
        width: 170,
        render: (_, row) => partnerLabel(row.partnerName),
    },
    { title: 'Plan', key: 'planName', width: 150, render: (_, row) => row.planName || '—' },
    {
        title: 'Wallet Balance',
        key: 'walletBalance',
        width: 170,
        render: (_, row) => (
            <Typography.Text className={row.walletBalance < 0 ? 'text-red-600' : undefined}>
                {formatInr(row.walletBalance)}
            </Typography.Text>
        ),
    },
    {
        title: 'Status',
        key: 'status',
        width: 160,
        render: (_, row) => <StatusPill {...subscriberStatusPill(row)} />,
    },
    {
        title: '',
        key: 'chevron',
        width: 48,
        render: () => <RightOutlined className="text-navTextColor" />,
    },
];

const formatKpi = (kind: KpiDefinition['kind'], value: number) =>
    kind === 'amount' ? formatInr(value) : formatNumberWithLocalString(value, 0, 0);

const SubscriberLedgerList = ({ openTab, intro }: LedgerListProps) => {
    const navigate = useNavigate();
    const leaf = LEDGER_LEAF_BY_KIND.subscribers;
    const [filters, setFilters] = useState<{
        page: number;
        itemsPerPage: number;
        searchText: string;
        partnerId?: string;
    }>({ page: 1, itemsPerPage: PAGE_SIZE, searchText: '' });
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { partnerData } = usePartnersForCorporate('');
    const { subscribers, kpis, count, generatedAt, isLoading, isRefreshing, refresh } =
        useSubscriberLedgerList(filters);

    // The shared hook calls Peko's own subscribers 'Default'; the Partner column calls them this.
    const partnerOptions = useMemo(
        () =>
            (partnerData || []).map(option => ({
                value: String(option.value),
                label: option.value === 'default' ? PEKO_DEFAULT_PARTNER : option.label,
            })),
        [partnerData]
    );

    const cards = useMemo(
        () =>
            kpis
                ? KPI_CARDS.map(card => ({
                      ...card,
                      value: formatKpi(card.kind, Number(kpis[card.key]) || 0),
                  }))
                : [],
        [kpis]
    );

    const emptyText =
        filters.searchText || filters.partnerId
            ? 'No subscribers match your search.'
            : 'No subscribers yet.';

    return (
        <Flex vertical gap={16}>
            <Row gutter={[20, 20]}>
                {cards.map(card => (
                    <Col key={card.key} xs={24} sm={12} xl={6}>
                        <KpiCard
                            title={card.title}
                            value={card.value}
                            icon={card.icon}
                            help={faqHint('Subscribers', 'KPIs', card.title)}
                        />
                    </Col>
                ))}
            </Row>
            <div className="border-t border-solid border-borderCard" />
            <Flex justify="space-between" align="center" gap={16} wrap="wrap">
                <Typography.Text className="flex-1 min-w-[240px] max-w-[640px] text-[13px] text-textBody">
                    {intro ?? leaf.intro}
                </Typography.Text>
                <Flex align="center" gap={12} className="flex-wrap lg:flex-nowrap lg:shrink-0">
                    {generatedAt && (
                        <Typography.Text className="text-[13px] text-textBody">
                            Updated {dayjs(generatedAt).format('DD MMM YYYY, HH:mm')}
                        </Typography.Text>
                    )}
                    <Button icon={<ReloadOutlined />} loading={isRefreshing} onClick={refresh}>
                        Refresh
                    </Button>
                    <Select
                        allowClear
                        aria-label="Partner"
                        placeholder="All partners"
                        value={filters.partnerId}
                        options={partnerOptions}
                        onChange={value =>
                            setFilters(prev => ({
                                ...prev,
                                partnerId: value || undefined,
                                page: 1,
                            }))
                        }
                        className="w-full sm:w-48"
                    />
                    <Input
                        allowClear
                        prefix={<SearchOutlined className="text-navTextColor" />}
                        placeholder="Search subscribers"
                        value={searchText}
                        onChange={updateSearchText}
                        className="w-full sm:w-72"
                    />
                </Flex>
            </Flex>
            <GenericTable
                rowKey={(record: SubscriberLedgerRow) => record.credentialId}
                columns={withFaqTitles(subscriberListColumns, 'Subscribers', 'List')}
                dataSource={subscribers}
                loading={isLoading}
                pagination={false}
                locale={{ emptyText }}
                rowClassName="cursor-pointer"
                onRow={(record: SubscriberLedgerRow) => ({
                    onClick: () =>
                        navigate(
                            accountingLedgerPath(
                                'subscribers',
                                String(record.credentialId),
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

export default SubscriberLedgerList;
