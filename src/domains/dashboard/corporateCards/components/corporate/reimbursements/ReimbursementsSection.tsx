import { useMemo, useState } from 'react';

import { CloseCircleOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input, Typography } from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import dayjs, { Dayjs } from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';

import SubmitReimbursementModal from './SubmitReimbursementModal';
import { formatRupeesDecimal, stripEmojis } from '../../../utils/helpers';
import { REIMBURSEMENTS, ReimbursementRow } from '../../../utils/reimbursementsData';
import StatusTag from '../../common/StatusTag';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type DateRange = [Dayjs | null, Dayjs | null] | null;

const ReimbursementsSection = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange>([dayjs().subtract(1, 'month'), dayjs()]);
    const [search, setSearch] = useState('');

    const filtered = useMemo(
        () =>
            REIMBURSEMENTS.filter(row => {
                if (
                    search &&
                    !row.merchant.toLowerCase().includes(search.toLowerCase()) &&
                    !row.description.toLowerCase().includes(search.toLowerCase())
                ) {
                    return false;
                }
                if (dateRange?.[0] && dateRange?.[1]) {
                    const d = dayjs(row.date);
                    if (d.isBefore(dateRange[0], 'day') || d.isAfter(dateRange[1], 'day'))
                        return false;
                }
                return true;
            }),
        [search, dateRange]
    );

    const columns: ColumnsType<ReimbursementRow> = [
        {
            key: 'date',
            title: 'Date',
            dataIndex: 'date',
            width: 140,
            render: (v: string) => <Text className="text-sm text-textBody">{v}</Text>,
        },
        {
            key: 'merchant',
            title: 'Merchant / Description',
            dataIndex: 'merchant',
            render: (_: string, row: ReimbursementRow) => (
                <Flex vertical gap={2}>
                    <Text className="text-sm font-medium text-textHeadings">{row.merchant}</Text>
                    <Text className="text-xs text-textBody">{row.description}</Text>
                </Flex>
            ),
        },
        {
            key: 'category',
            title: 'Category',
            dataIndex: 'category',
            render: (v: string) => <Text className="text-sm text-textLightRed">{v}</Text>,
        },
        {
            key: 'receipt',
            title: 'Receipt',
            dataIndex: 'receipt',
            render: (v: boolean) => (
                <Text className="text-sm text-textBody">{v ? 'Yes' : 'No'}</Text>
            ),
        },
        {
            key: 'status',
            title: 'Status',
            dataIndex: 'status',
            render: (v: ReimbursementRow['status']) => <StatusTag status={v} />,
        },
        {
            key: 'amount',
            title: 'Amount',
            dataIndex: 'amount',
            render: (v: number) => (
                <Text className="whitespace-nowrap text-sm text-textHeadings">
                    {formatRupeesDecimal(v)}
                </Text>
            ),
        },
    ];

    return (
        <Flex vertical gap={24}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <Title level={3} className="!mb-0 !text-textHeadings">
                    Reimbursements
                </Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                    Submit expense
                </Button>
            </div>

            <div className="rounded-2xl border border-borderCard bg-white p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                        <Flex vertical gap={6}>
                            <Text className="text-sm text-textBody">Date</Text>
                            <RangePicker
                                value={dateRange}
                                disabledDate={current => current > dayjs().endOf('day')}
                                onChange={val => setDateRange(val as DateRange)}
                                className="w-full"
                            />
                        </Flex>
                        <Flex vertical gap={6}>
                            <Text className="text-sm text-textBody">Search</Text>
                            <Input
                                placeholder="Search"
                                prefix={<SearchOutlined className="text-textGreyLight" />}
                                value={search}
                                onChange={e => setSearch(stripEmojis(e.target.value))}
                                className="w-full"
                            />
                        </Flex>
                    </div>
                    <Button
                        type="text"
                        icon={<CloseCircleOutlined />}
                        onClick={() => {
                            setSearch('');
                            setDateRange([dayjs().subtract(1, 'month'), dayjs()]);
                        }}
                        className="self-end text-textBody"
                    >
                        Clear
                    </Button>
                </div>
            </div>

            <GenericTable columns={columns} dataSource={filtered} rowKey="key" />

            <SubmitReimbursementModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </Flex>
    );
};

export default ReimbursementsSection;
