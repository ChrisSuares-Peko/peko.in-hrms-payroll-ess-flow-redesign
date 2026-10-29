import React from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Pagination, Space, Spin, Table, Tag, Typography } from 'antd';
// TEMP: unused while 24h cancellation window is disabled
// import dayjs from 'dayjs';

import { formatNumberWithLocalString } from '@src/utils/priceFormat';

import { type ProvisionResult } from '../../types/index';
import { capitalize } from '../../utils/manageSubscriptionUtils';

const { Title } = Typography;

type SubRow = {
    key: string;
    corporateTxnId: string;
    itemType: string;
    productName: string;
    billingCycle?: number;
    price: number;
    unitPrice?: number;
    os?: string;
    addons?: string[];
    controlPanel?: string;
    provision?: ProvisionResult;
    transactionDate: string;
    orderStatus: string;
    productId: string;
};

const formatDuration = (billingCycle?: number) => {
    if (!billingCycle) return '-';
    if (billingCycle % 12 === 0) {
        const y = billingCycle / 12;
        return `${y} Year${y > 1 ? 's' : ''}`;
    }
    return `${billingCycle} Month${billingCycle > 1 ? 's' : ''}`;
};

interface Props {
    loading: boolean;
    rows: SubRow[];
    subSearch: string;
    onSubSearch: (v: string) => void;
    cancellingId: string | null;
    page: number;
    totalRecords: number;
    onPageChange: (p: number) => void;
    onCancel: (provision: ProvisionResult, corporateTxnId: string, productId: string) => void;
}

const SubscriptionHistoryTable: React.FC<Props> = ({
    loading,
    rows,
    subSearch,
    onSubSearch,
    cancellingId,
    page,
    totalRecords,
    onPageChange,
    onCancel,
}) => {
    const columns = [
        {
            title: 'Product Category',
            dataIndex: 'itemType',
            key: 'itemType',
            render: (v: string) => capitalize(v),
        },
        { title: 'Product Name', dataIndex: 'productName', key: 'productName' },
        {
            title: 'Duration',
            key: 'duration',
            render: (_: unknown, record: SubRow) => {
                const v = record.billingCycle;
                if (!v) return '-';
                if (record.itemType === 'domain') return `${v} Year${v > 1 ? 's' : ''}`;
                return formatDuration(v);
            },
        },
        {
            title: 'Price',
            key: 'price',
            render: (_: unknown, record: SubRow) => {
                if (record.unitPrice == null) return '-';
                const period = record.itemType === 'domain' ? 'year' : 'month';
                return `₹ ${formatNumberWithLocalString(record.unitPrice)}/${period}`;
            },
        },
        {
            title: 'Details',
            key: 'details',
            render: (_: unknown, record: SubRow) => {
                if (record.itemType === 'domain') return '-';
                if (record.itemType !== 'vps_server') {
                    return <Tag>{record.productName}</Tag>;
                }
                return (
                    <Space direction="vertical" size={4}>
                        <Tag>{record.productName}</Tag>
                        {record.os && (
                            <div>
                                <span className="text-gray-500 text-xs">OS: </span>
                                <Tag>{record.os}</Tag>
                            </div>
                        )}
                        {record.controlPanel && (
                            <div>
                                <span className="text-gray-500 text-xs">Control Panel: </span>
                                <Tag color="purple">{record.controlPanel}</Tag>
                            </div>
                        )}
                        {record.addons && record.addons.length > 0 && (
                            <div>
                                <span className="text-gray-500 text-xs">Addons: </span>
                                {record.addons.map(a => <Tag key={a} color="blue">{a}</Tag>)}
                            </div>
                        )}
                    </Space>
                );
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: unknown, record: SubRow) => {
                // TEMP: diagnostic to see why Cancel is hidden for a given row
                console.log('[cancel-debug]', record.productName, {
                    orderStatus: record.orderStatus,
                    provision: record.provision,
                    provisionStatus: record.provision?.status,
                    orderId: record.provision?.result?.entityid ?? record.provision?.result?.orderid,
                });
                const statusTagProps: Record<string, { color: string; label: string }> = {
                    CANCELLATION_REQUESTED: { color: 'orange', label: 'Cancellation Requested' },
                    REFUNDED: { color: 'blue', label: 'Refunded' },
                    CANCELLED: { color: 'red', label: 'Cancelled' },
                    FAILED: { color: 'red', label: 'Failed' },
                    FAILURE: { color: 'red', label: 'Failed' },
                };
                if (record.orderStatus !== 'SUCCESS') {
                    const tag = statusTagProps[record.orderStatus];
                    return <Tag color={tag?.color ?? 'default'}>{tag?.label ?? record.orderStatus}</Tag>;
                }
                if (!record.provision || record.provision.status !== 'SUCCESS') return '-';
                const orderId =
                    record.provision.result?.entityid ?? record.provision.result?.orderid;
                if (!orderId) return '-';
                const key = String(orderId);
                // TEMP: 24h cancellation window disabled to allow cancelling an older purchase
                // const hoursSincePurchase = dayjs().diff(dayjs(record.transactionDate), 'hour');
                // if (hoursSincePurchase >= 24) return '-';
                return (
                    <Button
                        size="small"
                        danger
                        loading={cancellingId === key}
                        onClick={() => onCancel(record.provision!, record.corporateTxnId, record.productId)}
                    >
                        Cancel
                    </Button>
                );
            },
        },
    ];

    return (
        <div>
            <div className="mb-4">
                <Title level={5} style={{ margin: 0 }}>Subscription History</Title>
            </div>
            <Input
                placeholder="Search by name"
                prefix={<SearchOutlined />}
                className="mb-4 max-w-xs"
                value={subSearch}
                onChange={e => onSubSearch(e.target.value)}
                allowClear
            />
            <Spin spinning={loading}>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <Table
                        rowKey="key"
                        columns={columns}
                        dataSource={rows}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                    />
                </div>
            </Spin>
            <Flex justify="end" className="pt-4">
                <Pagination
                    current={page}
                    onChange={onPageChange}
                    total={totalRecords}
                    pageSize={10}
                    showSizeChanger={false}
                />
            </Flex>
        </div>
    );
};

export default SubscriptionHistoryTable;
