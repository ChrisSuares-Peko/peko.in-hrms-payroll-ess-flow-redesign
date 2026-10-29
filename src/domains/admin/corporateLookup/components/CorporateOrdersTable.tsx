import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Card, Flex, Input, Pagination, Table, Tag, Tooltip, Typography } from 'antd';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import TransactionDetailsDrawer from './TransactionDetailsDrawer';
import useCorporateOrders from '../hooks/useCorporateOrders';

type Props = {
    corporateId: string | number | undefined;
};

const statusColors: Record<string, string> = {
    SUCCESS: 'success',
    FAILED: 'error',
    FAILURE: 'error',
    PENDING: 'warning',
};

const isFailedStatus = (status: string | undefined | null) =>
    ['FAILED', 'FAILURE'].includes(status?.trim().toUpperCase() ?? '');

const columns = [
    {
        title: 'Transaction Date',
        dataIndex: 'transactionDate',
        key: 'transactionDate',
        sorter: true,
        render: (date: string) => (
            <Flex vertical>
                <Typography.Text>{formattedDateOnly(new Date(date))}</Typography.Text>
                <Typography.Text type="secondary">{formattedTime(new Date(date))}</Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Transaction ID',
        dataIndex: 'corporateTxnId',
        key: 'corporateTxnId',
        sorter: true,
    },
    {
        title: 'Category',
        key: 'category',
        dataIndex: ['serviceOperator', 'serviceCategory'],
        render: (_: any, record: any) => (
            <Typography.Text>
                {(record.serviceOperator as any)?.serviceCategory ?? '-'}
            </Typography.Text>
        ),
    },
    {
        title: 'Service Provider',
        key: 'serviceProvider',
        dataIndex: ['serviceOperator', 'serviceProvider'],
        render: (_: any, record: any) => (
            <Typography.Text>{record.serviceOperator?.serviceProvider ?? '-'}</Typography.Text>
        ),
    },
    {
        title: 'Amount',
        key: 'amount',
        dataIndex: ['order', 'amountInINR'],
        render: (_: any, record: any) => (
            <Typography.Text>
                ₹ {formatNumberWithLocalString(Number(record.order?.amountInINR ?? 0))}
            </Typography.Text>
        ),
    },
    {
        title: 'Cashback',
        key: 'corporateCashback',
        sorter: true,
        dataIndex: 'corporateCashback',
        render: (value: string) => (
            <Typography.Text>₹ {formatNumberWithLocalString(Number(value ?? 0))}</Typography.Text>
        ),
    },
    {
        title: 'Status',
        key: 'status',
        dataIndex: ['order', 'status'],
        render: (_: any, record: any) => {
            const status = record.order?.status ?? 'Pending';
            const color = statusColors[status.toUpperCase()] ?? 'default';
            const tag = (
                <Tag color={color} className="rounded-[12px] px-[10px] py-[2px]">
                    {status}
                </Tag>
            );
            return isFailedStatus(status) ? (
                <Tooltip title="Click to view failure details">{tag}</Tooltip>
            ) : (
                tag
            );
        },
    },
];

const CorporateOrdersTable: React.FC<Props> = ({ corporateId }) => {
    const {
        isLoading,
        tableData,
        count,
        page,
        searchText,
        handlePageChange,
        handleTableChange,
        handleSearchChange,
    } = useCorporateOrders(corporateId);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);

    const handleRowClick = (record: any) => {
        if (isFailedStatus(record.order?.status)) {
            setSelectedTransactionId(Number(record.id));
            setDrawerOpen(true);
        }
    };

    return (
        <>
            <Card
                className="rounded-2xl border-[#f0f0f0] shadow-none"
                styles={{ body: { padding: '24px' } }}
            >
                <Flex justify="space-between" align="center" className="pb-4 flex-wrap gap-3">
                    <Typography.Title level={5} className="!m-0 font-semibold">
                        Transactions
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
                    loading={isLoading}
                    onChange={handleTableChange}
                    className="bg-[#fafafa] rounded-lg mt-3"
                    scroll={{ x: 'max-content' }}
                    onRow={record => {
                        const isFailed = isFailedStatus(record.order?.status);
                        return {
                            onClick: () => handleRowClick(record),
                            style: {
                                cursor: isFailed ? 'pointer' : 'default',
                                backgroundColor: isFailed ? '#fef2f2' : undefined,
                            },
                            onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
                                if (isFailed)
                                    (e.currentTarget as HTMLElement).style.backgroundColor =
                                        '#fee2e2';
                            },
                            onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
                                if (isFailed)
                                    (e.currentTarget as HTMLElement).style.backgroundColor =
                                        '#fef2f2';
                            },
                        };
                    }}
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

            <TransactionDetailsDrawer
                open={drawerOpen}
                transactionId={selectedTransactionId}
                onClose={() => setDrawerOpen(false)}
            />
        </>
    );
};

export default CorporateOrdersTable;
