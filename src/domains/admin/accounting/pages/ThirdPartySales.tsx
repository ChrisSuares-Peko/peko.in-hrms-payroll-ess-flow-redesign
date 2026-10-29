import { useMemo, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { DatePicker, Flex, Input, Pagination, Select, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import PageTabs from '@src/domains/dashboard/corporateCards/components/common/PageTabs';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import ExportButtons from '../components/common/ExportButtons';
import StatusPill from '../components/common/StatusPill';
import { amountCell, formatDate } from '../components/ledgers/vendorColumns';
import SummaryStrip from '../components/serviceDetail/SummaryStrip';
import { accountingLeafPath } from '../config/servicePaths';
import { withFaqTitles } from '../faq/FaqHint';
import { useThirdPartySales } from '../hooks/useThirdPartySales';
import useThirdPartySalesExport from '../hooks/useThirdPartySalesExport';
import {
    PaymentLinkEntry,
    PaymentLinkOutcome,
    PaymentLinksTotals,
    THIRD_PARTY_SALE_KINDS,
    ThirdPartySaleKind,
    ThirdPartySalesFilters,
} from '../types/thirdPartySales';
import {
    ACCOUNT_SCOPE_LABEL,
    ACCOUNT_SCOPE_OPTIONS,
    ACCOUNT_SCOPE_PARAM,
    accountScopeOf,
} from '../utils/accountScope';
import { PillMeta, formatInr } from '../utils/commission';

const PAGE_SIZE = 10;

const DATE_FORMAT = 'YYYY-MM-DD';

export { THIRD_PARTY_SALE_KINDS };

export const THIRD_PARTY_TAB_COPY: Record<ThirdPartySaleKind, { title: string; intro: string }> = {
    'payment-links': {
        title: 'Payment Links',
        intro: 'Money corporates collect from their own customers through Peko’s payment links. Every link is listed, paid or not, at the amount it asked for. The money belongs to the corporate and is passed on to it, so none of it is Peko’s revenue and nothing from it is in the books.',
    },
};

const TABS = (Object.keys(THIRD_PARTY_TAB_COPY) as ThirdPartySaleKind[]).map(key => ({
    key,
    label: THIRD_PARTY_TAB_COPY[key].title,
}));

const OUTCOME_PILLS: Record<PaymentLinkOutcome, PillMeta> = {
    paid: { label: 'Paid', tone: 'success' },
    pending: { label: 'Pending', tone: 'warning' },
    failed: { label: 'Failed', tone: 'danger' },
    expired: { label: 'Expired', tone: 'neutral' },
};

export const outcomePill = (outcome: PaymentLinkOutcome | null | undefined): PillMeta =>
    OUTCOME_PILLS[outcome ?? 'pending'] ?? OUTCOME_PILLS.pending;

const STATUS_OPTIONS = (Object.keys(OUTCOME_PILLS) as PaymentLinkOutcome[]).map(value => ({
    value,
    label: OUTCOME_PILLS[value].label,
}));

const KIND_LABELS: Record<PaymentLinkEntry['kind'], string> = {
    payment_link: 'Payment link',
    invoice: 'Invoice link',
};

const RAISED_BY_LABELS: Record<PaymentLinkEntry['raisedBy'], string> = {
    corporate: 'Corporate',
    admin: 'Admin',
};

const twoLines = (main: string | null, detail: string | null) => (
    <Flex vertical>
        <Typography.Text>{main || '—'}</Typography.Text>
        {detail ? (
            <Typography.Text className="text-xs text-textBody">{detail}</Typography.Text>
        ) : null}
    </Flex>
);

export const paymentLinkColumns: ColumnsType<PaymentLinkEntry> = [
    {
        title: 'Date',
        key: 'eventDate',
        width: 110,
        render: (_, row) => formatDate(row.eventDate ?? ''),
    },
    {
        title: 'Link ID',
        key: 'linkId',
        width: 150,
        render: (_, row) => twoLines(row.linkId, row.purpose),
    },
    { title: 'Type', key: 'kind', width: 110, render: (_, row) => KIND_LABELS[row.kind] },
    {
        title: 'Raised by',
        key: 'raisedBy',
        width: 100,
        render: (_, row) => RAISED_BY_LABELS[row.raisedBy],
    },
    {
        title: 'Corporate',
        key: 'corporate',
        width: 160,
        render: (_, row) => twoLines(row.corporateName, row.corporateUsername),
    },
    {
        title: 'Customer',
        key: 'customer',
        width: 150,
        render: (_, row) => twoLines(row.customerName, row.customerPhone),
    },
    { title: 'Provider', key: 'provider', width: 90, render: (_, row) => row.provider || '—' },
    { title: 'Amount', key: 'amount', width: 120, render: (_, row) => amountCell(row.amount) },
    {
        title: 'Status',
        key: 'status',
        width: 100,
        render: (_, row) => <StatusPill {...outcomePill(row.outcome)} />,
    },
    {
        title: 'Paid on',
        key: 'paidAt',
        width: 120,
        render: (_, row) => twoLines(row.paidAt ? formatDate(row.paidAt) : null, row.utr),
    },
    {
        title: 'Expires',
        key: 'expiresAt',
        width: 110,
        render: (_, row) => formatDate(row.expiresAt ?? ''),
    },
];

export const summaryItems = (totals: PaymentLinksTotals) => [
    { label: 'Links', value: formatNumberWithLocalString(totals.links ?? 0, 0, 0) },
    { label: 'Collected', value: formatInr(totals.collected) },
    { label: 'Pending', value: formatInr(totals.pending) },
    { label: 'Failed', value: formatInr(totals.failed) },
    { label: 'Expired', value: formatInr(totals.expired) },
];

export const summaryScopeNote = (range: { from: string; to: string }) =>
    `Totals cover ${dayjs(range.from).format('DD MMM YYYY')} to ${dayjs(range.to).format(
        'DD MMM YYYY'
    )} and follow every filter below. Collected adds up the links that were paid, dated by the day the payment came in; Pending, Failed and Expired add up the amounts requested on links that were not.`;

const PaymentLinksTab = () => {
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState({ page: 1, searchText: '' });
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
    const [status, setStatus] = useState<PaymentLinkOutcome | undefined>();
    const [accounts, setAccounts] = useState(accountScopeOf(searchParams.get(ACCOUNT_SCOPE_PARAM)));

    const { searchText, updateSearchText } = useDebounceSearch(setQuery);

    const setPage = (page: number) => setQuery(prev => ({ ...prev, page }));
    const resetToFirstPage = () => setQuery(prev => ({ ...prev, page: 1 }));

    const filters = useMemo<ThirdPartySalesFilters>(
        () => ({
            kind: THIRD_PARTY_SALE_KINDS.paymentLinks,
            page: query.page,
            itemsPerPage: PAGE_SIZE,
            searchText: query.searchText,
            from: range.from,
            to: range.to,
            status,
            accounts: accounts || undefined,
        }),
        [query.page, query.searchText, range.from, range.to, status, accounts]
    );

    const { entries, totals, count, isLoading } = useThirdPartySales(filters);

    const exportFilters = useMemo(
        () => ({
            kind: THIRD_PARTY_SALE_KINDS.paymentLinks,
            searchText: query.searchText,
            from: range.from,
            to: range.to,
            status,
            accounts: accounts || undefined,
        }),
        [query.searchText, range.from, range.to, status, accounts]
    );
    const { exportingFormat, exportAs } = useThirdPartySalesExport(
        exportFilters,
        'Third-Party Sales (Payment Links)'
    );

    const emptyText = query.searchText
        ? 'No payment links match your search.'
        : 'No payment links in this period.';

    return (
        <Flex vertical gap={16}>
            <Flex justify="space-between" align="flex-start" gap={16} wrap="wrap">
                <Typography.Text className="text-[13px] text-textBody max-w-[640px]">
                    {THIRD_PARTY_TAB_COPY['payment-links'].intro}
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
                faq={{ screen: 'Third-Party Sales', tab: 'Summary' }}
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
                        placeholder="All statuses"
                        options={STATUS_OPTIONS}
                        onChange={value => {
                            setStatus(value ?? undefined);
                            resetToFirstPage();
                        }}
                        className="w-full sm:w-44"
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
                        placeholder="Search link, customer or corporate"
                        value={searchText}
                        onChange={updateSearchText}
                        className="w-full sm:w-72"
                    />
                </Flex>
            </Flex>
            <GenericTable
                rowKey={(record: PaymentLinkEntry) => record.id}
                columns={withFaqTitles(paymentLinkColumns, 'Third-Party Sales', 'Columns')}
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

const TAB_PANELS: Record<ThirdPartySaleKind, () => JSX.Element> = {
    'payment-links': PaymentLinksTab,
};

const ThirdPartySales = () => {
    const { kind } = useParams();
    const navigate = useNavigate();
    const { search } = useLocation();
    const base = accountingLeafPath(paths.accountingAdmin.thirdPartySales);
    const active = TABS.find(tab => tab.key === kind)?.key;

    if (!active) {
        return <Navigate to={`${base}/${THIRD_PARTY_SALE_KINDS.paymentLinks}${search}`} replace />;
    }

    const Panel = TAB_PANELS[active];

    return (
        <Flex vertical gap={16}>
            <PageTabs
                tabs={TABS}
                activeKey={active}
                onChange={key => navigate(`${base}/${key}${search}`)}
            />
            <Panel />
        </Flex>
    );
};

export default ThirdPartySales;
