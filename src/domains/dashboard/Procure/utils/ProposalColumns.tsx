import React from 'react';

import { Button, Flex, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';

import { formatShortDate } from './index';

export const statusCfg: Record<string, { label: string; color: string; bg: string; border: string }> = {
    Accepted:      { label: 'Accepted',     color: '#43B75D', bg: '#ECFDF5', border: '#81cf92' },
    Rejected:      { label: 'Rejected',     color: '#ff4d4f', bg: '#fff1f0', border: '#fca5a5' },
    'Under Review':{ label: 'Under Review', color: '#fa8c16', bg: '#fff7e6', border: '#ffd591' },
    'Under review':{ label: 'Under Review', color: '#fa8c16', bg: '#fff7e6', border: '#ffd591' },
    Shortlisted:   { label: 'Shortlisted',  color: '#D97706', bg: '#FFFBEB', border: '#fde68a' },
};

export const LABEL_COL_WIDTH = 367;
export const VENDOR_COL_MIN  = 220;

export const OUTER_BORDER  = '1px solid #c4c4c4';
export const CELL_BORDER   = '1px solid #cbd5e1';
export const ACCEPT_BORDER = '1px solid #81cf92';
export const LABEL_BG      = '#f1f5f9';
export const ACCEPT_BG     = '#ecfdf5';
export const CELL_PAD      = '16px 30px';

export const getProposalColumns = (onView: (id: number, rfqId: number) => void): TableColumnsType<any> => [
    {
        title: 'Proposal ID', key: 'proposalId',
        render: (_: any, row: any) => (
            <Typography.Text className="text-[13px] text-[#171717] font-normal">
                {row.refNumber ?? 'N/A'}
            </Typography.Text>
        ),
    },
    {
        title: 'RFQ ID', key: 'rfq',
        render: (_: any, row: any) => (
            <Flex vertical gap={2}>
                <Typography.Text className="text-[13px] text-[#171717] font-normal">
                    {row.rfq?.refNumber ?? 'N/A'}
                </Typography.Text>
                <Typography.Text className="text-[12px] text-[#94a3b8]">
                    {(row.rfq?.title ?? '').length > 28 ? `${(row.rfq?.title ?? '').substring(0, 28)}...` : (row.rfq?.title ?? '')}
                </Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Vendor', key: 'vendor',
        render: (_: any, row: any) => (
            <Typography.Text className="text-[13px] text-[#171717]">{row.vendor?.businessName ?? 'N/A'}</Typography.Text>
        ),
    },
    {
        title: 'Total', dataIndex: 'totalAmount', key: 'totalAmount',
        render: (v: string) => <Typography.Text className="text-[13px] text-[#171717] ">{v != null && v !== '' ? <>₹ {Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</> : 'N/A'}</Typography.Text>,
    },
    {
        title: 'Valid until', dataIndex: 'validUntil', key: 'validUntil',
        render: (v: string) => (
            <Typography.Text className="text-[13px] text-[#171717]">{formatShortDate(v)}</Typography.Text>
        ),
    },
    
    {
        title: 'Mode', dataIndex: 'submissionMode', key: 'submissionMode',
        render: (v: string) => v ? (
            <span className="inline-block bg-[#f8fafc] text-[#94a3b8] rounded-[20px] py-0.5 px-2.5 text-[13px] font-medium">
                {v}
            </span>
        ) : <Typography.Text className="text-[13px] text-[#94a3b8]">-</Typography.Text>,
    },
    {
        title: 'Status', dataIndex: 'status', key: 'status',
        render: (status: string) => {
            const cfg = statusCfg[status] ?? { label: status, color: '#595959', bg: '#f5f5f5' };
            return (
                <Tag className="border-none rounded-[6px] font-medium" style={{ color: cfg.color, background: cfg.bg }}>
                    {cfg.label}
                </Tag>
            );
        },
    },
    {
        title: 'Actions', key: 'actions',
        render: (_: any, row: any) => (
            <Button size="small" danger variant="outlined" className="rounded-[6px]" onClick={() => onView(row.id, row.rfqId)}>
                View
            </Button>
        ),
    },
];

export const proposalDetailLineItemColumns = [
    { title: 'Description', dataIndex: 'description', key: 'description', width: 260, onHeaderCell: () => ({ style: { paddingLeft: 20 } }), onCell: () => ({ style: { paddingLeft: 20 } }), render: (v: any) => <Typography.Text style={{ fontSize: 14, whiteSpace: 'normal', wordBreak: 'break-word' }}>{v}</Typography.Text> },
    { title: 'Qty',         dataIndex: 'qty',         key: 'qty',         width: 80,  render: (v: any) => <Typography.Text style={{ fontSize: 14 }}>{v}</Typography.Text> },
    { title: 'Unit Price',  dataIndex: 'unitPrice',   key: 'unitPrice',   width: 120, render: (v: any) => <Typography.Text style={{ fontSize: 14 }}>{v != null ? `₹ ${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}</Typography.Text> },
    { title: 'GST Rate',    dataIndex: 'taxRate',     key: 'taxRate',     width: 90,  render: (v: any) => <Typography.Text style={{ fontSize: 14 }}>{v != null ? `GST ${Number(v)}%` : '—'}</Typography.Text> },
    { title: 'GST Type',    dataIndex: 'gstType',     key: 'gstType',     width: 100, render: (v: any) => <Typography.Text style={{ fontSize: 14 }}>{{ inclusive: 'Inclusive', exclusive: 'Exclusive' }[v as string] ?? '—'}</Typography.Text> },
    {
        title: 'Net Amount', key: 'total', width: 120,
        render: (_: any, record: any) => {
            const qty = Number(record.qty);
            const unitPrice = Number(record.unitPrice);
            let total: number | null = null;
            if (record.taxRate != null && record.gstType) {
                const base = qty * unitPrice;
                total = record.gstType === 'inclusive' ? base : base * (1 + Number(record.taxRate) / 100);
            } else if (record.total != null) {
                total = Number(record.total);
            } else if (record.qty != null && record.unitPrice != null) {
                total = qty * unitPrice;
            }
            return (
                <Typography.Text style={{ fontSize: 14 }}>
                    {total != null ? `₹ ${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                </Typography.Text>
            );
        },
    },
];

export const proposalCardStyle: React.CSSProperties = {
    borderRadius: 36,
    border: '1px solid #e6e3dd',
    boxShadow: '0px 1.558px 15.58px 1.434px rgba(0,0,0,0.06)',
};

export const proposalRightCardStyle: React.CSSProperties = {
    borderRadius: 38,
    border: '1px solid #e6e3dd',
    boxShadow: '0px 1.558px 15.58px 1.434px rgba(0,0,0,0.06)',
};

export const proposalSubCardStyle: React.CSSProperties = {
    borderRadius: 22,
    border: '0.37px solid #eaeaea',
    overflow: 'hidden',
};
