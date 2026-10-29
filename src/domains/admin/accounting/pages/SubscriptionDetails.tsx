import { useMemo, useState } from 'react';

import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input, Pagination, Select, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { useDownloadOrderDocument } from '@src/domains/admin/reports/hooks/useDownloadOrderDocument';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import { BillingType, SubscriptionDetailsRow } from '../api/subscriptionDetails';
import ExportButtons from '../components/common/ExportButtons';
import { postingColumn } from '../components/common/PostingCell';
import { partnerLabel } from '../components/ledgers/subscriberColumns';
import { amountCell } from '../components/ledgers/vendorColumns';
import { manualJournalPath } from '../config/manualOperations';
import { withFaqTitles } from '../faq/FaqHint';
import useSubscriptionDetails from '../hooks/useSubscriptionDetails';
import useSubscriptionDetailsExport from '../hooks/useSubscriptionDetailsExport';
import {
    ACCOUNT_SCOPE_LABEL,
    ACCOUNT_SCOPE_OPTIONS,
    ACCOUNT_SCOPE_PARAM,
    accountScopeOf,
} from '../utils/accountScope';

const DATE_FORMAT = 'YYYY-MM-DD';
const PAGE_SIZE = 10;

const BILLING_TYPE_OPTIONS = [
    { label: 'All', value: '' },
    { label: 'Monthly', value: 'MONTHLY' },
    { label: 'Annually', value: 'ANNUALLY' },
];

const INVOICE_SOURCE = { recipient: 'subscriber' as const, docType: 'invoice' as const };

type DocumentActions = Pick<
    ReturnType<typeof useDownloadOrderDocument>,
    'loadingKey' | 'downloadDocument'
>;

// Exported so the FAQ coverage test can walk the titles; Invoice needs the page's downloader.
export const subscriptionDetailsColumns = ({ loadingKey, downloadDocument }: DocumentActions) => [
    {
        title: 'Date',
        dataIndex: 'transactionDate',
        key: 'transactionDate',
        width: 140,
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
        title: 'Order Ref',
        dataIndex: 'corporateTxnId',
        key: 'corporateTxnId',
        width: 170,
        render: (_: unknown, row: SubscriptionDetailsRow) => (
            <Typography.Text copyable>{row.corporateTxnId}</Typography.Text>
        ),
    },
    {
        title: 'Subscriber',
        key: 'subscriber',
        width: 180,
        render: (_: unknown, row: SubscriptionDetailsRow) => (
            <Flex vertical>
                <Typography.Text>{row.subscriberUsername || '—'}</Typography.Text>
                {row.subscriberName && (
                    <Typography.Text className="text-xs text-navTextColor">
                        {row.subscriberName}
                    </Typography.Text>
                )}
            </Flex>
        ),
    },
    {
        title: 'Partner',
        key: 'partnerName',
        width: 160,
        render: (_: unknown, row: SubscriptionDetailsRow) => partnerLabel(row.partnerName),
    },
    {
        title: 'Plan',
        key: 'plan',
        width: 160,
        render: (_: unknown, row: SubscriptionDetailsRow) => row.plan || '—',
    },
    {
        title: 'Billing',
        key: 'billingType',
        width: 110,
        render: (_: unknown, row: SubscriptionDetailsRow) =>
            row.billingType ? (
                <Tag color={row.billingType === 'MONTHLY' ? 'blue' : 'purple'}>
                    {row.billingType === 'MONTHLY' ? 'Monthly' : 'Annually'}
                </Tag>
            ) : (
                '—'
            ),
    },
    {
        title: 'Order Value',
        key: 'orderValue',
        width: 140,
        render: (_: unknown, row: SubscriptionDetailsRow) => amountCell(row.orderValue),
    },
    {
        title: 'Net Revenue (excl. GST)',
        key: 'netRevenue',
        width: 180,
        render: (_: unknown, row: SubscriptionDetailsRow) => amountCell(row.netRevenue),
    },
    postingColumn<SubscriptionDetailsRow>({
        linkTo: row => manualJournalPath(row.corporateTxnId),
    }),
    {
        title: 'Invoice',
        key: 'invoice',
        width: 140,
        render: (_: unknown, row: SubscriptionDetailsRow) => {
            const available = Boolean(row.documents?.subscriber?.invoice);
            const key = `${row.id}:${INVOICE_SOURCE.recipient}:${INVOICE_SOURCE.docType}`;
            return (
                <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    disabled={!available}
                    loading={loadingKey === key}
                    onClick={() =>
                        downloadDocument(row.id, INVOICE_SOURCE.recipient, INVOICE_SOURCE.docType)
                    }
                    aria-label={`Download invoice for ${row.corporateTxnId}`}
                >
                    Download
                </Button>
            );
        },
    },
];

// Backs all three Subscriptions dashboard cards — the Monthly/Annual ones just seed
// billingType from the URL; the plain Subscriptions card leaves it unset.
const SubscriptionDetails = () => {
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState({ page: 1, searchText: '' });
    const [range, setRange] = useState({
        from: searchParams.get('from') || dayjs().subtract(1, 'month').format(DATE_FORMAT),
        to: searchParams.get('to') || dayjs().format(DATE_FORMAT),
    });
    const [partnerId, setPartnerId] = useState<string | number | undefined>();
    const [billingType, setBillingType] = useState<BillingType | ''>(
        (searchParams.get('billingType') as BillingType | null) || ''
    );
    const [accounts, setAccounts] = useState(accountScopeOf(searchParams.get(ACCOUNT_SCOPE_PARAM)));

    const { searchText, updateSearchText } = useDebounceSearch(setQuery);
    const { partnerData } = usePartnersForCorporate('');
    const { loadingKey, downloadDocument } = useDownloadOrderDocument();

    const resetToFirstPage = () => setQuery(prev => ({ ...prev, page: 1 }));

    const filters = useMemo(
        () => ({
            page: query.page,
            itemsPerPage: PAGE_SIZE,
            searchText: query.searchText,
            from: range.from,
            to: range.to,
            partnerId,
            billingType: billingType || undefined,
            accounts: accounts || undefined,
        }),
        [query.page, query.searchText, range.from, range.to, partnerId, billingType, accounts]
    );

    const { isLoading, tableData, count } = useSubscriptionDetails(filters);

    const exportFilters = useMemo(
        () => ({
            searchText: query.searchText,
            from: range.from,
            to: range.to,
            partnerId,
            billingType: billingType || undefined,
            accounts: accounts || undefined,
        }),
        [query.searchText, range.from, range.to, partnerId, billingType, accounts]
    );
    const { exportingFormat, exportAs } = useSubscriptionDetailsExport(exportFilters);

    const columns = withFaqTitles(
        subscriptionDetailsColumns({ loadingKey, downloadDocument }),
        'Subscription Details',
        'Columns'
    );

    return (
        <Flex vertical gap={20}>
            <Flex justify="space-between" className="w-full gap-3 flex-wrap">
                <ExportButtons
                    onExport={exportAs}
                    loadingFormat={exportingFormat}
                    disabled={isLoading || count === 0}
                />
                <Flex className="gap-3 flex-wrap">
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
                        allowClear
                        placeholder="All partners"
                        options={partnerData || []}
                        onChange={value => {
                            setPartnerId(value ?? undefined);
                            resetToFirstPage();
                        }}
                        className="w-full sm:w-48"
                    />
                    <Select
                        value={billingType}
                        options={BILLING_TYPE_OPTIONS}
                        onChange={value => {
                            setBillingType(value);
                            resetToFirstPage();
                        }}
                        className="w-full sm:w-36"
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
            </Flex>
            <GenericTable
                rowKey={(record: SubscriptionDetailsRow) => record.id}
                columns={columns}
                dataSource={tableData}
                loading={isLoading}
                pagination={false}
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
        </Flex>
    );
};

export default SubscriptionDetails;
