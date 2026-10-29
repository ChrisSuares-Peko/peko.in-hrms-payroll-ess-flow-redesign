import { useMemo, useState } from 'react';

import { CloseCircleOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input, Typography } from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import dayjs, { Dayjs } from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';

import UploadInvoiceModal from './UploadInvoiceModal';
import { formatRupeesDecimal, stripEmojis } from '../../../utils/helpers';
import { VENDOR_INVOICES, VendorInvoiceRow } from '../../../utils/vendorInvoicesData';
import StatusTag from '../../common/StatusTag';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type DateRange = [Dayjs | null, Dayjs | null] | null;

const VendorInvoicesSection = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange>([dayjs().subtract(1, 'month'), dayjs()]);
    const [search, setSearch] = useState('');

    const filtered = useMemo(
        () =>
            VENDOR_INVOICES.filter(row => {
                if (
                    search &&
                    !row.vendor.toLowerCase().includes(search.toLowerCase()) &&
                    !row.invoice.toLowerCase().includes(search.toLowerCase())
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

    const columns: ColumnsType<VendorInvoiceRow> = [
        {
            key: 'date',
            title: 'Date',
            dataIndex: 'date',
            width: 130,
            render: (v: string) => <Text className="text-sm text-textBody">{v}</Text>,
        },
        {
            key: 'invoice',
            title: 'Invoice',
            dataIndex: 'invoice',
            width: 160,
            render: (v: string) => <Text className="text-sm text-textBody">{v}</Text>,
        },
        {
            key: 'vendor',
            title: 'Vendor',
            dataIndex: 'vendor',
            width: 200,
            render: (v: string) => <Text className="text-sm text-textHeadings">{v}</Text>,
        },
        {
            key: 'due',
            title: 'Due',
            dataIndex: 'due',
            width: 130,
            render: (v: string) => <Text className="text-sm text-textBody">{v}</Text>,
        },
        {
            key: 'amount',
            title: 'Amount',
            dataIndex: 'amount',
            width: 130,
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
            width: 120,
            render: (v: VendorInvoiceRow['status']) => <StatusTag status={v} />,
        },
    ];

    return (
        <Flex vertical gap={24}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <Flex vertical gap={4}>
                    <Title level={3} className="!mb-0 !text-textHeadings">
                        Vendor invoices
                    </Title>
                    <Text className="text-sm text-textBody">
                        Upload vendor invoices for approval and payment.
                    </Text>
                </Flex>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                    Upload invoice
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

            <UploadInvoiceModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </Flex>
    );
};

export default VendorInvoicesSection;
