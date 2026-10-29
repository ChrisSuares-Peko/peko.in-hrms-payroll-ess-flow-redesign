import React from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Button, Flex, Tag, Tooltip, Typography } from 'antd';
import type { TableColumnsType } from 'antd';

import { normalizePOStatus, type POStatus } from './data';
import { formatShortDate } from './index';

const { Text } = Typography;

const statusCfg: Record<string, { color: string; bg: string }> = {
    'Draft':     { color: '#535353', bg: '#f2f2f2' },
    'PO Issued': { color: '#2c46f0', bg: '#ecf1fd' },
    'Closed':    { color: '#03a254', bg: '#ecfdf5' },
    'Cancelled': { color: '#d4380d', bg: '#fff2e8' },
};

const deleteBlockedReason = (row: any): string => {
    if (row.status === 'Cancelled') return 'Cancelled purchase orders stay on record';
    if (row.billingState === 'FULL') return 'Fully billed purchase orders are locked';
    if (row.billingState === 'PARTIAL') return 'Billed purchase orders can only be closed';
    if (row.status === 'PO Issued') return 'Issued purchase orders can be cancelled from the PO page';
    return 'Only draft purchase orders can be deleted';
};

export const purchaseOrdersColumns = (onView: (id: number) => void, onDelete: (id: number) => void): TableColumnsType<any> => [
    {
        title: 'PO #', dataIndex: 'refNumber', key: 'refNumber',
        render: (v) => <Text style={{ fontSize: 13, color: '#171717', fontWeight: 500 }}>{v}</Text>,
    },
    {
        title: 'Title', dataIndex: 'title', key: 'title',
        render: (v) => <Text style={{ fontSize: 13, color: '#171717' }}>{v ?? 'N/A'}</Text>,
    },
    {
        title: 'Vendor', dataIndex: 'vendor', key: 'vendor',
        render: (v) => <Text style={{ fontSize: 13, color: '#171717' }}>{v?.businessName ?? 'N/A'}</Text>,
    },
    {
        title: 'Total', dataIndex: 'totalAmount', key: 'totalAmount',
        render: (v) => <Text style={{ fontSize: 13, color: '#171717' }}>{v ? `₹ ${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}</Text>,
    },
    {
        title: 'Created', dataIndex: 'createdAt', key: 'createdAt',
        render: (v) => <Text style={{ fontSize: 13, color: '#171717' }}>{formatShortDate(v)}</Text>,
    },
    {
        title: 'Status', dataIndex: 'status', key: 'status',
        render: (v: string) => {
            const ns  = normalizePOStatus(v) as POStatus;
            const cfg = statusCfg[ns] ?? { color: '#595959', bg: '#f5f5f5' };
            return (
                <Tag style={{ color: cfg.color, background: cfg.bg, border: 'none', borderRadius: 20, fontWeight: 500, fontSize: 13 }}>
                    {ns}
                </Tag>
            );
        },
    },
   
    {
        title: 'Actions', key: 'actions',
        render: (_: any, row: any) => {
            const canDelete = row.status === 'Draft';
            return (
                <Flex gap={12} align="center">
                    <Button size="small" danger variant="outlined" style={{ borderRadius: 6 }} onClick={() => onView(row.id)}>
                        View
                    </Button>
                    {/* BE softDelete rejects anything but Draft */}
                    <Tooltip title={canDelete ? 'Delete' : deleteBlockedReason(row)}>
                        <DeleteOutlined
                            style={{ fontSize: '1.1rem', color: canDelete ? '#ff4d4f' : '#d9d9d9', cursor: canDelete ? 'pointer' : 'not-allowed' }}
                            onClick={() => canDelete && onDelete(row.id)}
                        />
                    </Tooltip>
                </Flex>
            );
        },
    },
];
