import { useEffect, useMemo, useState } from 'react';

import { CreditCardOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Pagination, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import useDebounce from '@src/hooks/useDebounce';
import useScreenSize from '@src/hooks/useScreenSize';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import Header from './Header';
import StatusTag from './StatusTag';
import TransactionDetailDrawer from './TransactionDetailDrawer';
import {
    eventLabel,
    STATUS_QUERY,
    transactionTypeLabel,
    TransactionStatus,
} from './transactionMeta';
import useCorporateCardTransactions from '../../hooks/useCorporateCardTransactions';
import useFilter from '../../hooks/useFilter';
import { CorporateCardTransactionRow } from '../../types/corporateCardTransactions';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const PHONE_PRIMARY_COLUMN = 'displayId';
const PHONE_COLLAPSED_WIDTH = 480;

const { Text } = Typography;

const defaultFilters = () => ({
    corporateId: undefined as number | undefined,
    status: undefined as TransactionStatus | undefined,
    transactionType: undefined as number | undefined,
    page: 1,
    from: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD'),
});

type Filters = ReturnType<typeof defaultFilters>;

const CorporateCardTransactionsTable = () => {
    const { xs } = useScreenSize();
    const [filters, setFilters] = useState<Filters>(defaultFilters);
    const [searchInput, setSearchInput] = useState('');
    const [cardLast4Input, setCardLast4Input] = useState('');

    const searchText = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);
    const cardLast4 = useDebounce(cardLast4Input, SEARCH_DEBOUNCE_MS);

    const defaultRange = useMemo(() => {
        const { from, to } = defaultFilters();
        return { from, to };
    }, []);

    useEffect(() => {
        setFilters(prev => (prev.page === 1 ? prev : { ...prev, page: 1 }));
    }, [searchText, cardLast4]);

    const { handleFromChange, handleToChange, handleDateChange } = useFilter({
        setFilters,
        initalStartDate: defaultRange.from,
        initalEndDate: defaultRange.to,
    });

    const setFilter = (patch: Partial<Filters>) =>
        setFilters(prev => ({ ...prev, ...patch, page: 1 }));

    const handleReset = () => {
        setSearchInput('');
        setCardLast4Input('');
        setFilters(defaultFilters());
    };

    const statusQuery = filters.status ? STATUS_QUERY[filters.status] : undefined;

    const {
        isLoading,
        tableData,
        total,
        corporates,
        viewRecord,
        viewLoadingId,
        openTransaction,
        closeTransaction,
    } = useCorporateCardTransactions({
        corporateId: filters.corporateId,
        cardLast4: cardLast4 || undefined,
        decision: statusQuery?.decision,
        internalStatus: statusQuery?.internalStatus,
        transactionType: filters.transactionType,
        searchText: searchText || undefined,
        dateFrom: filters.from,
        dateTo: filters.to,
        page: filters.page,
        itemsPerPage: PAGE_SIZE,
    });

    const activeFilterCount = [
        filters.corporateId,
        filters.status,
        filters.transactionType,
        cardLast4 || undefined,
        searchText || undefined,
    ].filter(value => value !== undefined).length;

    const isDateRangeChanged = filters.from !== defaultRange.from || filters.to !== defaultRange.to;

    const rangeLabel = useMemo(() => {
        if (!total) return 'No transactions';
        const start = (filters.page - 1) * PAGE_SIZE + 1;
        const end = Math.min(filters.page * PAGE_SIZE, total);
        return `Showing ${start}–${end} of ${total} transactions`;
    }, [filters.page, total]);

    const allColumns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 120,
            render: (value: string) => (
                <Flex vertical>
                    <Text className="text-sm text-textHeadings">
                        {formattedDateOnly(new Date(value))}
                    </Text>
                    <Text className="text-xs text-textGreyColor">
                        {formattedTime(new Date(value))}
                    </Text>
                </Flex>
            ),
        },
        {
            title: 'Transaction',
            dataIndex: 'displayId',
            key: 'displayId',
            width: 190,
            render: (value: string | null, record: CorporateCardTransactionRow) => (
                <Flex vertical>
                    <Text className="font-medium text-textHeadings">{value ?? '-'}</Text>
                    <Tooltip title={record.transactionUniqueId}>
                        <Text className="max-w-[170px] truncate text-xs text-textGreyColor">
                            {record.transactionUniqueId}
                        </Text>
                    </Tooltip>
                    {xs && (
                        <Text className="text-xs text-textGreyColor">
                            {formattedDateOnly(new Date(record.createdAt))} ·{' '}
                            {formattedTime(new Date(record.createdAt))}
                        </Text>
                    )}
                </Flex>
            ),
        },
        {
            title: 'Corporate',
            dataIndex: 'corporateName',
            key: 'corporateName',
            width: 180,
            render: (value: string | null, record: CorporateCardTransactionRow) => (
                <Flex vertical>
                    <Text
                        ellipsis={{ tooltip: value || undefined }}
                        className="max-w-[160px] text-sm text-textHeadings"
                    >
                        {value ?? '-'}
                    </Text>
                    <Text className="text-xs text-textGreyColor">
                        {record.corporateId ? `#${record.corporateId}` : '-'}
                    </Text>
                </Flex>
            ),
        },
        {
            title: 'Cardholder',
            dataIndex: 'cardholderName',
            key: 'cardholderName',
            width: 170,
            render: (value: string | null, record: CorporateCardTransactionRow) => (
                <Flex vertical>
                    <Text
                        ellipsis={{ tooltip: value || undefined }}
                        className="max-w-[150px] text-sm text-textHeadings"
                    >
                        {value ?? '-'}
                    </Text>
                    <Text className="text-xs text-textGreyColor">
                        {record.cardLast4 ? `•••• ${record.cardLast4}` : 'Card not linked'}
                    </Text>
                </Flex>
            ),
        },
        {
            title: 'Merchant',
            dataIndex: 'merchantName',
            key: 'merchantName',
            width: 190,
            render: (value: string | null, record: CorporateCardTransactionRow) => (
                <Flex vertical>
                    <Text
                        ellipsis={{ tooltip: value || undefined }}
                        className="max-w-[170px] text-sm text-textHeadings"
                    >
                        {value ?? '-'}
                    </Text>
                    <Text className="text-xs text-textGreyColor">
                        {record.category ?? record.merchantCity ?? '-'}
                    </Text>
                </Flex>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'transactionAmount',
            key: 'transactionAmount',
            width: 130,
            align: 'right' as const,
            render: (value: number, record: CorporateCardTransactionRow) => (
                <Text
                    className={`text-sm font-semibold tabular-nums ${
                        record.status === 'Declined' ? 'text-textGreyColor' : 'text-textHeadings'
                    }`}
                >
                    ₹ {formatNumberWithLocalString(value)}
                </Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 140,
            render: (value: string, record: CorporateCardTransactionRow) => (
                <Flex vertical gap={4} align="start">
                    <StatusTag status={value} />
                    <Text className="text-xs text-textGreyColor">
                        {eventLabel(record.eventType)}
                        {record.transactionType === null
                            ? ''
                            : ` · ${transactionTypeLabel(record.transactionType)}`}
                    </Text>
                </Flex>
            ),
        },
        {
            title: 'Action',
            key: 'actions',
            width: 90,
            render: (_: unknown, record: CorporateCardTransactionRow) => (
                <Button
                    type="text"
                    size="small"
                    icon={<EyeOutlined />}
                    loading={viewLoadingId === record.id}
                    onClick={() => openTransaction(record.id)}
                >
                    View
                </Button>
            ),
        },
    ];

    const columns = xs
        ? [
              allColumns.find(column => column.key === PHONE_PRIMARY_COLUMN)!,
              ...allColumns
                  .filter(column => column.key !== PHONE_PRIMARY_COLUMN)
                  .map(column => ({ ...column, width: PHONE_COLLAPSED_WIDTH })),
          ]
        : allColumns;

    return (
        <Flex vertical gap={20}>
            <Flex align="center" gap={12}>
                <div className="flex size-10 items-center justify-center rounded-xl bg-bgIconCard">
                    <CreditCardOutlined className="text-xl text-brandColor" />
                </div>
                <Flex vertical gap={2}>
                    <Typography.Title level={4} className="!mb-0">
                        Corporate Card Transactions
                    </Typography.Title>
                    <Typography.Text className="text-sm text-textBody">
                        Every authorisation and settlement received from the card issuer, across all
                        corporates. Open a row to inspect the raw vendor payloads.
                    </Typography.Text>
                </Flex>
            </Flex>

            <div className="rounded-2xl border border-borderCard bg-white p-4 sm:p-6">
                <div className="border-b border-borderDivider pb-5">
                    <Header
                        from={filters.from}
                        to={filters.to}
                        corporateId={filters.corporateId}
                        status={filters.status}
                        transactionType={filters.transactionType}
                        cardLast4={cardLast4Input}
                        searchText={searchInput}
                        corporates={corporates}
                        isDateRangeChanged={isDateRangeChanged}
                        handleFromChange={handleFromChange}
                        handleToChange={handleToChange}
                        handleDateChange={handleDateChange}
                        onCorporateChange={val => setFilter({ corporateId: val })}
                        onStatusChange={val => setFilter({ status: val })}
                        onTransactionTypeChange={val =>
                            setFilter({ transactionType: val ? Number(val) : undefined })
                        }
                        onCardLast4Change={setCardLast4Input}
                        onSearchChange={setSearchInput}
                        onReset={handleReset}
                    />
                </div>

                <div className="overflow-x-auto pt-5">
                    <GenericTable
                        rowKey={(record: CorporateCardTransactionRow) => record.id}
                        columns={columns}
                        dataSource={tableData}
                        pagination={false}
                        loading={isLoading}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        activeFilterCount > 0
                                            ? 'No transactions match these filters.'
                                            : 'No transactions in this date range.'
                                    }
                                />
                            ),
                        }}
                    />

                    <Flex align="center" justify="space-between" gap={12} wrap className="pt-4">
                        <Typography.Text className="text-xs text-textGreyColor">
                            {isLoading ? 'Loading transactions…' : rangeLabel}
                        </Typography.Text>
                        {total > 0 && (
                            <Pagination
                                current={filters.page}
                                pageSize={PAGE_SIZE}
                                total={total}
                                showSizeChanger={false}
                                onChange={page => setFilters(prev => ({ ...prev, page }))}
                            />
                        )}
                    </Flex>
                </div>
            </div>

            <TransactionDetailDrawer record={viewRecord} onClose={closeTransaction} />
        </Flex>
    );
};

export default CorporateCardTransactionsTable;
