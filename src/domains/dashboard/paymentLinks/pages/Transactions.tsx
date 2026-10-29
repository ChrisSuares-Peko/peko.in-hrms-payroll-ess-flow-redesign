import { ExportOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Pagination, Select, Spin, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import useGetTransactions from '../hooks/useGetTransactions';
import { TransactionRecord } from '../types/paymentLinkTypes';

const statusMap: Record<string, string> = {
    SUCCESS: 'Successful',
    PENDING: 'Pending',
    FAILED: 'Failed',
};

const statusConfig: Record<string, { textColor: string; bg: string }> = {
    Successful: { textColor: '#16A34A', bg: '#F0FDF4' },
    Pending:    { textColor: '#D97706', bg: '#FFFBEB' },
    Failed:     { textColor: '#DC2626', bg: '#FEF2F2' },
};

const formatAmount = (amount: number) =>
    `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const columns: ColumnsType<TransactionRecord> = [
    {
        title: 'Date & Time',
        dataIndex: 'dateTime',
        key: 'dateTime',
        width: 200,
        render: val => (
            <Typography.Text className="text-gray-500 text-sm">
                {dayjs(val).format('MMMM D, YYYY [at] h:mm A')}
            </Typography.Text>
        ),
    },
    {
        title: 'Transaction ID',
        dataIndex: 'transactionId',
        key: 'transactionId',
        width: 120,
        render: val => <Typography.Text className="text-sm font-medium">{val || '—'}</Typography.Text>,
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        width: 100,
        render: val => <Typography.Text className="text-sm font-medium">{formatAmount(val)}</Typography.Text>,
    },
    {
        title: 'Customer',
        dataIndex: 'customerName',
        key: 'customerName',
        width: 130,
        render: val => <Typography.Text className="text-sm">{val || 'N/A'}</Typography.Text>,
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (val: string) => {
            const label = statusMap[val] ?? val;
            const cfg = statusConfig[label] ?? { textColor: '#374151', bg: '#F3F4F6' };
            return (
                <Tag
                    style={{
                        color: cfg.textColor,
                        background: cfg.bg,
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 500,
                        fontSize: 12,
                    }}
                >
                    {label}
                </Tag>
            );
        },
    },
    {
        title: 'Payment Method',
        dataIndex: 'source',
        key: 'source',
        width: 130,
        render: (val: string) => {
            const label = val === 'payment_qr' ? 'QR Code' : 'Payment Link';
            const cfg = val === 'payment_qr'
                ? { textColor: '#7C3AED', bg: '#F5F3FF' }
                : { textColor: '#1D4ED8', bg: '#EFF6FF' };
            return (
                <Tag
                    style={{
                        color: cfg.textColor,
                        background: cfg.bg,
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 500,
                        fontSize: 12,
                    }}
                >
                    {label}
                </Tag>
            );
        },
    },
    {
        title: 'Reference',
        dataIndex: 'reference',
        key: 'reference',
        width: 100,
        render: val => <Typography.Text className="text-sm">{val || '—'}</Typography.Text>,
    },
    {
        title: 'Actions',
        key: 'actions',
        fixed: 'right' as const,
        width: 80,
        render: () => (
            <Button size="small" className="text-xs">
                View
            </Button>
        ),
    },
];

const Transactions = () => {
    const navigate = useNavigate();
    const {
        isLoading,
        isExporting,
        transactions,
        total,
        page,
        setPage,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        paymentMethodFilter,
        setPaymentMethodFilter,
        exportTransactions,
    } = useGetTransactions();

    return (
        <Flex vertical gap={20} className="p-4 md:p-6">

            {/* Title */}
            <Flex vertical gap={4}>
                <Typography.Title level={3} className="!mb-0 !font-bold">
                    Transactions
                </Typography.Title>
                <Typography.Text className="text-gray-500">
                    View and manage all your payment transactions
                </Typography.Text>
            </Flex>

            {/* Filters + Export */}
            <Flex gap={12} align="center" wrap="wrap">
                <Input
                    size="large"
                    placeholder="Search by transaction ID or customer"
                    prefix={<SearchOutlined className="text-gray-400" />}
                    className="w-full sm:flex-1"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    allowClear
                />
                <Flex gap={12} wrap="wrap" className="w-full sm:w-auto">
                    <Select
                        size="large"
                        value={statusFilter || 'all_status'}
                        className="flex-1 sm:w-36"
                        onChange={val => { setStatusFilter(val === 'all_status' ? '' : val); setPage(1); }}
                        options={[
                            { value: 'all_status', label: 'All Status' },
                            { value: 'SUCCESS', label: 'Successful' },
                            { value: 'PENDING', label: 'Pending' },
                            { value: 'FAILED', label: 'Failed' },
                        ]}
                    />
                    <Select
                        size="large"
                        value={paymentMethodFilter || 'all_methods'}
                        className="flex-1 sm:w-40"
                        onChange={val => { setPaymentMethodFilter(val === 'all_methods' ? '' : val); setPage(1); }}
                        options={[
                            { value: 'all_methods', label: 'All Methods' },
                            { value: 'Payment Link', label: 'Payment Link' },
                            { value: 'QR Code', label: 'QR Code' },
                        ]}
                    />
                    <Button
                        size="large"
                        icon={<ExportOutlined />}
                        className="w-full sm:w-auto"
                        onClick={exportTransactions}
                        loading={isExporting}
                    >
                        Export
                    </Button>
                </Flex>
            </Flex>

            {/* Table */}
            <Spin spinning={isLoading}>
                <div className="overflow-x-auto">
                    <Table
                        columns={columns}
                        dataSource={transactions}
                        pagination={false}
                        className="rounded-xl"
                        scroll={{ x: 'max-content' }}
                        rowClassName="hover:bg-gray-50 cursor-pointer"
                        onRow={record => ({
                            onClick: () => navigate(`transaction-details`, { state: { key: record.key } }),
                        })}
                    />
                </div>
            </Spin>

            {/* Pagination */}
            <Flex justify="flex-end" className="pt-2">
                <Pagination
                    current={page}
                    total={total}
                    pageSize={10}
                    showSizeChanger={false}
                    onChange={p => setPage(p)}
                />
            </Flex>
        </Flex>
    );
};

export default Transactions;
