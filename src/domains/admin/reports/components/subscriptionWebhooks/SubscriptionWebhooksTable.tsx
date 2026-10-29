import React, { useState } from 'react';

import { EyeOutlined } from '@ant-design/icons';
import { Button, Descriptions, Flex, Modal, Pagination, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import Header from './Header';
import useFilter from '../../hooks/useFilter';
import useSubscriptionWebhooks from '../../hooks/useSubscriptionWebhooks';
import { WebhookEvent } from '../../types/subscriptionWebhook';

const MAX_RETRIES = 2;

const statusTag = (status: string) => {
    if (status === 'PROCESSED') return <Tag color="success">{status}</Tag>;
    if (status === 'FAILED') return <Tag color="error">{status}</Tag>;
    return <Tag color="warning">{status}</Tag>;
};

const SubscriptionWebhooksTable = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');

    const [filters, setFilters] = useState({
        status: undefined as string | undefined,
        webhookContext: undefined as string | undefined,
        page: 1,
        limit: 10,
        from: oneMonthAgoFormatted,
        to: todayFormatted,
    });

    const [viewRecord, setViewRecord] = useState<WebhookEvent | null>(null);

    const { handleFromChange, handleToChange, handleDateChange } = useFilter({
        setFilters,
        initalStartDate: filters.from,
        initalEndDate: filters.to,
    });

    const handleStatusChange = (val: string) => {
        setFilters(prev => ({ ...prev, status: val || undefined, page: 1 }));
    };

    const handleContextChange = (val: string) => {
        setFilters(prev => ({ ...prev, webhookContext: val || undefined, page: 1 }));
    };

    const { isLoading, tableData, total, retryingId, handleRetry, isClearing, handleClear } =
        useSubscriptionWebhooks({
            status: filters.status || undefined,
            webhookContext: filters.webhookContext || undefined,
            fromDate: filters.from,
            toDate: filters.to,
            page: filters.page,
            limit: filters.limit,
        });

    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(date))}</Typography.Text>
                    <Typography.Text className="text-xs text-gray-400">
                        {formattedTime(new Date(date))}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Event Type',
            dataIndex: 'eventType',
            key: 'eventType',
            render: (data: string) => <Typography.Text>{data ?? '-'}</Typography.Text>,
        },
        {
            title: 'Context',
            dataIndex: 'webhookContext',
            key: 'webhookContext',
            render: (data: string) => <Typography.Text>{data ?? '-'}</Typography.Text>,
        },
        {
            title: 'Vendor Sub ID',
            dataIndex: 'vendorSubscriptionId',
            key: 'vendorSubscriptionId',
            render: (data: string | null) => (
                <Typography.Text className="text-xs">{data ?? '-'}</Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (data: string) => statusTag(data),
        },
        {
            title: 'Retries',
            dataIndex: 'retryCount',
            key: 'retryCount',
            render: (data: number) => (
                <Typography.Text>
                    {data} / {MAX_RETRIES}
                </Typography.Text>
            ),
        },
        {
            title: 'Last Processed',
            dataIndex: 'lastProcessedAt',
            key: 'lastProcessedAt',
            render: (data: string | null) => (
                <Typography.Text>
                    {data ? formattedDateOnly(new Date(data)) : '-'}
                </Typography.Text>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: WebhookEvent) => (
                <Flex gap={8}>
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => setViewRecord(record)}
                    >
                        View
                    </Button>
                    {record.status === 'FAILED' && (
                        <Button
                            danger
                            size="small"
                            loading={retryingId === record.id}
                            disabled={record.retryCount >= MAX_RETRIES || retryingId === record.id}
                            onClick={() => handleRetry(record.id)}
                        >
                            Retry
                        </Button>
                    )}
                </Flex>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <Flex justify="space-between" align="center">
                <Typography.Text className="text-lg font-medium">
                    Subscription Renewal Events
                </Typography.Text>
            </Flex>
            <Header
                from={filters.from}
                to={filters.to}
                status={filters.status}
                webhookContext={filters.webhookContext}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                handleDateChange={handleDateChange}
                onStatusChange={handleStatusChange}
                onContextChange={handleContextChange}
                onClear={handleClear}
                isClearing={isClearing}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7"
                onChange={page => setFilters(prev => ({ ...prev, page }))}
                total={total}
                pageSize={filters.limit}
                showSizeChanger={false}
            />

            <Modal
                title="Webhook Event Details"
                open={!!viewRecord}
                onCancel={() => setViewRecord(null)}
                footer={null}
                width={720}
            >
                {viewRecord && <WebhookDetailView record={viewRecord} />}
            </Modal>
        </Flex>
    );
};

const WebhookDetailView = ({ record }: { record: WebhookEvent }) => {
    const statusTagg = (status: string) => {
        if (status === 'PROCESSED') return <Tag color="success">{status}</Tag>;
        if (status === 'FAILED') return <Tag color="error">{status}</Tag>;
        return <Tag color="warning">{status}</Tag>;
    };

    return (
        <Flex vertical gap={20}>
            <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="ID">{record.id}</Descriptions.Item>
                <Descriptions.Item label="Status">{statusTagg(record.status)}</Descriptions.Item>
                <Descriptions.Item label="Event Type" span={2}>
                    {record.eventType ?? '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Context">{record.webhookContext ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Source">{record.webhookSource ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Vendor Sub ID" span={2}>
                    {record.vendorSubscriptionId ?? '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Merchant Payment ID" span={2}>
                    {record.merchantPaymentId ?? '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Retries">
                    {record.retryCount} / {MAX_RETRIES}
                </Descriptions.Item>
                <Descriptions.Item label="Last Processed">
                    {record.lastProcessedAt
                        ? `${formattedDateOnly(new Date(record.lastProcessedAt))} ${formattedTime(new Date(record.lastProcessedAt))}`
                        : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Created At" span={2}>
                    {`${formattedDateOnly(new Date(record.createdAt))} ${formattedTime(new Date(record.createdAt))}`}
                </Descriptions.Item>
                {record.processingError && (
                    <Descriptions.Item label="Error" span={2}>
                        <Typography.Text type="danger">{record.processingError}</Typography.Text>
                    </Descriptions.Item>
                )}
            </Descriptions>

            {record.payload && (
                <>
                    <Typography.Text strong>Payload</Typography.Text>
                    <pre
                        style={{
                            background: '#f5f5f5',
                            border: '1px solid #e8e8e8',
                            borderRadius: 6,
                            padding: '12px 16px',
                            fontSize: 12,
                            overflowX: 'auto',
                            maxHeight: 320,
                            overflowY: 'auto',
                            margin: 0,
                        }}
                    >
                        {JSON.stringify(record.payload, null, 2)}
                    </pre>
                </>
            )}
        </Flex>
    );
};

export default SubscriptionWebhooksTable;
