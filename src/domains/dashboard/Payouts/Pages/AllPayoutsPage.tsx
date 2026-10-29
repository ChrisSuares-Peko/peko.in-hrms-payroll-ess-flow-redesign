import React, { useEffect, useRef, useState } from 'react';

import { ExportOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Pagination, Row, Select, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import GenericTable from '@src/components/atomic/GenericTable';

import useExportPayoutsApi from '../hooks/useExportPayoutsApi';
import useGetAllPayoutsApi from '../hooks/useGetAllPayoutsApi';
import { PayoutTransaction } from '../types';
import { statusColorMap, statusOptions } from '../utils/stats';

const { Title, Text } = Typography;

const PAGE_SIZE = 10;

const AllPayoutsPage = () => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { getAllPayouts, data, total, isLoading } = useGetAllPayoutsApi();
    const { exportAllPayouts, isLoading: exportLoading } = useExportPayoutsApi();

    const fetchPayouts = (searchText = search, status = statusFilter, currentPage = page) => {
        getAllPayouts({
            page: currentPage,
            itemsPerPage: PAGE_SIZE,
            searchText: searchText || undefined,
            status: status || undefined,
        });
    };

    useEffect(() => {
        fetchPayouts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = (value: string) => {
        setSearch(value);
        setPage(1);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchPayouts(value, statusFilter, 1), 400);
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        setPage(1);
        fetchPayouts(search, value, 1);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchPayouts(search, statusFilter, newPage);
    };

    const handleExport = () => {
        exportAllPayouts({
            searchText: search || undefined,
            status: statusFilter || undefined,
        });
    };

    const columns: ColumnsType<PayoutTransaction> = [
        {
            title: 'Beneficiary',
            key: 'beneficiary',
            render: (_: unknown, record: PayoutTransaction) => (
                <Text>{record.payoutBeneficiary?.name ?? record.payeeName}</Text>
            ),
        },
        {
            title: 'Date & Time',
            dataIndex: 'transactionDate',
            key: 'transactionDate',
            render: (text: string) => (
                <Text>
                    {text ? dayjs(text).format('MMMM D, YYYY [at] h:mm a') : '—'}
                </Text>
            ),
        },
        {
            title: 'Transaction ID',
            dataIndex: 'referenceId',
            key: 'referenceId',
        },
        {
            title: 'Payment Method',
            dataIndex: 'transferType',
            key: 'transferType',
            render: (transferType: string | null) => transferType ?? '—',
        },
        {
            title: 'Reference',
            dataIndex: 'category',
            key: 'category',
            render: (category: string) =>
                category
                    ?.split('_')
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                    .join(' ') ?? '—',
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: string) => (
                <Text strong>₹{parseFloat(amount)?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}</Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={statusColorMap[status] ?? 'default'} style={{ borderRadius: 6 }}>
                    {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                </Tag>
            ),
        },
    ];

    return (
        <div className="p-5 md:p-7">
            <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
                <Title level={4} className="m-0">
                    All Payouts
                </Title>
                <Text type="secondary">View complete payout history and transaction details</Text>
            </Space>

            <Row
                justify="space-between"
                align="middle"
                style={{ marginBottom: 16 }}
                gutter={[6, 6]}
            >
                <Col xs={24} sm={14} md={16}>
                    <Input
                        placeholder="Search by beneficiary, category, or transaction ID..."
                        prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                        value={search}
                        onChange={e => handleSearch(e.target.value.replace(/\p{Extended_Pictographic}/gu, ''))}
                        allowClear
                    />
                </Col>
                <Col xs={24} sm={10} md={4}>
                    <Select
                        className="w-full"
                        value={statusFilter}
                        onChange={handleStatusChange}
                        options={statusOptions}
                    />
                </Col>
                <Col xs={24} sm={10} md={4}>
                    <Button
                        icon={<ExportOutlined />}
                        className="w-full"
                        loading={exportLoading}
                        onClick={handleExport}
                    >
                        Export
                    </Button>
                </Col>
            </Row>

            <GenericTable
                rowKey="id"
                columns={columns}
                dataSource={data}
                loading={isLoading}
            />
            
                <Flex justify="flex-end" style={{ marginTop: 16 }}>
                    <Pagination
                        current={page}
                        pageSize={PAGE_SIZE}
                        total={total}
                        showSizeChanger={false}
                        onChange={handlePageChange}
                    />
                </Flex>
            
        </div>
    );
};

export default AllPayoutsPage;
