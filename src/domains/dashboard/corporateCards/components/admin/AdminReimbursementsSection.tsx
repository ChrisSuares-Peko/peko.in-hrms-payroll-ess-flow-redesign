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
import { REIMBURSEMENTS, ReimbursementRow } from '../../utils/reimbursementsData';
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

const columns: ColumnsType<ReimbursementRow & { member: string; country: string }> = [
    {
        key: 'date',
        title: 'Date',
        dataIndex: 'date',
        width: 120,
        render: (v: string) => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'member',
        title: 'Member',
        dataIndex: 'member',
        width: 140,
        render: (v: string) => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'merchant',
        title: 'Merchant / Description',
        dataIndex: 'merchant',
        width: 200,
        render: (_: string, row: any) => (
            <Flex vertical gap={2}>
                <Text className="text-sm font-medium text-textHeadings">{row.merchant}</Text>
                <Text className="text-xs text-textBody">{row.description}</Text>
            </Flex>
        ),
    },
    {
        key: 'country',
        title: 'Country',
        dataIndex: 'country',
        width: 100,
        render: (v: string) => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'category',
        title: 'Category',
        dataIndex: 'category',
        width: 130,
        render: (v: string) => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'receipt',
        title: 'Receipt',
        dataIndex: 'receipt',
        width: 100,
        render: (v: boolean) => (
            <Text className="text-sm text-textBody">{v ? 'Attached' : 'Missing'}</Text>
        ),
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
        render: (v: ReimbursementRow['status']) => <StatusTag status={v} />,
    },
];

const MEMBERS = ['Tony Stark', 'Bruce Wayne', 'Reed Richards', 'Lex Luthor', 'Tony Stark'];

const dataSource = REIMBURSEMENTS.map((row, i) => ({
    ...row,
    member: MEMBERS[i] ?? 'Tony Stark',
    country: 'India',
}));

const AdminReimbursementsSection = () => {
    const [dateRange, setDateRange] = useState<DateRange>([dayjs().subtract(1, 'month'), dayjs()]);
    const [search, setSearch] = useState('');
    const [country, setCountry] = useState<string | undefined>();

    const filtered = useMemo(
        () =>
            dataSource.filter(row => {
                if (search && !row.merchant.toLowerCase().includes(search.toLowerCase()))
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
                    Reimbursements
                </Title>
                <Text className="text-sm text-textBody">
                    Reimbursement claims uploaded by members. Approvals are handled in Approval
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

export default AdminReimbursementsSection;
