import { useState } from 'react';

import {
    CloseCircleOutlined,
    InfoCircleOutlined,
    SearchOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { Alert, Button, DatePicker, Flex, Input, Select, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import dayjs, { Dayjs } from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';

import arrowIcon from '../../../assets/icons/arrow.svg';
import exportIcon from '../../../assets/icons/export.svg';
import quickbooksImg from '../../../assets/quickbooks.png';
import {
    ACCOUNT_OPTIONS,
    CARD_TXN_ROWS,
    CardTxnRow,
    ExportStatus,
    GST_OPTIONS,
    PLACE_OPTIONS,
    REIMBURSEMENT_EXPORT_ROWS,
    ReimbursementExportRow,
    VENDOR_INVOICE_EXPORT_ROWS,
    VendorInvoiceExportRow,
    WALLET_TOPUP_ROWS,
    WalletTopupRow,
} from '../../../utils/accountingExportData';
import { formatRupeesDecimal, stripEmojis } from '../../../utils/helpers';
import PageTabs from '../../common/PageTabs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type Tab = 'card-transactions' | 'reimbursements' | 'vendor-invoices' | 'wallet-topups';
type DateRange = [Dayjs | null, Dayjs | null] | null;

const TABS = [
    { key: 'card-transactions', label: 'Card transactions' },
    { key: 'reimbursements', label: 'Reimbursements' },
    { key: 'vendor-invoices', label: 'Vendor Invoices' },
    { key: 'wallet-topups', label: 'Wallet top-ups' },
];

const ALERTS: Record<Tab, string> = {
    'card-transactions': "1 card transaction pending settlement — they'll appear here once posted.",
    reimbursements: "1 reimbursement awaiting your approval — they'll appear here once approved.",
    'vendor-invoices': '1 invoice awaiting approval from admin.',
    'wallet-topups': '',
};

const ExportStatusTag = ({ status }: { status: ExportStatus }) => (
    <Tag
        bordered={false}
        className={`m-0 rounded-full px-2 py-0.5 text-xs font-medium leading-none ${
            status === 'Exported'
                ? 'bg-savingsTagLightBg text-savingsTagLightText'
                : 'bg-bgOrangeShade text-textOrange'
        }`}
    >
        {status}
    </Tag>
);

const SELECT_CLS = 'w-full [&_.ant-select-selector]:!rounded-md';

const accountSelect = () => (
    <Select placeholder="Select account" options={ACCOUNT_OPTIONS} className={SELECT_CLS} />
);
const gstSelect = () => (
    <Select placeholder="Select" options={GST_OPTIONS} className={SELECT_CLS} />
);
const placeSelect = () => (
    <Select placeholder="Select" options={PLACE_OPTIONS} className={SELECT_CLS} />
);
const textInput = (placeholder = 'Enter') => (
    <Input placeholder={placeholder} className="w-full rounded-md" />
);
const splitBtn = () => (
    <Button className="flex items-center gap-1 text-textBody">
        <img src={arrowIcon} alt="" className="h-3.5 w-3.5" />
        Split
    </Button>
);

const cardTxnColumns: ColumnsType<CardTxnRow> = [
    {
        key: 'date',
        title: 'Date',
        dataIndex: 'date',
        width: 110,
        render: v => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'merchant',
        title: 'Merchant',
        dataIndex: 'merchant',
        width: 150,
        render: v => <Text className="text-sm text-textHeadings">{v}</Text>,
    },
    {
        key: 'member',
        title: 'Member',
        dataIndex: 'member',
        width: 130,
        render: v => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'amount',
        title: 'Amount',
        dataIndex: 'amount',
        width: 110,
        render: v => <Text className="text-sm text-textHeadings">{formatRupeesDecimal(v)}</Text>,
    },
    {
        key: 'fee',
        title: 'Fee',
        dataIndex: 'fee',
        width: 90,
        render: v => (
            <Text className="text-sm text-textBody">{v === 0 ? '0' : formatRupeesDecimal(v)}</Text>
        ),
    },
    { key: 'debit', title: 'Debit account', width: 200, render: accountSelect },
    { key: 'igst', title: 'IGST', width: 150, render: gstSelect },
    { key: 'cgst', title: 'CGST', width: 150, render: gstSelect },
    { key: 'sgst', title: 'SGST', width: 150, render: gstSelect },
    { key: 'gstin', title: 'GSTIN', width: 160, render: () => textInput('Enter GSTIN') },
    { key: 'place', title: 'Place of supply', width: 180, render: placeSelect },
    { key: 'desc', title: 'Description', width: 160, render: textInput },
    { key: 'split', title: 'Split', width: 90, render: splitBtn },
    {
        key: 'mapping',
        title: 'Mapping',
        width: 140,
        render: () => <Text className="text-sm text-textBody">Needs mapping</Text>,
    },
    {
        key: 'status',
        title: 'Status',
        width: 130,
        dataIndex: 'status',
        render: (v: ExportStatus) => <ExportStatusTag status={v} />,
    },
];

const reimbColumns: ColumnsType<ReimbursementExportRow> = [
    {
        key: 'date',
        title: 'Date',
        dataIndex: 'date',
        width: 110,
        render: v => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'member',
        title: 'Member',
        dataIndex: 'member',
        width: 140,
        render: v => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'merchant',
        title: 'Merchant / Description',
        dataIndex: 'merchant',
        width: 180,
        render: (_, row) => (
            <Flex vertical gap={2}>
                <Text className="text-sm font-medium text-textHeadings">{row.merchant}</Text>
                <Text className="text-xs text-textBody">{row.description}</Text>
            </Flex>
        ),
    },
    {
        key: 'amount',
        title: 'Amount',
        dataIndex: 'amount',
        width: 110,
        render: v => <Text className="text-sm text-textHeadings">{formatRupeesDecimal(v)}</Text>,
    },
    { key: 'debit', title: 'Debit account', width: 200, render: accountSelect },
    { key: 'credit', title: 'Credit account', width: 200, render: accountSelect },
    { key: 'vendor', title: 'Vendor', width: 150, render: textInput },
    { key: 'igst', title: 'IGST', width: 150, render: gstSelect },
    { key: 'cgst', title: 'CGST', width: 150, render: gstSelect },
    { key: 'sgst', title: 'SGST', width: 150, render: gstSelect },
    { key: 'gstin', title: 'GSTIN', width: 160, render: () => textInput('Enter GSTIN') },
    { key: 'place', title: 'Place of supply', width: 180, render: placeSelect },
    { key: 'desc', title: 'Description', width: 160, render: textInput },
    { key: 'split', title: 'Split', width: 90, render: splitBtn },
    {
        key: 'mapping',
        title: 'Mapping',
        width: 140,
        render: () => <Text className="text-sm text-textBody">Needs mapping</Text>,
    },
    {
        key: 'status',
        title: 'Status',
        width: 130,
        dataIndex: 'status',
        render: (v: ExportStatus) => <ExportStatusTag status={v} />,
    },
];

const vendorColumns: ColumnsType<VendorInvoiceExportRow> = [
    {
        key: 'invoice',
        title: 'Invoice',
        dataIndex: 'invoice',
        width: 140,
        render: v => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'issued',
        title: 'Issued',
        dataIndex: 'issued',
        width: 130,
        render: v => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'due',
        title: 'Due',
        dataIndex: 'due',
        width: 130,
        render: v => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'amount',
        title: 'Amount',
        dataIndex: 'amount',
        width: 120,
        render: v => <Text className="text-sm text-textHeadings">{formatRupeesDecimal(v)}</Text>,
    },
    { key: 'debit', title: 'Debit account', width: 200, render: accountSelect },
    { key: 'vendor', title: 'Vendor', width: 150, render: textInput },
    { key: 'igst', title: 'IGST', width: 150, render: gstSelect },
    { key: 'cgst', title: 'CGST', width: 150, render: gstSelect },
    { key: 'sgst', title: 'SGST', width: 150, render: gstSelect },
    { key: 'gstin', title: 'GSTIN', width: 160, render: () => textInput('Enter GSTIN') },
    { key: 'place', title: 'Place of supply', width: 180, render: placeSelect },
    { key: 'desc', title: 'Description', width: 120, render: textInput },
    { key: 'split', title: 'Split', width: 80, render: splitBtn },
    {
        key: 'mapping',
        title: 'Mapping',
        width: 120,
        render: () => <Text className="text-sm text-textBody">Needs mapping</Text>,
    },
    {
        key: 'status',
        title: 'Status',
        width: 110,
        dataIndex: 'status',
        render: (v: ExportStatus) => <ExportStatusTag status={v} />,
    },
];

const walletColumns: ColumnsType<WalletTopupRow> = [
    {
        key: 'date',
        title: 'Date',
        dataIndex: 'date',
        width: 110,
        render: v => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'reference',
        title: 'Reference',
        dataIndex: 'reference',
        width: 150,
        render: v => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'amount',
        title: 'Amount',
        dataIndex: 'amount',
        width: 110,
        render: v => <Text className="text-sm text-textHeadings">{formatRupeesDecimal(v)}</Text>,
    },
    { key: 'debit', title: 'Debit account', width: 160, render: accountSelect },
    {
        key: 'source',
        title: 'Source',
        dataIndex: 'source',
        width: 200,
        render: (v: string) => (
            <Flex vertical gap={4}>
                <Text className="text-xs font-medium text-textBody">{v}</Text>
                {accountSelect()}
            </Flex>
        ),
    },
    {
        key: 'mapping',
        title: 'Mapping',
        width: 120,
        render: () => <Text className="text-sm text-textBody">Needs mapping</Text>,
    },
    {
        key: 'status',
        title: 'Status',
        width: 110,
        dataIndex: 'status',
        render: (v: ExportStatus) => <ExportStatusTag status={v} />,
    },
];

const QuickBooksCard = ({ selectedCount }: { selectedCount: number }) => (
    <Flex
        align="center"
        justify="space-between"
        className="rounded-2xl border border-borderCard px-6 py-4"
        style={{ backgroundColor: '#F8FAFC' }}
    >
        <Flex align="center" gap={12}>
            <img
                src={quickbooksImg}
                alt="QuickBooks"
                className="h-12 w-12 rounded-full object-contain"
            />
            <Flex vertical gap={2}>
                <Flex align="center" gap={8}>
                    <Text className="font-semibold text-textHeadings">QuickBooks Online</Text>
                    <Tag
                        bordered={false}
                        className="m-0 rounded-full bg-savingsTagLightBg px-2 py-0.5 text-xs font-medium text-savingsTagLightText"
                    >
                        Connected
                    </Tag>
                </Flex>
                <Text className="text-sm text-textBody">17 accounts • Last synced 26 mins ago</Text>
            </Flex>
        </Flex>
        <Flex gap={8}>
            <Button danger icon={<SyncOutlined />}>
                Sync chart
            </Button>
            <Button
                type="primary"
                icon={
                    <img
                        src={exportIcon}
                        alt="export"
                        className="h-4 w-4"
                        style={{ filter: 'brightness(0) invert(1)' }}
                    />
                }
            >
                Export selected ({selectedCount})
            </Button>
        </Flex>
    </Flex>
);

const AccountingExport = () => {
    const [tab, setTab] = useState<Tab>('card-transactions');
    const [search, setSearch] = useState('');
    const [dateRange, setDateRange] = useState<DateRange>([dayjs().subtract(1, 'month'), dayjs()]);
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

    const alert = ALERTS[tab];

    const filterBar = (searchLabel: string, extraFilters?: React.ReactNode) => (
        <Flex
            className="rounded-2xl border border-borderCard bg-white p-5"
            align="end"
            justify="space-between"
            wrap="wrap"
            gap={16}
        >
            <Flex align="end" wrap="wrap" gap={16}>
                <Flex vertical gap={6}>
                    <Text className="text-sm text-textBody">Date</Text>
                    <RangePicker
                        value={dateRange}
                        disabledDate={current => current > dayjs().endOf('day')}
                        onChange={val => setDateRange(val as DateRange)}
                        className="w-56"
                    />
                </Flex>
                {extraFilters}
                <Flex vertical gap={6}>
                    <Text className="text-sm text-textBody">{searchLabel}</Text>
                    <Input
                        placeholder="Search"
                        prefix={<SearchOutlined className="text-textGreyLight" />}
                        value={search}
                        onChange={e => setSearch(stripEmojis(e.target.value))}
                        className="w-64"
                    />
                </Flex>
            </Flex>
            <Button
                type="text"
                icon={<CloseCircleOutlined />}
                onClick={() => {
                    setSearch('');
                    setDateRange([dayjs().subtract(1, 'month'), dayjs()]);
                }}
                className="text-textBody"
            >
                Clear
            </Button>
        </Flex>
    );

    const cardholderFilter = (
        <>
            <Flex vertical gap={6}>
                <Text className="text-sm text-textBody">Cardholder</Text>
                <Select placeholder="Select Cardholder" className="w-44" options={[]} />
            </Flex>
            <Flex vertical gap={6}>
                <Text className="text-sm text-textBody">Status</Text>
                <Select
                    placeholder="Select Status"
                    className="w-40"
                    options={[
                        { value: 'Unexported', label: 'Unexported' },
                        { value: 'Exported', label: 'Exported' },
                    ]}
                />
            </Flex>
        </>
    );

    const statusFilter = (
        <Flex vertical gap={6}>
            <Text className="text-sm text-textBody">Status</Text>
            <Select
                placeholder="Select Status"
                className="w-40"
                options={[
                    { value: 'Unexported', label: 'Unexported' },
                    { value: 'Exported', label: 'Exported' },
                ]}
            />
        </Flex>
    );

    const tableProps = {
        rowSelection: {
            selectedRowKeys: selectedKeys,
            onChange: (keys: React.Key[]) => setSelectedKeys(keys as string[]),
        },
    };

    return (
        <Flex vertical gap={24}>
            <Flex className="mt-3" align="flex-start" justify="space-between">
                <Flex vertical gap={4}>
                    <Title level={3} className="!mb-0 !text-textHeadings">
                        Accounting Export
                    </Title>
                    <Text className="text-sm text-textBody">
                        Map and push transactions to QuickBooks Online.
                    </Text>
                </Flex>
                <Button danger icon={<img src={exportIcon} alt="export" className="h-4 w-4" />}>
                    Download history
                </Button>
            </Flex>

            <PageTabs
                tabs={TABS}
                activeKey={tab}
                onChange={k => {
                    setTab(k as Tab);
                    setSelectedKeys([]);
                    setSearch('');
                }}
            />

            {alert && (
                <Alert
                    type="warning"
                    showIcon
                    message={
                        <Text className="text-sm" style={{ color: '#FCD34D' }}>
                            {alert}
                        </Text>
                    }
                    className="rounded-xl"
                    style={{ borderColor: '#FCD34D', color: '#FCD34D' }}
                />
            )}

            <QuickBooksCard selectedCount={selectedKeys.length} />

            {tab === 'card-transactions' && filterBar('Merchant', cardholderFilter)}
            {tab === 'reimbursements' && filterBar('Merchant', cardholderFilter)}
            {tab === 'vendor-invoices' && filterBar('Vendor / Invoice', statusFilter)}
            {tab === 'wallet-topups' && filterBar('Reference / Source', statusFilter)}

            {tab === 'card-transactions' && (
                <Flex
                    align="center"
                    gap={8}
                    className="rounded-xl border border-borderCard px-4 py-3"
                    style={{ backgroundColor: '#F8FAFC' }}
                >
                    <InfoCircleOutlined className="text-textGreyLight" style={{ fontSize: 14 }} />
                    <Text className="text-sm text-textBody">
                        Card fees (₹273.42 total) are auto-mapped to 5090 · Bank & Card Fees. You
                        only map the amount paid to the vendor below. Change the default in{' '}
                        <Text className="text-sm font-medium text-textBody">
                            Settings → Integrations
                        </Text>
                        .
                    </Text>
                </Flex>
            )}

            {tab === 'card-transactions' && (
                <GenericTable
                    {...tableProps}
                    columns={cardTxnColumns}
                    dataSource={CARD_TXN_ROWS}
                    rowKey="key"
                />
            )}
            {tab === 'reimbursements' && (
                <GenericTable
                    {...tableProps}
                    columns={reimbColumns}
                    dataSource={REIMBURSEMENT_EXPORT_ROWS}
                    rowKey="key"
                />
            )}
            {tab === 'vendor-invoices' && (
                <GenericTable
                    {...tableProps}
                    columns={vendorColumns}
                    dataSource={VENDOR_INVOICE_EXPORT_ROWS}
                    rowKey="key"
                />
            )}
            {tab === 'wallet-topups' && (
                <GenericTable
                    {...tableProps}
                    columns={walletColumns}
                    dataSource={WALLET_TOPUP_ROWS}
                    rowKey="key"
                />
            )}
        </Flex>
    );
};

export default AccountingExport;
