import React from 'react';

import { Button, Flex, Tag } from 'antd';
import type { TableColumnsType } from 'antd';

export const vendorStatusColors: Record<string, string> = {
    Invited:   '#fa8c16',
    'Under Review': '#1677ff',
    Pending:   '#fa8c16',
    Accepted:  '#52c41a',
    Rejected:  '#ff4d4f',
};

const cellStyle = { color: '#262626', fontSize: 13 };

export const rfqOverviewLineItemColumns: TableColumnsType<any> = [
    { title: 'Description', dataIndex: 'description', key: 'description', onHeaderCell: () => ({ style: { paddingLeft: 20 } }), onCell: () => ({ style: { paddingLeft: 20 } }), render: (v: any) => (
        <span style={{ ...cellStyle, whiteSpace: 'normal', wordBreak: 'break-word' }}>{v}</span>
    ) },
    { title: 'Qty',            dataIndex: 'qty',         key: 'qty',         width: 100, render: (v: any) => <span style={{ ...cellStyle, whiteSpace: 'nowrap' }}>{v}</span> },
    { title: 'Unit',           dataIndex: 'unit',        key: 'unit',        width: 80,  render: (v: any) => <span style={cellStyle}>{v}</span> },
    { title: 'Est. Unit Cost', dataIndex: 'estUnitCost', key: 'estUnitCost', width: 140, render: (v: any) => <span style={cellStyle}>{v != null ? <>₹ {Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</> : 'N/A'}</span> },
    { title: 'Total',          dataIndex: 'total',       key: 'total',       width: 120, render: (v: any) => <span style={cellStyle}>{v != null ? <>₹ {Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</> : 'N/A'}</span> },
];

export const lineItemColumns: TableColumnsType<any> = [
    { title: 'Description',    dataIndex: 'description', key: 'description', width: 100, render: (v: any) => <span style={cellStyle}>{v}</span> },
    { title: 'Qty',            dataIndex: 'qty',         key: 'qty',         width: 60,  render: (v: any) => <span style={cellStyle}>{v}</span> },
    { title: 'Unit',           dataIndex: 'unit',        key: 'unit',        width: 120, render: (v: any) => <span style={cellStyle}>{v}</span> },
    { title: 'Est. Unit Cost', dataIndex: 'estUnitCost', key: 'estUnitCost', width: 130, render: (v: any) => <span style={cellStyle}>{v}</span> },
    { title: 'Total',          dataIndex: 'total',       key: 'total',       width: 100, render: (v: any) => <span style={cellStyle}>{v}</span> },
];

const statusColors: Record<string, { color: string; bg: string }> = {
    Draft:    { color: '#535353', bg: '#f2f2f2' },
    Sent:     { color: '#1677ff', bg: '#e6f4ff' },
    Open:     { color: '#1677ff', bg: '#e6f4ff' },
    Active:   { color: '#03a254', bg: '#ddffee' },
    Closed:   { color: '#535353', bg: '#f2f2f2' },
    Cancelled:{ color: '#ff4d4f', bg: '#fff1f0' },
};

const defaultStatus = { color: '#8c8c8c', bg: '#f5f5f5' };


export const getRFQColumns = (
    onView: (row: any) => void,
    onClose: (row: any) => void,
    onReopen: (row: any) => void
): TableColumnsType<any> => [
    {
        title: 'Date', dataIndex: 'createdAt', key: 'createdAt', width: 100,
        render: (val: string) => val ? new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
    },
    { title: 'Ref #',  dataIndex: 'refNumber', key: 'refNumber', width: 130, render: (ref: string, row: any) => row.type ? ref?.replace(/^RFQ-/i, `${row.type}-`) : ref },
    { title: 'Title',  dataIndex: 'title',     key: 'title',     width: 160, render: (v: string) => <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{v}</span> },
    {
        title: 'Vendors', dataIndex: 'vendorInvites', key: 'vendorInvites', width: 75,
        render: (invites: any[]) => invites?.length ?? 0,
    },
    {
        title: 'Deadline', dataIndex: 'submissionDeadline', key: 'submissionDeadline', width: 100,
        render: (val: string) => {
            if (!val) return 'N/A';
            const [year, month, day] = val.split('T')[0].split('-').map(Number);
            const deadline = new Date(year, month - 1, day, 23, 59, 59);
            const now = new Date();
            const isOverdue = deadline < now;
            if (isOverdue) {
                const formatted = deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                return <span style={{ color: '#ff4f4f' }}>{formatted}</span>;
            }
            const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
            return <span style={{ color: '#171717' }}>{daysLeft}d left</span>;
        },
    },
    {
        title: 'Proposals', dataIndex: 'proposalCount', key: 'proposalCount', width: 100,
        render: (count: number) => count ?? 0,
    },
    {
        title: 'Status', dataIndex: 'status', key: 'status', width: 100,
        render: (status: string) => {
            const cfg = statusColors[status] ?? defaultStatus;
            return (
                <Tag style={{ color: cfg.color, background: cfg.bg, border: 'none', borderRadius: 6, fontWeight: 500 }}>
                    ● {status}
                </Tag>
            );
        },
    },
    {
        title: 'Actions', key: 'actions', width: 140,
        render: (_: any, row: any) => (
            <Flex align="center" gap={8}>
                <Button size="small" danger variant="outlined" className="rounded-[6px]" onClick={() => onView(row)}>View</Button>
                {row.status === 'Closed'
                    ? <Button size="small" style={{ borderColor: '#FF4F4F', color: '#FF4F4F', borderRadius: 8, fontSize: 12 }} onClick={() => onReopen(row)}>Re-open</Button>
                    : <Button size="small" style={{ borderColor: '#FF4F4F', color: '#FF4F4F', borderRadius: 8, fontSize: 12 }} onClick={() => onClose(row)}>Close</Button>
                }
            </Flex>
        ),
    },
];
