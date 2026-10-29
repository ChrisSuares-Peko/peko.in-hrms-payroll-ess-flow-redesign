import { useMemo, useState } from 'react';

import { CloseCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input, Select, Typography } from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import dayjs, { Dayjs } from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';

import moneyTickIcon from '../../assets/icons/money-tick.svg';
import moneyInIcon from '../../assets/icons/moneyIn.svg';
import moneytimeIcon from '../../assets/icons/moneytime.svg';
import { formatRupeesDecimal, stripEmojis } from '../../utils/helpers';
import { VENDOR_INVOICES, VendorInvoiceRow } from '../../utils/vendorInvoicesData';
import StatCard from '../common/StatCard';
import StatusTag from '../common/StatusTag';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type DateRange = [Dayjs | null, Dayjs | null] | null;

const STAT_CARDS = [
    {
        stat: {
            key: 'pending',
            icon: 'clock' as const,
            svgIcon: moneytimeIcon,
            label: 'Pending approval',
            value: '3',
            caption: '₹60,700.00 total',
            tone: 'rose' as const,
        },
    },
    {
        stat: {
            key: 'approved',
            icon: 'reimbursement' as const,
            svgIcon: moneyTickIcon,
            label: 'Approved',
            value: '2',
            caption: '₹60,700.00 total',
            tone: 'mint' as const,
        },
    },
    {
        stat: {
            key: 'rejected',
            icon: 'card' as const,
            svgIcon: moneyInIcon,
            label: 'Rejected',
            value: '4',
            caption: '₹60,700.00 total',
            tone: 'lavender' as const,
        },
    },
];

const COUNTRY_OPTIONS = [
    { value: 'India', label: 'India' },
    { value: 'USA', label: 'USA' },
    { value: 'UK', label: 'UK' },
];

const MEMBERS = ['Tony Stark', 'Bruce Wayne', 'Reed Richards', 'Lex Luthor', 'Tony Stark'];

const dataSource = VENDOR_INVOICES.map((row, i) => ({
    ...row,
    country: 'India',
    uploadedBy: MEMBERS[i] ?? 'Tony Stark',
}));

type DataRow = (typeof dataSource)[number];

const columns: ColumnsType<DataRow> = [
    {
        key: 'invoice',
        title: 'Invoice',
        dataIndex: 'invoice',
        width: 140,
        render: (v: string) => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'vendor',
        title: 'Vendor',
        dataIndex: 'vendor',
        width: 160,
        render: (v: string) => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'country',
        title: 'Country',
        dataIndex: 'country',
        width: 100,
        render: (v: string) => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'date',
        title: 'Issued',
        dataIndex: 'date',
        width: 120,
        render: (v: string) => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'due',
        title: 'Due',
        dataIndex: 'due',
        width: 120,
        render: (v: string) => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'uploadedBy',
        title: 'Uploaded by',
        dataIndex: 'uploadedBy',
        width: 140,
        render: (v: string) => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'amount',
        title: 'Amount',
        dataIndex: 'amount',
        width: 140,
        render: (v: number) => (
            <Text className="whitespace-nowrap text-sm text-textHeadings">
                {formatRupeesDecimal(v)}
            </Text>
        ),
    },
    {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        width: 140,
        render: (v: VendorInvoiceRow['status']) => <StatusTag status={v} />,
    },
];

const AdminVendorInvoicesSection = () => {
    const [dateRange, setDateRange] = useState<DateRange>([dayjs().subtract(1, 'month'), dayjs()]);
    const [search, setSearch] = useState('');
    const [country, setCountry] = useState<string | undefined>();

    const filtered = useMemo(
        () =>
            dataSource.filter(row => {
                if (search && !row.vendor.toLowerCase().includes(search.toLowerCase()))
                    return false;
                if (country && row.country !== country) return false;
                if (dateRange?.[0] && dateRange?.[1]) {
                    const d = dayjs(row.date);
                    if (d.isBefore(dateRange[0], 'day') || d.isAfter(dateRange[1], 'day'))
                        return false;
                }
                return true;
            }),
        [search, country, dateRange]
    );

    return (
        <Flex vertical gap={24}>
            <Flex vertical gap={4}>
                <Title level={3} className="!mb-0 !text-textHeadings">
                    Vendor Invoices
                </Title>
                <Text className="text-sm text-textBody">
                    Unpaid vendor invoices uploaded by members. Approvals are handled in Approval
                    Requests.
                </Text>
            </Flex>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {STAT_CARDS.map(({ stat }) => (
                    <StatCard key={stat.key} stat={stat} />
                ))}
            </div>

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
                    <Flex vertical gap={6}>
                        <Text className="text-sm text-textBody">Cardholder</Text>
                        <Select placeholder="Select Cardholder" className="w-44" options={[]} />
                    </Flex>
                    <Flex vertical gap={6}>
                        <Text className="text-sm text-textBody">Country</Text>
                        <Select
                            placeholder="Select Country"
                            className="w-40"
                            options={COUNTRY_OPTIONS}
                            value={country}
                            onChange={setCountry}
                        />
                    </Flex>
                    <Flex vertical gap={6}>
                        <Text className="text-sm text-textBody">Merchant</Text>
                        <Input
                            placeholder="Search"
                            prefix={<SearchOutlined className="text-textGreyLight" />}
                            value={search}
                            onChange={e => setSearch(stripEmojis(e.target.value))}
                            className="w-56"
                        />
                    </Flex>
                </Flex>
                <Button
                    type="text"
                    icon={<CloseCircleOutlined />}
                    onClick={() => {
                        setSearch('');
                        setDateRange([dayjs().subtract(1, 'month'), dayjs()]);
                        setCountry(undefined);
                    }}
                    className="text-textBody"
                >
                    Clear
                </Button>
            </Flex>

            <GenericTable columns={columns} dataSource={filtered} rowKey="key" />
        </Flex>
    );
};

export default AdminVendorInvoicesSection;
