import { useEffect, useMemo, useState } from 'react';

import { CloseCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Empty, Input, Tabs, Typography } from 'antd';
import type { TabsProps } from 'antd/lib';
import type { ColumnsType } from 'antd/lib/table';
import dayjs, { Dayjs } from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';

import { MyRequestItem } from '../../api/user/cardsApi';
import { useMyRequestsApi } from '../../hooks/user/useMyRequestsApi';
import { consumePendingSubTab } from '../../utils/corporateCardsNav';
import { formatRupeesDecimal, stripEmojis } from '../../utils/helpers';
import { MY_REQUESTS_COPY } from '../../utils/requestsData';
import { RequestStatus } from '../../utils/types';
import CardThumb from '../common/CardThumb';
import StatusTag from '../common/StatusTag';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type DateRange = [Dayjs | null, Dayjs | null] | null;

interface MyRequestsSectionProps {
    initialTab?: string;
}

const textCell = (value: string) => <Text className="text-sm text-textBody">{value}</Text>;
const statusCell = (status: RequestStatus, row: MyRequestRow) => (
    <StatusTag status={status} tooltip={status === 'Rejected' ? row.decisionNote : undefined} />
);
const moneyCell = (value: number) => (
    <Text className="whitespace-nowrap text-sm text-textHeadings">
        {formatRupeesDecimal(value)}
    </Text>
);
const cardCell = (cardLast4: string) => (
    <div className="flex items-center gap-3">
        <CardThumb />
        <Text className="whitespace-nowrap text-sm text-textHeadings">{cardLast4}</Text>
    </div>
);

/** Backend request status → the cardholder-facing status vocabulary. */
const mapStatus = (status: string): RequestStatus => {
    if (status === 'APPROVED') return 'Approved';
    if (status === 'REJECTED' || status === 'CANCELLED') return 'Rejected';
    if (status === 'PROCESSING') return 'Processing';
    return 'Pending';
};

const formatReqDate = (iso: string): string => {
    try {
        return new Date(iso).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return iso;
    }
};

const formatShipping = (shipping: MyRequestItem['payload']['shipping']): string => {
    if (!shipping) return '—';
    const cityLine = [shipping.city, shipping.state].filter(Boolean).join(', ');
    const parts = [
        shipping.addressLine1,
        shipping.addressLine2,
        [cityLine, shipping.pinCode].filter(Boolean).join(' ').trim(),
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
};

/** One display row for any My-Requests tab (card-issuance / limit-increase / physical). */
interface MyRequestRow {
    key: string;
    date: string;
    type?: string;
    limit?: number;
    amount?: number;
    cardLast4: string;
    shippingAddress?: string;
    frozenReason?: string;
    status: RequestStatus;
    decisionNote?: string | null;
}

const EMPTY_TEXT_BY_TAB: Record<string, string> = {
    'card-requests': 'No card requests yet. Request a new card to get started.',
    'limit-increase-requests':
        'No limit increase requests yet. Request a limit increase to get started.',
    'physical-card-requests':
        'No physical card requests yet. Request a physical card from one of your cards.',
    'unfreeze-requests': 'No unfreeze requests yet.',
};

const dateCol = {
    key: 'date',
    title: 'Date',
    dataIndex: 'date',
    width: 160,
    render: (value: string) => textCell(formatReqDate(value)),
};
const rejectionStatusCol = {
    key: 'status',
    title: 'Status',
    dataIndex: 'status',
    width: 140,
    render: (status: RequestStatus, row: MyRequestRow) => statusCell(status, row),
};

const COLUMNS_BY_TAB: Record<string, ColumnsType<any>> = {
    'card-requests': [
        dateCol,
        { key: 'type', title: 'Type', dataIndex: 'type', width: 160, render: textCell },
        { key: 'limit', title: 'Limit', dataIndex: 'limit', width: 160, render: moneyCell },
        rejectionStatusCol,
    ],
    'limit-increase-requests': [
        dateCol,
        { key: 'card', title: 'Card', dataIndex: 'cardLast4', width: 220, render: cardCell },
        {
            key: 'amount',
            title: 'Requested Amount',
            dataIndex: 'amount',
            width: 160,
            render: moneyCell,
        },
        rejectionStatusCol,
    ],
    'physical-card-requests': [
        dateCol,
        { key: 'card', title: 'Card', dataIndex: 'cardLast4', width: 200, render: cardCell },
        {
            key: 'shippingAddress',
            title: 'Shipping address',
            dataIndex: 'shippingAddress',
            width: 300,
            render: textCell,
        },
        rejectionStatusCol,
    ],
    'unfreeze-requests': [
        dateCol,
        { key: 'card', title: 'Card', dataIndex: 'cardLast4', width: 220, render: cardCell },
        {
            key: 'frozenReason',
            title: 'Frozen reason',
            dataIndex: 'frozenReason',
            width: 240,
            render: textCell,
        },
        rejectionStatusCol,
    ],
};

const TAB_ITEMS: TabsProps['items'] = [
    { key: 'card-requests', label: 'Card requests' },
    { key: 'limit-increase-requests', label: 'Limit increase requests' },
    { key: 'physical-card-requests', label: 'Physical card requests' },
    { key: 'unfreeze-requests', label: 'Unfreeze requests' },
];

const PAGE_SIZE = 10;

const MyRequestsSection = ({ initialTab = 'card-requests' }: MyRequestsSectionProps) => {
    const [tab, setTab] = useState(() => consumePendingSubTab('my-requests') ?? initialTab);
    const [dateRange, setDateRange] = useState<DateRange>([dayjs().subtract(1, 'month'), dayjs()]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const cardReq = useMyRequestsApi('CARD_ISSUANCE', 'Virtual');
    const topupReq = useMyRequestsApi('LIMIT_INCREASE');
    const physicalReq = useMyRequestsApi('CARD_ISSUANCE', 'Physical');
    const unfreezeReq = useMyRequestsApi('UNFREEZE');

    const cardReqRows: MyRequestRow[] = useMemo(
        () =>
            cardReq.rows.map((r: MyRequestItem) => ({
                key: String(r.id),
                date: r.date,
                type: r.payload?.cardType ?? '-',
                limit: r.payload?.requestedLimit ?? 0,
                cardLast4: r.cardLast4 ? `**** ${r.cardLast4}` : '—',
                status: mapStatus(r.status),
                decisionNote: r.decisionNote,
            })),
        [cardReq.rows]
    );
    const topupRows: MyRequestRow[] = useMemo(
        () =>
            topupReq.rows.map((r: MyRequestItem) => ({
                key: String(r.id),
                date: r.date,
                cardLast4: r.cardLast4 ? `**** ${r.cardLast4}` : '—',
                amount: r.payload?.requestedAmount ?? 0,
                status: mapStatus(r.status),
                decisionNote: r.decisionNote,
            })),
        [topupReq.rows]
    );
    const physicalRows: MyRequestRow[] = useMemo(
        () =>
            physicalReq.rows.map((r: MyRequestItem) => ({
                key: String(r.id),
                date: r.date,
                cardLast4: r.cardLast4 ? `**** ${r.cardLast4}` : '—',
                shippingAddress: formatShipping(r.payload?.shipping),
                status: mapStatus(r.status),
                decisionNote: r.decisionNote,
            })),
        [physicalReq.rows]
    );

    const unfreezeRows: MyRequestRow[] = useMemo(
        () =>
            unfreezeReq.rows.map((r: MyRequestItem) => ({
                key: String(r.id),
                date: r.date,
                cardLast4: r.cardLast4 ? `**** ${r.cardLast4}` : '—',
                frozenReason: r.payload?.freezeReasonNote || r.payload?.freezeReasonLabel || '—',
                status: mapStatus(r.status),
                decisionNote: r.decisionNote,
            })),
        [unfreezeReq.rows]
    );

    const rowsByTab: Record<string, MyRequestRow[]> = {
        'card-requests': cardReqRows,
        'limit-increase-requests': topupRows,
        'physical-card-requests': physicalRows,
        'unfreeze-requests': unfreezeRows,
    };
    const loadingByTab: Record<string, boolean> = {
        'card-requests': cardReq.isLoading,
        'limit-increase-requests': topupReq.isLoading,
        'physical-card-requests': physicalReq.isLoading,
        'unfreeze-requests': unfreezeReq.isLoading,
    };
    const rows = rowsByTab[tab] ?? cardReqRows;
    const activeLoading = loadingByTab[tab] ?? false;

    const filtered = useMemo(
        () =>
            rows.filter(row => {
                if (search) {
                    const haystack = [
                        formatReqDate(row.date),
                        row.type,
                        row.cardLast4,
                        row.shippingAddress,
                        row.frozenReason,
                        row.status,
                        row.limit,
                        row.amount,
                    ]
                        .filter(value => value !== undefined && value !== null)
                        .join(' ')
                        .toLowerCase();
                    if (!haystack.includes(search.toLowerCase())) return false;
                }
                if (dateRange?.[0] && dateRange?.[1]) {
                    const date = dayjs(row.date);
                    if (date.isBefore(dateRange[0], 'day') || date.isAfter(dateRange[1], 'day'))
                        return false;
                }
                return true;
            }),
        [rows, search, dateRange]
    );

    const clearFilters = () => {
        setDateRange([dayjs().subtract(1, 'month'), dayjs()]);
        setSearch('');
    };

    useEffect(() => {
        setPage(1);
    }, [tab, search, dateRange]);

    /**
     * GenericTable hands the inner antd Table `pagination={false}` and renders its own pager beside it, so
     * the caller owns the slicing — passing the whole list printed every row under a pager that could only
     * ever say "1". Filtering here is in-memory, so both the window and the total follow `filtered`.
     */
    const paged = useMemo(
        () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [filtered, page]
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-col gap-1">
                    <Title level={3} className="!mb-0 !text-textHeadings">
                        {MY_REQUESTS_COPY.title}
                    </Title>
                    <Text className="text-sm text-textBody">{MY_REQUESTS_COPY.subtitle}</Text>
                </div>
            </div>

            <Tabs activeKey={tab} onChange={setTab} items={TAB_ITEMS} className="-mb-4" />

            <div className="rounded-2xl border border-borderCard bg-white p-5">
                <div className="flex items-end justify-between gap-4 max-md:flex-col max-md:items-stretch">
                    <div className="flex flex-wrap items-end gap-4 max-md:w-full">
                        <div className="flex flex-col gap-1.5 max-md:w-full">
                            <span className="text-sm text-textBody">Date</span>
                            <RangePicker
                                className="w-56 max-md:w-full"
                                placeholder={['Start date', 'End date']}
                                separator="→"
                                value={dateRange}
                                disabledDate={current => current > dayjs().endOf('day')}
                                onChange={dates => setDateRange(dates as DateRange)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 max-md:w-full">
                            <span className="text-sm text-textBody">Search</span>
                            <Input
                                allowClear
                                className="w-72 max-md:w-full"
                                prefix={<SearchOutlined className="text-textGreyLight" />}
                                placeholder="Search"
                                value={search}
                                onChange={event => setSearch(stripEmojis(event.target.value))}
                            />
                        </div>
                    </div>
                    <Button
                        type="text"
                        icon={<CloseCircleOutlined />}
                        onClick={clearFilters}
                        className="text-textBody max-md:self-end"
                    >
                        Clear
                    </Button>
                </div>
            </div>

            <GenericTable
                key={tab}
                columns={COLUMNS_BY_TAB[tab]}
                dataSource={paged}
                loading={activeLoading}
                rowKey="key"
                pagination={{
                    current: page,
                    pageSize: PAGE_SIZE,
                    total: filtered.length,
                    onChange: setPage,
                    showSizeChanger: false,
                }}
                locale={{
                    emptyText: (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={EMPTY_TEXT_BY_TAB[tab] ?? 'No requests yet.'}
                        />
                    ),
                }}
            />
        </div>
    );
};

export default MyRequestsSection;
