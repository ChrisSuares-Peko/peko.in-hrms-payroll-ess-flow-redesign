import { useMemo, useState } from 'react';

import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input, Pagination, Select, Typography } from 'antd';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { useDownloadOrderDocument } from '@src/domains/admin/reports/hooks/useDownloadOrderDocument';
import useVendors from '@src/domains/admin/reports/hooks/useVendors';
import {
    OrderDocumentRecipient,
    OrderDocumentType,
} from '@src/domains/admin/reports/types/orderJournal';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import { FeeDetailsRow, FeeType } from '../api/feeDetails';
import ExportButtons from '../components/common/ExportButtons';
import { postingColumn } from '../components/common/PostingCell';
import { amountCell } from '../components/ledgers/vendorColumns';
import { manualJournalPath } from '../config/manualOperations';
import { withFaqTitles } from '../faq/FaqHint';
import useFeeDetails from '../hooks/useFeeDetails';
import useFeeDetailsExport from '../hooks/useFeeDetailsExport';
import {
    ACCOUNT_SCOPE_LABEL,
    ACCOUNT_SCOPE_OPTIONS,
    ACCOUNT_SCOPE_PARAM,
    accountScopeOf,
} from '../utils/accountScope';
import { formatInr } from '../utils/commission';

const DATE_FORMAT = 'YYYY-MM-DD';
const PAGE_SIZE = 10;

const FEE_LABEL: Record<FeeType, string> = {
    commission: 'Commission',
    platformFee: 'Platform Fee',
};

// The one invoice relevant to each fee type — not the full multi-doc set.
const INVOICE_SOURCE: Record<
    FeeType,
    { recipient: OrderDocumentRecipient; docType: OrderDocumentType }
> = {
    commission: { recipient: 'vendor', docType: 'invoice' },
    platformFee: { recipient: 'subscriber', docType: 'invoice' },
};

type Props = { feeType: FeeType };

type DocumentActions = Pick<
    ReturnType<typeof useDownloadOrderDocument>,
    'loadingKey' | 'downloadDocument'
>;

// Exported so the FAQ coverage test can walk the titles of both fee types.
export const feeDetailsColumns = (
    feeType: FeeType,
    { loadingKey, downloadDocument }: DocumentActions
) => {
    const label = FEE_LABEL[feeType];
    const isCommission = feeType === 'commission';
    const invoiceSource = INVOICE_SOURCE[feeType];

    return [
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
            render: (_: unknown, row: FeeDetailsRow) => (
                <Typography.Text copyable>{row.corporateTxnId}</Typography.Text>
            ),
        },
        {
            title: 'Service',
            key: 'service',
            width: 170,
            render: (_: unknown, row: FeeDetailsRow) => row.service || '—',
        },
        {
            title: 'Vendor',
            key: 'vendorName',
            width: 170,
            render: (_: unknown, row: FeeDetailsRow) => row.vendorName || '—',
        },
        {
            title: 'Order Value',
            key: 'orderValue',
            width: 140,
            render: (_: unknown, row: FeeDetailsRow) => amountCell(row.orderValue),
        },
        {
            title: `${label} (excl. GST)`,
            key: 'feeExcludingGST',
            width: 190,
            render: (_: unknown, row: FeeDetailsRow) => amountCell(row.feeExcludingGST),
        },
        {
            title: `${label} (incl. GST)`,
            key: 'feeIncludingGST',
            width: 190,
            render: (_: unknown, row: FeeDetailsRow) => amountCell(row.feeIncludingGST),
        },
        ...(isCommission
            ? [
                  {
                      title: 'Reversed',
                      key: 'feeReversed',
                      width: 130,
                      render: (_: unknown, row: FeeDetailsRow) =>
                          row.feeReversed ? (
                              <span className="text-red-600">- {formatInr(row.feeReversed)}</span>
                          ) : (
                              '—'
                          ),
                  },
                  {
                      title: 'Net',
                      key: 'feeNet',
                      width: 130,
                      render: (_: unknown, row: FeeDetailsRow) => amountCell(row.feeNet ?? null),
                  },
              ]
            : []),
        postingColumn<FeeDetailsRow>({ linkTo: row => manualJournalPath(row.corporateTxnId) }),
        {
            title: 'Invoice',
            key: 'invoice',
            width: 140,
            render: (_: unknown, row: FeeDetailsRow) => {
                const recipientDocs = row.documents?.[invoiceSource.recipient] as
                    Partial<Record<OrderDocumentType, boolean>> | undefined;
                const available = Boolean(recipientDocs?.[invoiceSource.docType]);
                const key = `${row.id}:${invoiceSource.recipient}:${invoiceSource.docType}`;
                return (
                    <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        disabled={!available}
                        loading={loadingKey === key}
                        onClick={() =>
                            downloadDocument(row.id, invoiceSource.recipient, invoiceSource.docType)
                        }
                        aria-label={`Download ${label} invoice for ${row.corporateTxnId}`}
                    >
                        Download
                    </Button>
                );
            },
        },
    ];
};

// Shared table for Commission Details and Platform Fee Details — same shape, different fields.
const FeeDetails = ({ feeType }: Props) => {
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState({ page: 1, searchText: '' });
    const [range, setRange] = useState({
        from: searchParams.get('from') || dayjs().subtract(1, 'month').format(DATE_FORMAT),
        to: searchParams.get('to') || dayjs().format(DATE_FORMAT),
    });
    const [vendorId, setVendorId] = useState<number | undefined>();
    const [accounts, setAccounts] = useState(accountScopeOf(searchParams.get(ACCOUNT_SCOPE_PARAM)));

    const { searchText, updateSearchText } = useDebounceSearch(setQuery);
    // fetchAllVendors returns the whole list in one call, so this fetches it once and lets
    // the Select filter locally — no need to hit the API on every keystroke.
    const { dropDownData } = useVendors('');
    const { loadingKey, downloadDocument } = useDownloadOrderDocument();

    const resetToFirstPage = () => setQuery(prev => ({ ...prev, page: 1 }));

    const filters = useMemo(
        () => ({
            feeType,
            page: query.page,
            itemsPerPage: PAGE_SIZE,
            searchText: query.searchText,
            from: range.from,
            to: range.to,
            vendorId,
            accounts: accounts || undefined,
        }),
        [feeType, query.page, query.searchText, range.from, range.to, vendorId, accounts]
    );

    const { isLoading, tableData, count } = useFeeDetails(filters);

    const exportFilters = useMemo(
        () => ({
            feeType,
            searchText: query.searchText,
            from: range.from,
            to: range.to,
            vendorId,
            accounts: accounts || undefined,
        }),
        [feeType, query.searchText, range.from, range.to, vendorId, accounts]
    );
    const { exportingFormat, exportAs } = useFeeDetailsExport(
        exportFilters,
        `${FEE_LABEL[feeType]} Details`
    );

    const columns = withFaqTitles(
        feeDetailsColumns(feeType, { loadingKey, downloadDocument }),
        'Fee Details',
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
                        showSearch
                        optionFilterProp="label"
                        placeholder="All vendors"
                        options={(dropDownData || []).map(item => ({
                            value: item.id,
                            label: item.vendorName,
                        }))}
                        onChange={value => {
                            setVendorId(value ?? undefined);
                            resetToFirstPage();
                        }}
                        className="w-full sm:w-48"
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
                rowKey={(record: FeeDetailsRow) => record.id}
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

export default FeeDetails;
