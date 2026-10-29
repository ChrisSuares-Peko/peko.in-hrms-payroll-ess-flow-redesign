import { useMemo, useState } from 'react';

import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input, Pagination, Select, Typography } from 'antd';
import { TableProps } from 'antd/lib';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { countOrderDocuments } from '@src/domains/admin/reports/components/OrderJournal/orderDocuments';
import OrderDocumentsModal from '@src/domains/admin/reports/components/OrderJournal/OrderDocumentsModal';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { TransactionsTotals } from '../api/transactions';
import { postingColumn } from '../components/common/PostingCell';
import StatusPill from '../components/common/StatusPill';
import { amountCell, orderStatusPill } from '../components/ledgers/vendorColumns';
import SummaryStrip from '../components/serviceDetail/SummaryStrip';
import { manualJournalPath } from '../config/manualOperations';
import { withFaqTitles } from '../faq/FaqHint';
import useTransactions from '../hooks/useTransactions';
import {
    ACCOUNT_SCOPE_LABEL,
    ACCOUNT_SCOPE_OPTIONS,
    ACCOUNT_SCOPE_PARAM,
    accountScopeOf,
} from '../utils/accountScope';
import { formatInr } from '../utils/commission';

const DATE_FORMAT = 'YYYY-MM-DD';

const PAYMENT_STATUS_OPTIONS = [
    { label: 'All', value: '' },
    { label: 'Success', value: 'SUCCESS' },
    { label: 'Failed', value: 'FAILURE' },
    { label: 'Refunded', value: 'REFUNDED' },
    { label: 'Pending', value: 'PENDING' },
];

const PAGE_SIZE = 10;

// The same three order-value figures as the dashboard cards that link here, summed over the
// filtered set: Total GMV = Net GMV + Total Discount on every record and in these totals.
export const summaryItems = (totals: TransactionsTotals) => [
    { label: 'Total Transactions', value: formatNumberWithLocalString(totals.count, 0, 0) },
    { label: 'Total GMV', value: formatInr(totals.totalAmount) },
    { label: 'Total Discount', value: formatInr(totals.totalDiscount) },
    { label: 'Net GMV', value: formatInr(totals.totalNetGmv) },
];

// Exported so the FAQ coverage test can walk the titles; Documents needs the page's modal opener.
export const transactionsColumns = (onViewDocuments: (record: any) => void) => [
    {
        title: 'Transaction Date',
        dataIndex: 'transactionDate',
        key: 'transactionDate',
        width: 140,
        sorter: true,
        render: (date: string) => (
            <Flex vertical>
                <Typography.Text>{formattedDateOnly(new Date(date))}</Typography.Text>
                <Typography.Text className="text-xs text-navTextColor">
                    {formattedTime(new Date(date))}
                </Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Transaction ID',
        dataIndex: 'corporateTxnId',
        key: 'corporateTxnId',
        width: 170,
        render: (_: any, data: any) => (
            <Typography.Text copyable>{data.corporateTxnId}</Typography.Text>
        ),
    },
    {
        title: 'Customer',
        key: 'credential',
        width: 170,
        render: (_: any, data: any) => (
            <Flex vertical>
                <Typography.Text>{data?.credential?.username || '-'}</Typography.Text>
                {data?.credential?.name && (
                    <Typography.Text className="text-xs text-navTextColor">
                        {data.credential.name}
                    </Typography.Text>
                )}
            </Flex>
        ),
    },
    {
        title: 'Service',
        key: 'serviceOperator',
        width: 170,
        render: (_: any, data: any) => (
            <Typography.Text>{data?.serviceOperator?.serviceProvider || '-'}</Typography.Text>
        ),
    },
    {
        title: 'Amount',
        key: 'amount',
        width: 140,
        render: (_: any, data: any) => amountCell(data?.order?.amountInINR ?? null),
    },
    {
        title: 'Total GMV',
        key: 'gmv',
        width: 130,
        render: (_: any, data: any) => amountCell(data?.order?.gmv ?? null),
    },
    {
        title: 'Total Discount',
        key: 'discount',
        width: 130,
        render: (_: any, data: any) => amountCell(data?.order?.discount ?? null),
    },
    {
        title: 'Net GMV',
        key: 'netGmv',
        width: 130,
        render: (_: any, data: any) => amountCell(data?.order?.netGmv ?? null),
    },
    {
        title: 'Payment Mode',
        key: 'paymentMode',
        width: 180,
        render: (_: any, data: any) => (
            <Typography.Text>{data?.order?.paymentMode || '-'}</Typography.Text>
        ),
    },
    {
        title: 'Status',
        key: 'status',
        width: 130,
        render: (_: any, data: any) => <StatusPill {...orderStatusPill(data?.order?.status)} />,
    },
    postingColumn({ linkTo: (data: any) => manualJournalPath(data?.corporateTxnId) }),
    {
        title: 'Documents',
        key: 'documents',
        width: 120,
        render: (_: any, data: any) => {
            const documentCount = countOrderDocuments(data?.documents);
            return (
                <Flex align="center" gap={10}>
                    <Typography.Text>{documentCount}</Typography.Text>
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        disabled={documentCount === 0}
                        onClick={() => onViewDocuments(data)}
                        aria-label={`View documents for ${data?.corporateTxnId}`}
                    />
                </Flex>
            );
        },
    },
];

const summaryScopeNote = (range: { from: string; to: string }) =>
    `Totals cover ${dayjs(range.from).format('DD MMM YYYY')} to ${dayjs(range.to).format(
        'DD MMM YYYY'
    )} and follow every filter below.`;

const Transactions = () => {
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState({
        page: 1,
        searchText: '',
        sort: 'DESC',
        sortField: 'transactionDate',
    });
    // Dashboard KPI cards deep-link here with a from/to/status query string.
    const [range, setRange] = useState({
        from: searchParams.get('from') || dayjs().subtract(1, 'month').format(DATE_FORMAT),
        to: searchParams.get('to') || dayjs().format(DATE_FORMAT),
    });
    const [status, setStatus] = useState(searchParams.get('status') || '');
    const [accounts, setAccounts] = useState(accountScopeOf(searchParams.get(ACCOUNT_SCOPE_PARAM)));
    const [documentsRecord, setDocumentsRecord] = useState<any | null>(null);

    const { searchText, updateSearchText } = useDebounceSearch(setQuery);

    const resetToFirstPage = () => setQuery(prev => ({ ...prev, page: 1 }));

    // Memoized so the fetch effect doesn't re-fire on every render (infinite loop otherwise).
    const filters = useMemo(
        () => ({
            page: query.page,
            itemsPerPage: PAGE_SIZE,
            searchText: query.searchText,
            sort: query.sort,
            sortField: query.sortField,
            from: range.from,
            to: range.to,
            status,
            accounts: accounts || undefined,
        }),
        [
            query.page,
            query.searchText,
            query.sort,
            query.sortField,
            range.from,
            range.to,
            status,
            accounts,
        ]
    );

    const { isLoading, tableData, count, totals } = useTransactions(filters);

    const handleTableChange: TableProps<any>['onChange'] = (_pagination, _filter, sorter) => {
        const single = Array.isArray(sorter) ? sorter[0] : sorter;
        if (!single?.order) return;
        const field = Array.isArray(single.field) ? single.field.join('.') : single.field;
        setQuery(prev => ({
            ...prev,
            sortField: String(field),
            sort: single.order === 'ascend' ? 'ASC' : 'DESC',
            page: 1,
        }));
    };

    const columns = withFaqTitles(
        transactionsColumns(setDocumentsRecord),
        'Transactions',
        'Columns'
    );

    return (
        <Flex vertical gap={20}>
            <SummaryStrip
                items={summaryItems(totals)}
                footnote={summaryScopeNote(range)}
                faq={{ screen: 'Transactions', tab: 'Summary' }}
            />
            <Flex justify="end" className="w-full gap-3 flex-wrap">
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
                        resetToFirstPage();
                    }}
                />
                <Select
                    value={status}
                    className="min-w-32"
                    options={PAYMENT_STATUS_OPTIONS}
                    onChange={value => {
                        setStatus(value);
                        resetToFirstPage();
                    }}
                />
                <Select
                    value={accounts}
                    aria-label={ACCOUNT_SCOPE_LABEL}
                    options={ACCOUNT_SCOPE_OPTIONS}
                    onChange={value => {
                        setAccounts(accountScopeOf(value));
                        resetToFirstPage();
                    }}
                    className="w-full sm:w-52"
                />
                <Input
                    allowClear
                    prefix={<SearchOutlined className="text-navTextColor" />}
                    placeholder="Search"
                    value={searchText}
                    onChange={updateSearchText}
                    className="w-fit"
                />
            </Flex>
            <GenericTable
                rowKey={(record: any) => record.id}
                columns={columns}
                dataSource={tableData}
                loading={isLoading}
                pagination={false}
                onChange={handleTableChange}
                className="rounded-xl border border-solid border-borderCard overflow-hidden"
            />
            <Pagination
                current={query.page}
                pageSize={PAGE_SIZE}
                total={count}
                onChange={page => setQuery(prev => ({ ...prev, page }))}
                showSizeChanger={false}
                hideOnSinglePage
                className="text-end justify-end"
            />
            {documentsRecord && (
                <OrderDocumentsModal
                    open
                    onClose={() => setDocumentsRecord(null)}
                    orderId={documentsRecord?.order?.id}
                    corporateTxnId={documentsRecord?.corporateTxnId}
                    documents={documentsRecord?.documents}
                />
            )}
        </Flex>
    );
};

export default Transactions;
