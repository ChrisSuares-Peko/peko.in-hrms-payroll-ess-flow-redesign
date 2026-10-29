import { useMemo, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { DatePicker, Flex, Input, Pagination, Select, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import useVendors from '@src/domains/admin/reports/hooks/useVendors';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';
import useDebounceSearch from '@src/hooks/useDebounceSearch';

import ExportButtons from '../components/common/ExportButtons';
import { postingColumn } from '../components/common/PostingCell';
import StatusPill from '../components/common/StatusPill';
import { amountCell, formatDate, orderStatusPill } from '../components/ledgers/vendorColumns';
import SummaryStrip from '../components/serviceDetail/SummaryStrip';
import { manualJournalPath } from '../config/manualOperations';
import { withFaqTitles } from '../faq/FaqHint';
import { useOtherSales } from '../hooks/useOtherSales';
import useOtherSalesExport from '../hooks/useOtherSalesExport';
import { OtherSaleEntry, OtherSalesFilters, OtherSalesTotals } from '../types/otherSales';
import {
    ACCOUNT_SCOPE_LABEL,
    ACCOUNT_SCOPE_OPTIONS,
    ACCOUNT_SCOPE_PARAM,
    accountScopeOf,
} from '../utils/accountScope';
import { formatInr } from '../utils/commission';

const PAGE_SIZE = 10;

const DATE_FORMAT = 'YYYY-MM-DD';

const NO_PARTNER = 'Peko (Default)';

export const INTRO =
    'Sales Peko made on its own account: services sold on principal markup, and one-time purchases such as extra Corporate Cards. On principal markup Peko sells at its own price, so the whole value is booked to Sales; the order is also listed on the vendor’s profile at the vendor’s price, which comes out of the advance; the markup never does.';

export const otherSalesColumns: ColumnsType<OtherSaleEntry> = [
    {
        title: 'Date',
        key: 'transactionDate',
        width: 130,
        render: (_, row) => formatDate(row.transactionDate),
    },
    { title: 'Txn ID', key: 'corporateTxnId', dataIndex: 'corporateTxnId', width: 170 },
    { title: 'Service', key: 'service', width: 160, render: (_, row) => row.service || '—' },
    { title: 'Vendor', key: 'vendorName', width: 170, render: (_, row) => row.vendorName || '—' },
    {
        title: 'Partner',
        key: 'partnerName',
        width: 160,
        render: (_, row) => row.partnerName || NO_PARTNER,
    },
    {
        title: 'Full Amount',
        key: 'totalAmount',
        width: 150,
        render: (_, row) => amountCell(row.totalAmount),
    },
    {
        title: 'Platform Fee',
        key: 'platformFee',
        width: 150,
        render: (_, row) => amountCell(row.platformFee),
    },
    { title: 'Markup', key: 'markup', width: 140, render: (_, row) => amountCell(row.markup) },
    {
        title: 'Coupon',
        key: 'couponDiscount',
        width: 140,
        render: (_, row) =>
            row.couponDiscount ? (
                <span className="text-red-600">- {formatInr(row.couponDiscount)}</span>
            ) : (
                '—'
            ),
    },
    {
        title: 'Status',
        key: 'status',
        width: 130,
        render: (_, row) => <StatusPill {...orderStatusPill(row.status)} />,
    },
    postingColumn<OtherSaleEntry>({ linkTo: row => manualJournalPath(row.corporateTxnId) }),
];

export const summaryItems = (totals: OtherSalesTotals) => [
    { label: 'Full Amount', value: formatInr(totals.totalAmount) },
    { label: 'Platform Fee', value: formatInr(totals.platformFee) },
    { label: 'Markup', value: formatInr(totals.markup) },
    { label: 'Coupon', value: formatInr(totals.couponDiscount) },
];

export const summaryScopeNote = (range: { from: string; to: string }) =>
    `Totals cover ${dayjs(range.from).format('DD MMM YYYY')} to ${dayjs(range.to).format(
        'DD MMM YYYY'
    )}, follow every filter below and add up only the sales whose entry reached the books. Full Amount is what the sale was worth in total, before any coupon, and it already contains the platform fee and the markup.`;

const OtherSales = () => {
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState({ page: 1, searchText: '' });
    // A dashboard KPI card (Today's/Monthly Statistics) can deep-link here with the exact
    // range it was computed from; otherwise fall back to the page's own default window.
    const [range, setRange] = useState(() => {
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        return from && to
            ? { from, to }
            : {
                  from: dayjs().subtract(1, 'month').format(DATE_FORMAT),
                  to: dayjs().format(DATE_FORMAT),
              };
    });
    const [vendorId, setVendorId] = useState<number | undefined>();
    const [partnerId, setPartnerId] = useState<number | 'default' | undefined>();
    const [vendorSearch, setVendorSearch] = useState('');
    const [accounts, setAccounts] = useState(accountScopeOf(searchParams.get(ACCOUNT_SCOPE_PARAM)));

    const { searchText, updateSearchText } = useDebounceSearch(setQuery);
    const { dropDownData } = useVendors(vendorSearch);
    const { partnerData } = usePartnersForCorporate('');

    const setPage = (page: number) => setQuery(prev => ({ ...prev, page }));
    const resetToFirstPage = () => setQuery(prev => ({ ...prev, page: 1 }));

    // The shared hook seeds a "Default" option for the sales Peko made to its own customers,
    // which the Partner column calls Peko (Default).
    const partnerOptions = useMemo(
        () =>
            (partnerData || []).map(option =>
                option.value === 'default' ? { ...option, label: NO_PARTNER } : option
            ),
        [partnerData]
    );

    const filters = useMemo<OtherSalesFilters>(
        () => ({
            page: query.page,
            itemsPerPage: PAGE_SIZE,
            searchText: query.searchText,
            from: range.from,
            to: range.to,
            vendorId,
            partnerId,
            accounts: accounts || undefined,
        }),
        [query.page, query.searchText, range.from, range.to, vendorId, partnerId, accounts]
    );

    const { entries, totals, count, isLoading } = useOtherSales(filters);

    const exportFilters = useMemo(
        () => ({
            searchText: query.searchText,
            from: range.from,
            to: range.to,
            vendorId,
            partnerId,
            accounts: accounts || undefined,
        }),
        [query.searchText, range.from, range.to, vendorId, partnerId, accounts]
    );
    const { exportingFormat, exportAs } = useOtherSalesExport(exportFilters);

    const emptyText = query.searchText
        ? 'No sales match your search.'
        : 'No other sales in this period.';

    return (
        <Flex vertical gap={16}>
            <Flex justify="space-between" align="flex-start" gap={16} wrap="wrap">
                <Typography.Text className="text-[13px] text-textBody max-w-[640px]">
                    {INTRO}
                </Typography.Text>
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
            </Flex>
            <SummaryStrip
                items={summaryItems(totals)}
                footnote={summaryScopeNote(range)}
                faq={{ screen: 'Other Sales', tab: 'Summary' }}
            />
            <Flex justify="space-between" align="center" gap={12} wrap="wrap">
                <ExportButtons
                    onExport={exportAs}
                    loadingFormat={exportingFormat}
                    disabled={isLoading || count === 0}
                />
                <Flex align="center" gap={12} wrap="wrap">
                    <Select
                        allowClear
                        showSearch
                        filterOption={false}
                        placeholder="All vendors"
                        options={(dropDownData || []).map(item => ({
                            value: item.id,
                            label: item.vendorName,
                        }))}
                        onSearch={setVendorSearch}
                        onChange={value => {
                            setVendorId(value ?? undefined);
                            resetToFirstPage();
                        }}
                        className="w-full sm:w-48"
                    />
                    <Select
                        allowClear
                        placeholder="All partners"
                        options={partnerOptions}
                        onChange={value => {
                            setPartnerId(
                                value === 'default' ? 'default' : Number(value) || undefined
                            );
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
                        placeholder="Search txn, service or vendor"
                        value={searchText}
                        onChange={updateSearchText}
                        className="w-full sm:w-72"
                    />
                </Flex>
            </Flex>
            <GenericTable
                rowKey={(record: OtherSaleEntry) => record.id}
                columns={withFaqTitles(otherSalesColumns, 'Other Sales', 'Columns')}
                dataSource={entries}
                loading={isLoading}
                pagination={false}
                locale={{ emptyText }}
            />
            <Pagination
                current={query.page}
                pageSize={PAGE_SIZE}
                total={count}
                onChange={setPage}
                showSizeChanger={false}
                hideOnSinglePage
                className="text-end justify-end"
            />
        </Flex>
    );
};

export default OtherSales;
