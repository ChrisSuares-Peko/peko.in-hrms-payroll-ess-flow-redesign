import { ReactNode, useEffect, useMemo, useState } from 'react';

import { CloseCircleOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Avatar, Button, Input, Select, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/lib/table';

import GenericTable from '@components/atomic/GenericTable';
import useDebounce from '@src/hooks/useDebounce';

import AuditTrailModal from './AuditTrailModal';
import BulkCardActionModal, { BulkCardMode } from './BulkCardActionModal';
import IssueCardDrawer from './IssueCardDrawer';
import ManageCardModal from './ManageCardModal';
import PhysicalCardTrackingSection from './PhysicalCardTrackingSection';
import RequestPhysicalCardModal from './RequestPhysicalCardModal';
import actionIcon from '../../assets/icons/action.svg';
import freezeIcon from '../../assets/icons/freeze.svg';
import rotateIcon from '../../assets/icons/rotate.svg';
import { useAdminCardsApi } from '../../hooks/admin/useAdminCardsApi';
import { useCardholderOptions } from '../../hooks/admin/useCardholderOptions';
import { useWalletApi } from '../../hooks/admin/useWalletApi';
import { useCardQuotaApi } from '../../hooks/user/useCardQuotaApi';
import { CARD_QUOTA_COPY, cardQuotaSummary } from '../../utils/cardQuotaData';
import { CARD_STATUS_OPTIONS, freezeReasonSummary } from '../../utils/cardsData';
import { displayCardStatus, formatRupeesDecimal, stripEmojis } from '../../utils/helpers';
import { CardRecord, CardStatus, TabItem } from '../../utils/types';
import CardThumb from '../common/CardThumb';
import PageTabs from '../common/PageTabs';
import StatusTag from '../common/StatusTag';

const { Title, Text } = Typography;

const TYPE_TABS: TabItem[] = [
    { key: 'all', label: 'All cards' },
    { key: 'virtual', label: 'Virtual' },
    { key: 'physical', label: 'Physical' },
];

const FilterField = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex w-full flex-col gap-1.5 sm:w-auto">
        <span className="text-sm text-textBody">{label}</span>
        {children}
    </div>
);

const buildColumns = (
    onRequestPhysical: (row: CardRecord) => void,
    onManage: (row: CardRecord) => void,
    onAudit: (row: CardRecord) => void
): ColumnsType<CardRecord> => [
    {
        key: 'card',
        title: 'Card',
        dataIndex: 'last4',
        width: 100,
        render: (last4: string, row: CardRecord) => (
            <div className="flex min-w-0 items-center gap-3">
                <CardThumb />
                <div className="flex min-w-0 flex-col">
                    <Text className="whitespace-nowrap text-sm text-textHeadings">
                        **** **** **** {last4}
                    </Text>
                    {row.last4 && (
                        <Tooltip title={row?.nameOnCard ?? row.holder}>
                            <Text className="block truncate text-xs text-textGreyLight">
                                {row?.nameOnCard ?? row.holder}
                            </Text>
                        </Tooltip>
                    )}
                </div>
            </div>
        ),
    },
    {
        key: 'holder',
        title: 'Cardholder',
        dataIndex: 'holder',
        width: 200,
        ellipsis: true,
        render: (_: string, row: CardRecord) => (
            <div className="flex min-w-0 items-center gap-0 sm:gap-2.5">
                <span className="hidden shrink-0 sm:block">
                    <Avatar
                        size={36}
                        className="bg-bgLightPink font-semibold text-textLightRed"
                        style={{ fontSize: 13 }}
                    >
                        {row.avatarText}
                    </Avatar>
                </span>
                <div className="flex min-w-0 flex-col">
                    <Tooltip title={row.holder}>
                        <Text className="block truncate text-sm font-medium text-textHeadings">
                            {row.holder}
                        </Text>
                    </Tooltip>
                    <Text className="block truncate text-xs text-textGreyLight">
                        {row.department}
                    </Text>
                </div>
            </div>
        ),
    },
    { key: 'type', title: 'Type', dataIndex: 'type', width: 110 },
    {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        width: 190,
        render: (status: CardStatus, row: CardRecord) => {
            const tag = <StatusTag status={displayCardStatus(status, row.terminationStatus)} />;
            const frozenReason = status === 'Frozen' ? freezeReasonSummary(row) : null;
            return frozenReason ? (
                <Tooltip title={frozenReason}>
                    <span className="cursor-help">{tag}</span>
                </Tooltip>
            ) : (
                tag
            );
        },
    },
    {
        key: 'cardLimit',
        title: 'Card limit',
        dataIndex: 'cardLimit',
        width: 130,
        render: (value: number) => formatRupeesDecimal(value),
    },
    {
        key: 'perTxnLimit',
        title: 'Per-txn limit',
        dataIndex: 'perTxnLimit',
        width: 130,
        render: (value: number | null) => (value !== null ? formatRupeesDecimal(value) : '—'),
    },
    {
        key: 'spent',
        title: 'Spent',
        dataIndex: 'spent',
        width: 120,
        render: (value: number) => formatRupeesDecimal(value),
    },
    {
        key: 'remaining',
        title: 'Remaining',
        dataIndex: 'remaining',
        width: 130,
        render: (value: number) => formatRupeesDecimal(value),
    },
    {
        key: 'actions',
        title: 'Actions',
        dataIndex: 'key',
        align: 'center',
        width: 120,
        render: (_: unknown, row: CardRecord) => (
            <div className="flex flex-nowrap items-center justify-center gap-1 [&_.ant-btn]:shrink-0">
                {row.status !== 'Failed' && (
                    <Tooltip title="Manage card">
                        <Button
                            type="text"
                            size="small"
                            aria-label="Manage card"
                            icon={<img src={actionIcon} alt="" className="h-4 w-4" />}
                            onClick={() => onManage(row)}
                        />
                    </Tooltip>
                )}
                <Tooltip title="Audit trail">
                    <Button
                        type="text"
                        size="small"
                        aria-label="Audit trail"
                        icon={<img src={rotateIcon} alt="" className="h-4 w-4" />}
                        onClick={() => onAudit(row)}
                    />
                </Tooltip>
            </div>
        ),
    },
];

const PAGE_SIZE = 10;

/** Admin "Cards" tab: header + bulk actions, filters, type sub-tabs and the cards table. */
const CardsSection = () => {
    const [page, setPage] = useState(1);
    const [typeTab, setTypeTab] = useState('all');
    const [cardholder, setCardholder] = useState<string>();
    const [status, setStatus] = useState<CardStatus | ''>('');
    const [search, setSearch] = useState('');
    const [bulkMode, setBulkMode] = useState<BulkCardMode | null>(null);
    const [issueOpen, setIssueOpen] = useState(false);
    const [requestCard, setRequestCard] = useState<CardRecord | null>(null);
    const [manageCard, setManageCard] = useState<CardRecord | null>(null);
    const [auditCard, setAuditCard] = useState<CardRecord | null>(null);

    const debouncedSearch = useDebounce(search, 500);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);
    useEffect(() => {
        setPage(1);
    }, [status]);
    useEffect(() => {
        setPage(1);
    }, [cardholder]);

    const cardType = typeTab === 'all' ? undefined : typeTab;
    const { cards, total, isLoading, refetch } = useAdminCardsApi(
        page,
        PAGE_SIZE,
        cardType,
        debouncedSearch || undefined,
        status || undefined,
        cardholder || undefined
    );
    const { wallet, refetch: refetchWallet } = useWalletApi();
    const { quota, refetchQuota } = useCardQuotaApi();
    const refetchAll = () => {
        refetch();
        refetchWallet();
        refetchQuota();
    };

    const columns = useMemo(() => buildColumns(setRequestCard, setManageCard, setAuditCard), []);

    const holderOptions = useCardholderOptions();

    const clearFilters = () => {
        setTypeTab('all');
        setCardholder(undefined);
        setStatus('');
        setSearch('');
        setPage(1);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex flex-col gap-1">
                    <Title level={3} className="!mb-0 !text-textHeadings">
                        Cards
                    </Title>
                    <Text className="max-w-2xl text-sm text-textBody">
                        {wallet?.cardCount ?? 0} cards issued · Card limits are independent of
                        wallet balance (currently {formatRupeesDecimal(wallet?.balance ?? 0)}).
                        Spend draws from the wallet first-come-first-served.
                    </Text>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button
                        danger
                        icon={<img src={freezeIcon} alt="" className="h-4 w-4" />}
                        className="font-medium"
                        onClick={() => setBulkMode('freeze')}
                    >
                        Bulk freeze
                    </Button>
                    <Button
                        danger
                        icon={<img src={freezeIcon} alt="" className="h-4 w-4" />}
                        className="font-medium"
                        onClick={() => setBulkMode('unfreeze')}
                    >
                        Bulk unfreeze
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        className="font-medium"
                        onClick={() => setIssueOpen(true)}
                    >
                        Issue card
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl border border-borderCard bg-[#F8FAFC] px-5 py-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <Text className="text-xs text-textGreyLight">
                            Card Limit – Shared Across All Cards
                        </Text>
                        <Text className="text-xl font-semibold text-textHeadings">
                            {formatRupeesDecimal(wallet?.totalCardLimits ?? 0)}
                        </Text>
                        <Text className="text-xs text-textGreyLight">
                            {wallet?.cardCount ?? 0} cards · informational only, not reserved
                        </Text>
                    </div>
                    {quota && quota.included > 0 && (
                        <div className="flex flex-col gap-1 sm:items-end">
                            <Text className="text-xs text-textGreyLight">
                                {CARD_QUOTA_COPY.label}
                            </Text>
                            <Text className="text-xl font-semibold text-textHeadings">
                                {cardQuotaSummary(quota)}
                            </Text>
                            <Text className="text-xs text-textGreyLight">
                                {quota.included} included in your plan
                                {quota.purchased > 0 ? ` · ${quota.purchased} purchased` : ''}
                            </Text>
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-2xl border border-borderCard bg-white p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex flex-wrap gap-4">
                        <FilterField label="Cardholder">
                            <Select
                                allowClear
                                placeholder="Select Cardholder"
                                value={cardholder}
                                onChange={setCardholder}
                                options={holderOptions}
                                className="w-full sm:w-52"
                            />
                        </FilterField>
                        <FilterField label="Status">
                            <Select
                                allowClear
                                placeholder="Select Status"
                                value={status}
                                onChange={setStatus}
                                options={CARD_STATUS_OPTIONS}
                                className="w-full sm:w-52"
                            />
                        </FilterField>
                        <FilterField label="Search">
                            <Input
                                allowClear
                                prefix={<SearchOutlined className="text-textGreyLight" />}
                                placeholder="Search for cards"
                                value={search}
                                onChange={event => setSearch(stripEmojis(event.target.value))}
                                className="w-full sm:w-72"
                            />
                        </FilterField>
                    </div>
                    <Button
                        type="text"
                        icon={<CloseCircleOutlined />}
                        onClick={clearFilters}
                        className="self-end text-textBody"
                    >
                        Clear
                    </Button>
                </div>
            </div>

            <PageTabs
                tabs={TYPE_TABS}
                activeKey={typeTab}
                onChange={key => {
                    setTypeTab(key);
                    setPage(1);
                }}
            />

            <GenericTable
                columns={columns}
                dataSource={cards}
                rowKey="key"
                rowExpandable
                loading={isLoading}
                scroll={{ x: 'max-content' }}
                pagination={{
                    current: page,
                    pageSize: PAGE_SIZE,
                    total,
                    onChange: p => setPage(p),
                    showSizeChanger: false,
                }}
            />

            <PhysicalCardTrackingSection />

            <BulkCardActionModal
                open={bulkMode !== null}
                mode={bulkMode ?? 'freeze'}
                onClose={() => setBulkMode(null)}
                onSuccess={refetchAll}
            />

            <IssueCardDrawer
                open={issueOpen}
                onClose={() => setIssueOpen(false)}
                onSuccess={refetchAll}
            />

            <ManageCardModal
                card={manageCard}
                onClose={() => setManageCard(null)}
                onRequestPhysical={() => setRequestCard(manageCard as CardRecord)}
                onSuccess={refetchAll}
            />

            <RequestPhysicalCardModal
                open={requestCard !== null}
                onClose={() => setRequestCard(null)}
                holderName={(requestCard?.nameOnCard || requestCard?.holder) ?? ''}
                cardIssuanceId={requestCard?.key ?? ''}
                last4={requestCard?.last4 ?? ''}
                maskedCardNumber={requestCard?.maskedCardNumber}
                cardLimit={requestCard?.cardLimit ?? 0}
                cardType={requestCard?.type?.toLowerCase()}
            />

            <AuditTrailModal
                open={auditCard !== null}
                onClose={() => setAuditCard(null)}
                last4={auditCard?.last4 ?? ''}
                cardIssuanceId={auditCard?.key}
            />
        </div>
    );
};

export default CardsSection;
