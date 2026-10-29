import React, { useState } from 'react';

import { Button, Card, Col, DatePicker, Input, Pagination, Row, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import GenericTable from '@components/atomic/GenericTable';

import newPurchaseOrder from '../assets/icons/newPurchaseOrder.svg';
import newPurchaseReq from '../assets/icons/newPurchaseReq.svg';
import newRFQIcon from '../assets/icons/newRFQIcon.svg';
import recentActivityIcon from '../assets/icons/recentActivityIcon.svg';
import { useActivity } from '../hooks/useActivity';
import useFilter from '../hooks/useFilter';
import { DashboardActivity } from '../types';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const TYPE_ICON: Record<string, string> = {
    INVOICE_RECEIVED:  newPurchaseReq,
    RFQ_CLOSED:        newRFQIcon,
    RFQ_AWARDED:       newRFQIcon,
    RFQ_SENT:          newRFQIcon,
    PO_SENT:           newPurchaseOrder,
    PO_CREATED:        newPurchaseOrder,
    PROPOSAL_RECEIVED: newPurchaseReq,
};

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

const initialFilters = {
    search: '',
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    page: 1,
    limit: 20,
};

const ActivityPage: React.FC = () => {
    const [filters, setFilters] = useState(initialFilters);
    const { isLoading, activity, total } = useActivity(filters);
    const { handleSearch, handleDateChange, handlePageChange } = useFilter({ setFilter: setFilters });

    const columns: ColumnsType<DashboardActivity> = [
        {
            title: 'Activity',
            dataIndex: 'message',
            key: 'message',
            render: (message: string, record) => (
                <Row align="middle" gutter={8} wrap={false}>
                    <Col>
                        <img
                            src={TYPE_ICON[record.type] ?? recentActivityIcon}
                            alt={record.type}
                            width={20}
                            height={20}
                        />
                    </Col>
                    <Col>
                        <Text style={{ fontSize: 14 }}>{message}</Text>
                    </Col>
                </Row>
            ),
        },
        {
            title: 'Date & Time',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => (
                <Text style={{ fontSize: 14, textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
                    {formatDateTime(date)}
                </Text>
            ),
            width: 240,
        },
    ];

    const handleDownload = () => {
        const rows = activity.map(a => `"${a.message}","${formatDateTime(a.date)}"`).join('\n');
        const csv  = `Activity,Date & Time\n${rows}`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'activity.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Card className="rounded-3xl w-full !border-gray-100" styles={{ body: { padding: 32 } }}>
            <Row gutter={[0, 16]}>
                <Col span={24}>
                    <Row justify="space-between" align="middle" gutter={[16, 12]}>
                        <Col>
                            <Title level={4} style={{ fontWeight: 600, marginBottom: 0 }}>Activity</Title>
                            <Text type="secondary">
                                Procurement activity across purchase requests, RFQs, purchase orders, and invoices.
                            </Text>
                        </Col>
                        <Col>
                            <Row gutter={12} align="middle">
                                <Col>
                                    <RangePicker onChange={handleDateChange} />
                                </Col>
                                <Col>
                                    <Input.Search
                                        placeholder="Search"
                                        onSearch={handleSearch}
                                        onChange={e => !e.target.value && handleSearch('')}
                                        style={{ width: 200 }}
                                        allowClear
                                    />
                                </Col>
                                <Col>
                                    <Button type="primary" danger onClick={handleDownload}>
                                        ↓ Download XLS
                                    </Button>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <GenericTable
                        columns={columns}
                        dataSource={activity}
                        rowKey={(record: DashboardActivity, i?: number) => `${record.refId}-${i}`}
                        loading={isLoading}
                        className="w-full"
                        bordered={false}
                        pagination={false}
                    />
                </Col>

                <Col span={24}>
                    <Pagination
                        current={filters.page}
                        size="default"
                        className="text-end"
                        onChange={handlePageChange}
                        total={total}
                        pageSize={filters.limit}
                        showSizeChanger={false}
                    />
                </Col>
            </Row>
        </Card>
    );
};

export default ActivityPage;
