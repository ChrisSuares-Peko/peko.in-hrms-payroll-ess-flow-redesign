import React from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Card, Flex, Input, Pagination, Table, Typography } from 'antd';

import { Subscription } from '@src/domains/admin/reports/types/pekoSubscription';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

type Props = {
    isLoading: boolean;
    tableData: Subscription[];
    count: number;
    page: number;
    searchText: string;
    handlePageChange: (page: number) => void;
    handleTableChange: (pagination: any, filters: any, sorter: any) => void;
    handleSearchChange: (val: string) => void;
};

const statusColor = (status: string) => {
    if (status === 'ACTIVE')
        return <Typography.Text className="font-normal text-textGreen">{status}</Typography.Text>;
    if (status === 'UPGRADED')
        return <Typography.Text className="font-normal text-blue-500">{status}</Typography.Text>;
    if (status === 'DUE')
        return <Typography.Text className="font-normal text-orange-300">{status}</Typography.Text>;
    return <Typography.Text className="font-normal text-textRed">{status}</Typography.Text>;
};

const columns = [
    {
        title: 'Transaction Date',
        dataIndex: 'createdAt',
        sorter: true,
        key: 'createdAt',
        render: (date: string) => (
            <Flex vertical>
                <Typography.Text>{formattedDateOnly(new Date(date))}</Typography.Text>
                <Typography.Text>{formattedTime(new Date(date))}</Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Transaction ID',
        dataIndex: 'subscriptionPaymentRefId',
        sorter: true,
        key: 'subscriptionPaymentRefId',
        render: (val: string) => <Typography.Text>{val ?? '-'}</Typography.Text>,
    },
    {
        title: 'Package',
        dataIndex: 'packageName',
        sorter: true,
        key: 'packageName',
        render: (val: string) => <Typography.Text>{val ?? '-'}</Typography.Text>,
    },
    {
        title: 'Start Date',
        dataIndex: 'subscriptionStartDate',
        sorter: true,
        key: 'subscriptionStartDate',
        render: (val: string) => (
            <Typography.Text>{val ? formattedDateOnly(new Date(val)) : '-'}</Typography.Text>
        ),
    },
    {
        title: 'End Date',
        dataIndex: 'subscriptionEndDate',
        sorter: true,
        key: 'subscriptionEndDate',
        render: (val: string) => (
            <Typography.Text>{val ? formattedDateOnly(new Date(val)) : '-'}</Typography.Text>
        ),
    },
    {
        title: 'Actual Price',
        dataIndex: 'subscriptionPrice',
        sorter: true,
        key: 'subscriptionPrice',
        render: (val: string) => (
            <Typography.Text>₹ {formatNumberWithLocalString(val)}</Typography.Text>
        ),
    },
    {
        title: 'Discount',
        dataIndex: 'discount',
        sorter: true,
        key: 'discount',
        render: (val: string) => (
            <Typography.Text>₹ {formatNumberWithLocalString(val)}</Typography.Text>
        ),
    },
    {
        title: 'Payment Mode',
        dataIndex: 'paymentMode',
        key: 'paymentMode',
    },
    {
        title: 'Paid Amount',
        dataIndex: 'subscriptionAmountPaid',
        sorter: true,
        key: 'subscriptionAmountPaid',
        render: (val: any) => (
            <Typography.Text>₹ {formatNumberWithLocalString(val)}</Typography.Text>
        ),
    },
    {
        title: 'Voucher Code',
        dataIndex: 'voucherCode',
        key: 'voucherCode',
        render: (val: string) => <Typography.Text>{val || 'N/A'}</Typography.Text>,
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (val: string) => statusColor(val),
    },
];

const CorporateSubscriptionsTable: React.FC<Props> = ({
    isLoading,
    tableData,
    count,
    page,
    searchText,
    handlePageChange,
    handleTableChange,
    handleSearchChange,
}) => (
    <Card
        className="rounded-2xl border-[#f0f0f0] shadow-none"
        styles={{ body: { padding: '24px' } }}
    >
        <Flex justify="space-between" align="center" className="pb-4 flex-wrap gap-3">
            <Typography.Title level={5} className="!m-0 font-semibold">
                Subscriptions
            </Typography.Title>
            <Input
                value={searchText}
                placeholder="Search"
                suffix={<SearchOutlined />}
                onChange={e => handleSearchChange(e.target.value)}
                allowClear
                className="w-52"
                maxLength={100}
            />
        </Flex>
        <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            loading={isLoading}
            onChange={handleTableChange}
            className="bg-[#fafafa] rounded-lg mt-3"
        />
        <Pagination
            current={page}
            size="default"
            className="text-end pt-5"
            onChange={handlePageChange}
            total={count}
            showSizeChanger={false}
        />
    </Card>
);

export default CorporateSubscriptionsTable;
