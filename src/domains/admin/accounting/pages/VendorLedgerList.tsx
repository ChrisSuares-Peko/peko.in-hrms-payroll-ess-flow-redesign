import { ReactNode, useMemo, useState } from 'react';

import {
    BankOutlined,
    FileTextOutlined,
    MinusCircleOutlined,
    PercentageOutlined,
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

import { MISSING_ACCOUNT_MESSAGE, vendorStatusPill } from './VendorLedgerDetail';
import StatusPill from '../components/common/StatusPill';
import KpiCard from '../components/dashboard/KpiCard';
import { LEDGER_LEAF_BY_KIND, LedgerListProps, accountingLedgerPath } from '../config/ledgerPaths';
import { accountingLeafPath } from '../config/servicePaths';
import { faqHint, withFaqTitles } from '../faq/FaqHint';
import { useVendorLedgerList } from '../hooks/useVendorLedger';
import { VendorLedgerKpis, VendorLedgerRow } from '../types/vendorLedger';
import { formatInr } from '../utils/commission';

const PAGE_SIZE = 10;
const INITIAL_SERVICE_COUNT = 3;
const SERVICE_EXPANSION_COUNT = 15;

type KpiDefinition = {
    key: keyof VendorLedgerKpis;
    title: string;
    icon: ReactNode;
    kind: 'count' | 'amount';
    tone?: 'danger' | 'warning';
};

export const KPI_CARDS: KpiDefinition[] = [
    { key: 'totalVendors', title: 'Total Vendors', icon: <ShopOutlined />, kind: 'count' },
    { key: 'depositsHeld', title: 'Deposits Held', icon: <BankOutlined />, kind: 'amount' },
    {
        key: 'lowBalanceVendors',
        title: 'Low Balance Vendors',
        icon: <WarningOutlined />,
        kind: 'count',
        tone: 'warning',
    },
    {
        key: 'openCreditNotes',
        title: 'Open Credit Notes',
        icon: <FileTextOutlined />,
        kind: 'count',
    },
    {
        key: 'depositedThisMonth',
        title: 'Deposited This Month',
        icon: <PlusCircleOutlined />,
        kind: 'amount',
    },
    {
        key: 'usedThisMonth',
        title: 'Used This Month',
        icon: <MinusCircleOutlined />,
        kind: 'amount',
    },
    {
        key: 'commissionThisMonth',
        title: 'Commission This Month',
        icon: <PercentageOutlined />,
        kind: 'amount',
    },
];

const VendorServices = ({ services }: { services: string[] }) => {
    const [visibleCount, setVisibleCount] = useState(INITIAL_SERVICE_COUNT);

    if (!services.length) {
        return <Typography.Text className="text-xs text-navTextColor">No services</Typography.Text>;
    }

    const isExpanded = visibleCount > INITIAL_SERVICE_COUNT;
    const hasMore = visibleCount < services.length;
    const visibleServices = services.slice(0, visibleCount).join(' · ');
    const toggleVisibleCount = (event: React.MouseEvent, nextCount: number) => {
        event.stopPropagation();
        setVisibleCount(nextCount);
    };

    if (isExpanded) {
        return (
            <div>
                <Typography.Text className="block whitespace-normal text-xs text-navTextColor">
                    {visibleServices}
                </Typography.Text>
                <Button
                    type="link"
                    size="small"
                    className="h-auto px-0 text-xs"
                    onClick={event =>
                        toggleVisibleCount(
                            event,
                            hasMore
                                ? Math.min(visibleCount + SERVICE_EXPANSION_COUNT, services.length)
                                : INITIAL_SERVICE_COUNT
                        )
                    }
                >
                    {hasMore ? 'Show more' : 'Show less'}
                </Button>
            </div>
        );
    }

    return (
        <div className="min-w-0">
            <Typography.Text className="block min-w-0 truncate text-xs text-navTextColor">
                {visibleServices}
                {hasMore ? ' · …' : ''}
            </Typography.Text>
            {hasMore && (
                <Button
                    type="link"
                    size="small"
                    className="h-auto px-0 text-xs"
                    onClick={event => toggleVisibleCount(event, SERVICE_EXPANSION_COUNT)}
                >
                    Show more
                </Button>
            )}
        </div>
    );
};

export const vendorListColumns: ColumnsType<VendorLedgerRow> = [
    {
        title: 'Vendor',
        key: 'vendorName',
        width: 240,
        render: (_, row) => (
            <Flex vertical>
                <Typography.Text className="font-medium text-textHeadings">
                    {row.vendorName}
                </Typography.Text>
                <VendorServices services={row.services} />
            </Flex>
        ),
    },
    { title: 'Type', key: 'type', width: 130, render: (_, row) => row.type || '—' },
    {
        title: 'Deposited',
        key: 'deposited',
        width: 150,
        render: (_, row) => formatInr(row.deposited),
    },
    { title: 'Used', key: 'used', width: 150, render: (_, row) => formatInr(row.used) },
    {
        title: 'Available Balance',
        key: 'available',
        width: 170,
        render: (_, row) => (
            <Typography.Text className={row.available < 0 ? 'text-red-600' : undefined}>
                {formatInr(row.available)}
            </Typography.Text>
        ),
    },
    {
        title: 'Status',
        key: 'status',
        width: 170,
        render: (_, row) => <StatusPill {...vendorStatusPill(row)} />,
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

const VendorLedgerList = ({ openTab, intro }: LedgerListProps) => {
    const navigate = useNavigate();
    const leaf = LEDGER_LEAF_BY_KIND.vendors;
    const [filters, setFilters] = useState({ page: 1, itemsPerPage: PAGE_SIZE, searchText: '' });
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const {
        vendors,
        kpis,
        count,
        generatedAt,
        accountConfigured,
        isLoading,
        isRefreshing,
        refresh,
    } = useVendorLedgerList(filters);

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

    const emptyText = filters.searchText ? 'No vendors match your search.' : 'No vendors yet.';

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
                            help={faqHint('Vendors', 'KPIs', card.title)}
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
                        placeholder="Search vendors"
                        value={searchText}
                        onChange={updateSearchText}
                        className="w-full sm:w-72"
                    />
                </Flex>
            </Flex>
            <GenericTable
                tableLayout="fixed"
                rowKey={(record: VendorLedgerRow) => record.id}
                columns={withFaqTitles(vendorListColumns, 'Vendors', 'List')}
                dataSource={vendors}
                loading={isLoading}
                pagination={false}
                locale={{ emptyText }}
                rowClassName="cursor-pointer"
                onRow={(record: VendorLedgerRow) => ({
                    onClick: () =>
                        navigate(accountingLedgerPath('vendors', String(record.id), openTab)),
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

export default VendorLedgerList;
