import React, { useEffect, useState } from 'react';

import { ArrowLeftOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Col, Drawer, Flex, Input, Pagination, Row, Skeleton, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { useInvoice } from '../../Procure/hooks/useInvoice';
import { InvoiceData } from '../../Procure/types';
import { formatShortDate } from '../../Procure/utils';

const { Text, Title } = Typography;

const statusTagStyle: Record<string, React.CSSProperties> = {
    COMPLETED:  { color: '#43B75D', backgroundColor: '#ECFDF5', borderRadius: 16, border: '1px solid #43B75D' },
    PAID:       { color: '#43B75D', backgroundColor: '#ECFDF5', borderRadius: 16, border: '1px solid #43B75D' },
    PENDING:    { color: '#FAAD14', backgroundColor: '#FFF7E6', borderRadius: 16, border: '1px solid #FAAD14' },
    FAILED:     { color: '#FF4D4F', backgroundColor: '#FFF1F0', borderRadius: 16, border: '1px solid #FF4D4F' },
    REJECTED:   { color: '#FF4D4F', backgroundColor: '#FFF1F0', borderRadius: 16, border: '1px solid #FF4D4F' },
    PROCESSING: { color: '#1677FF', backgroundColor: '#E6F4FF', borderRadius: 16, border: '1px solid #1677FF' },
    APPROVED:   { color: '#1677FF', backgroundColor: '#E6F4FF', borderRadius: 16, border: '1px solid #1677FF' },
};

interface InvoiceSelectionModalProps {
    visible: boolean;
    onCancel: () => void;
    onBack: () => void;
    onMakePayment: (selected: InvoiceData[]) => void;
}

const InvoiceSelectionModal: React.FC<InvoiceSelectionModalProps> = ({
    visible,
    onCancel,
    onBack,
    onMakePayment,
}) => {
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [search, setSearch] = useState('');
    const PAGE_SIZE = 10;
    const [filters, setFilters] = useState({ searchText: '', page: 1, limit: PAGE_SIZE, paymentStatus: 'PENDING' });

    const { tableData, total, isLoading } = useInvoice(filters);

    useEffect(() => {
        if (visible) {
            setSelectedRowKeys([]);
            setSearch('');
            setFilters({ searchText: '', page: 1, limit: PAGE_SIZE, paymentStatus: 'PENDING' });
        }
    }, [visible]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setFilters(prev => ({ ...prev, searchText: search, page: 1, paymentStatus: 'PENDING' }));
        }, 400);
        return () => clearTimeout(timeout);
    }, [search]);

    const selectedInvoices = tableData.filter(inv => selectedRowKeys.includes(inv.id));

    const columns: ColumnsType<InvoiceData> = [
        {
            title: 'Invoice Number',
            dataIndex: 'invoiceNumber',
            key: 'invoiceNumber',
            render: (val: string) => <Text strong>{val}</Text>,
        },
        {
            title: 'Vendor',
            key: 'vendor',
            render: (_: any, row: InvoiceData) => (
                <Text>{row.purchaseOrder?.vendor?.businessName ?? '—'}</Text>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (val: string) => (
                <Text strong>
                    {val ? `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                </Text>
            ),
        },
        {
            title: 'Due Date',
            dataIndex: 'dueDate',
            key: 'dueDate',
            render: (v: string) => <Text>{formatShortDate(v)}</Text>,
        },
        {
            title: 'Invoice Date',
            dataIndex: 'invoiceDate',
            key: 'invoiceDate',
            render: (v: string) => <Text>{formatShortDate(v)}</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (val: string) => {
                const key = val?.toUpperCase();
                return (
                    <Tag style={statusTagStyle[key] ?? { borderRadius: 16 }}>
                        {val ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() : '—'}
                    </Tag>
                );
            },
        },
    ];

    return (
        <Drawer
            open={visible}
            onClose={onCancel}
            placement="right"
            width={900}
            closable={false}
            title={
                <Flex align="center" justify="space-between">
                    <Space>
                        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} size="small" />
                        <Space direction="vertical" size={2}>
                            <Title level={4} className="m-0">Add Bill Payout</Title>
                            <Text type="secondary" style={{ fontSize: 13, fontWeight: 'normal' }}>
                                Fill in the bill details below
                            </Text>
                        </Space>
                    </Space>
                    <Button type="text" icon={<CloseOutlined />} onClick={onCancel} />
                </Flex>
            }
            footer={
                <Row justify="space-between" align="middle">
                    <Col>
                        <Text type="secondary">
                            Total Selected: <Text strong>{selectedRowKeys.length}</Text>
                        </Text>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            disabled={selectedRowKeys.length === 0}
                            onClick={() => onMakePayment(selectedInvoices)}
                            style={{ borderRadius: 8, background: '#FF4D4F', borderColor: '#FF4D4F' }}
                        >
                            Make Payment ({selectedRowKeys.length})
                        </Button>
                    </Col>
                </Row>
            }
        >
            <Space direction="vertical" size={16} className="w-full">
                <Text strong>Invoice Payout Details</Text>

                <Input
                    prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                    placeholder="Search by invoice number, vendor name, or amount"
                    value={search}
                    onChange={e => setSearch(e.target.value.replace(/\p{Emoji}/gu, ''))}
                    allowClear
                    style={{ borderRadius: 8 }}
                />

                {isLoading ? (
                    <Skeleton active paragraph={{ rows: 6 }} />
                ) : (
                    <Table
                        rowSelection={{
                            selectedRowKeys,
                            onChange: keys => setSelectedRowKeys(keys),
                            hideSelectAll: true,
                        }}
                        columns={columns}
                        dataSource={tableData}
                        pagination={false}
                        size="small"
                        rowKey="id"
                    />
                )}

                <Pagination
                    current={filters.page}
                    pageSize={PAGE_SIZE}
                    total={total}
                    showSizeChanger={false}
                    className="text-end"
                    onChange={page => setFilters(prev => ({ ...prev, page }))}
                />
            </Space>
        </Drawer>
    );
};

export default InvoiceSelectionModal;
