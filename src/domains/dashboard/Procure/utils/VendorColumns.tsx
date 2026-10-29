import React from 'react';

import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Flex, Tag, Tooltip, Typography } from 'antd';
import type { TableColumnsType } from 'antd';

import { type VendorStatus } from './data';

const { Text } = Typography;

const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const statusCfg: Record<VendorStatus, { color: string; bg: string }> = {
    'Active':     { color: '#43B75D', bg: '#ECFDF5' },
    'Inactive':   { color: '#8c8c8c', bg: '#f5f5f5' },
    'Blacklisted': { color: '#f5222d', bg: '#fff1f0' },
};


export const vendorColumns = (onView: (id: number) => void, onDelete: (id: number) => void, onEdit: (id: number) => void): TableColumnsType<any> => [
    {
        title: 'Vendor', dataIndex: 'businessName', key: 'businessName',
        render: (v) => <Text style={{ fontSize: 13, color: '#171717', fontWeight: 400 }}>{v || 'N/A'}</Text>,
    },
    {
        title: 'Contact Person', dataIndex: 'contactPerson', key: 'contactPerson',
        render: (v) => <Text style={{ fontSize: 13, color: '#171717', fontWeight: 400 }}>{v || 'N/A'}</Text>,
    },
    {
        title: 'Status', dataIndex: 'status', key: 'status',
        render: (v: VendorStatus) => {
            const cfg = statusCfg[v] ?? { color: '#595959', bg: '#f5f5f5' };
            return (
                <Tag style={{ color: cfg.color, background: cfg.bg, border: 'none', borderRadius: 6, fontWeight: 500 }}>
                    {v}
                </Tag>
            );
        },
    },
    {
        title: 'Category', dataIndex: 'tags', key: 'tags',
        render: (cats: string[]) => (
            <>
                {cats?.length
                    ? cats.map((cat) => (
                        <Tag
                            key={cat}
                            style={{
                                color: '#171717',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: 6,
                                fontWeight: 400,
                                marginRight: 4,
                            }}
                        >
                            {cat}
                        </Tag>
                    ))
                    : <Text style={{ fontSize: 13, color: '#262626' }}>N/A</Text>
                }
            </>
        ),
    },
    {
        title: 'Total Spend', dataIndex: 'totalSpend', key: 'totalSpend',
        render: (v) => <Text style={{ fontSize: 13, color: '#262626', fontWeight: 400 }}>{v != null ? `₹ ${v}` : 'N/A'}</Text>,
    },
    {
        title: 'Purchase Orders', dataIndex: 'poCount', key: 'poCount',
        render: (v) => <Text style={{ fontSize: 13, color: '#262626' }}>{v ?? 'N/A'}</Text>,
    },
    {
        title: 'Last activity', dataIndex: 'lastActivity', key: 'lastActivity',
        render: (v) => <Text style={{ fontSize: 13, color: '#262626' }}>{formatDate(v)}</Text>,
    },
    {
        title: 'Actions', key: 'actions',
        render: (_: any, row: any) => (
            <Flex gap={12} align="center">
                <Button danger variant="outlined" style={{ borderRadius: 6, height: 32, fontSize: 12 }} onClick={() => onView(row.id)}>
                    View
                </Button>
                <EditOutlined
                    onClick={() => onEdit(row.id)}
                    style={{ fontSize: '1.1rem', cursor: 'pointer', color: '#ff4d4f' }}
                />
                <Tooltip title="Delete">
                    <DeleteOutlined style={{ fontSize: '1.1rem', cursor: 'pointer', color: '#ff4d4f' }} onClick={() => onDelete(row.id)} />
                </Tooltip>
            </Flex>
        ),
    },
];
