import { Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { fmt } from './gstr2bConstants';
import type { MatchStatus } from './gstr2bTypes';

export const getStatusBg = (s: MatchStatus) => {
    if (s === 'Matched') return '#ecfdf5';
    if (s === 'Unmatched') return '#fffbeb';
    return '#eff6ff';
};

export const getStatusColor = (s: MatchStatus) => {
    if (s === 'Matched') return '#43b75d';
    if (s === 'Unmatched') return '#f59e0b';
    return '#3b82f6';
};

export const statusBadge = (val: MatchStatus) => (
    <span
        style={{
            backgroundColor: getStatusBg(val),
            color: getStatusColor(val),
            borderRadius: 60,
            padding: '2px 10px',
            fontSize: 12,
            fontWeight: 500,
        }}
    >
        {val}
    </span>
);

const textSm = (v: string, extra?: React.CSSProperties) => (
    <Typography.Text className="text-sm" style={{ color: '#475569', ...extra }}>
        {v}
    </Typography.Text>
);

export const b2bColumns: ColumnsType<any> = [
    {
        title: 'Supplier Name',
        dataIndex: 'supplierName',
        key: 'supplierName',
        fixed: 'left',
        render: (v: string) => (
            <Typography.Text className="text-sm font-medium" style={{ color: '#1e293b' }}>
                {v}
            </Typography.Text>
        ),
    },
    {
        title: 'Supplier GSTIN',
        dataIndex: 'gstin',
        key: 'gstin',
        render: (v: string) => (
            <Typography.Text className="text-sm font-mono" style={{ color: '#475569' }}>
                {v}
            </Typography.Text>
        ),
    },
    {
        title: 'Invoice No',
        dataIndex: 'invoiceNo',
        key: 'invoiceNo',
        render: (v: string) => (
            <Typography.Text className="text-sm" style={{ color: '#1e293b' }}>
                {v}
            </Typography.Text>
        ),
    },
    { title: 'Date', dataIndex: 'date', key: 'date', render: (v: string) => textSm(v) },
    {
        title: 'Taxable Value (₹)',
        dataIndex: 'taxable',
        key: 'taxable',
        render: (v: number) => textSm(`₹${fmt(v)}`),
    },
    {
        title: 'IGST (₹)',
        dataIndex: 'igst',
        key: 'igst',
        render: (v: number) => textSm(`₹${fmt(v)}`),
    },
    {
        title: 'CGST (₹)',
        dataIndex: 'cgst',
        key: 'cgst',
        render: (v: number) => textSm(`₹${fmt(v)}`),
    },
    {
        title: 'SGST (₹)',
        dataIndex: 'sgst',
        key: 'sgst',
        render: (v: number) => textSm(`₹${fmt(v)}`),
    },
    {
        title: 'Total ITC (₹)',
        dataIndex: 'itc',
        key: 'itc',
        render: (v: number) => (
            <Typography.Text className="text-sm font-medium" style={{ color: '#43b75d' }}>
                ₹{fmt(v)}
            </Typography.Text>
        ),
    },
    {
        title: 'RC',
        dataIndex: 'reverseCharge',
        key: 'reverseCharge',
        width: 60,
        render: (v: boolean) => (
            <Typography.Text className="text-sm" style={{ color: v ? '#43b75d' : '#ff4f4f' }}>
                {v ? 'Yes' : 'No'}
            </Typography.Text>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (v: MatchStatus) => statusBadge(v),
    },
];

export const b2baColumns: ColumnsType<any> = [
    {
        title: 'Supplier Name',
        dataIndex: 'supplierName',
        key: 'supplierName',
        fixed: 'left',
        render: (v: string) => (
            <Typography.Text className="text-sm font-medium" style={{ color: '#1e293b' }}>
                {v}
            </Typography.Text>
        ),
    },
    {
        title: 'Supplier GSTIN',
        dataIndex: 'gstin',
        key: 'gstin',
        render: (v: string) => (
            <Typography.Text className="text-sm font-mono" style={{ color: '#475569' }}>
                {v}
            </Typography.Text>
        ),
    },
    {
        title: 'Amended Invoice No',
        dataIndex: 'amendedInvoiceNo',
        key: 'amendedInvoiceNo',
        render: (v: string) => (
            <Typography.Text className="text-sm" style={{ color: '#1e293b' }}>
                {v}
            </Typography.Text>
        ),
    },
    {
        title: 'Amended Date',
        dataIndex: 'amendedDate',
        key: 'amendedDate',
        render: (v: string) => textSm(v),
    },
    {
        title: 'Original Invoice',
        dataIndex: 'originalInvoice',
        key: 'originalInvoice',
        render: (v: string) => textSm(v),
    },
    {
        title: 'Total ITC (₹)',
        dataIndex: 'itc',
        key: 'itc',
        render: (v: number) => (
            <Typography.Text className="text-sm font-medium" style={{ color: '#43b75d' }}>
                ₹{fmt(v)}
            </Typography.Text>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (v: MatchStatus) => statusBadge(v),
    },
];

export const cdnColumns: ColumnsType<any> = [
    {
        title: 'Supplier Name',
        dataIndex: 'supplierName',
        key: 'supplierName',
        fixed: 'left',
        render: (v: string) => (
            <Typography.Text className="text-sm font-medium" style={{ color: '#1e293b' }}>
                {v}
            </Typography.Text>
        ),
    },
    {
        title: 'Supplier GSTIN',
        dataIndex: 'gstin',
        key: 'gstin',
        render: (v: string) => (
            <Typography.Text className="text-sm font-mono" style={{ color: '#475569' }}>
                {v}
            </Typography.Text>
        ),
    },
    {
        title: 'Note No',
        dataIndex: 'noteNo',
        key: 'noteNo',
        render: (v: string) => (
            <Typography.Text className="text-sm" style={{ color: '#1e293b' }}>
                {v}
            </Typography.Text>
        ),
    },
    {
        title: 'Note Date',
        dataIndex: 'noteDate',
        key: 'noteDate',
        render: (v: string) => textSm(v),
    },
    {
        title: 'Note Type',
        dataIndex: 'noteType',
        key: 'noteType',
        render: (v: string) => (
            <span
                style={{
                    backgroundColor: v === 'Credit' ? '#ecfdf5' : '#fff7ed',
                    color: v === 'Credit' ? '#43b75d' : '#f97316',
                    borderRadius: 60,
                    padding: '2px 10px',
                    fontSize: 12,
                    fontWeight: 500,
                }}
            >
                {v}
            </span>
        ),
    },
    {
        title: 'Taxable Value (₹)',
        dataIndex: 'taxableValue',
        key: 'taxableValue',
        render: (v: number) => textSm(`₹${fmt(v)}`),
    },
    {
        title: 'IGST (₹)',
        dataIndex: 'igst',
        key: 'igst',
        render: (v: number) => textSm(`₹${fmt(v)}`),
    },
    {
        title: 'CGST (₹)',
        dataIndex: 'cgst',
        key: 'cgst',
        render: (v: number) => textSm(`₹${fmt(v)}`),
    },
    {
        title: 'SGST (₹)',
        dataIndex: 'sgst',
        key: 'sgst',
        render: (v: number) => textSm(`₹${fmt(v)}`),
    },
    {
        title: 'Total ITC (₹)',
        dataIndex: 'itc',
        key: 'itc',
        render: (v: number) => (
            <Typography.Text className="text-sm font-medium" style={{ color: '#43b75d' }}>
                ₹{fmt(v)}
            </Typography.Text>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (v: MatchStatus) => statusBadge(v),
    },
];

export const impgColumns: ColumnsType<any> = [
    {
        title: 'Supplier Name',
        dataIndex: 'supplierName',
        key: 'supplierName',
        render: (v: string) => (
            <Typography.Text className="text-sm font-medium" style={{ color: '#1e293b' }}>
                {v || '—'}
            </Typography.Text>
        ),
    },
    {
        title: 'Bill of Entry No.',
        dataIndex: 'billNo',
        key: 'billNo',
        render: (v: string) => (
            <Typography.Text className="text-sm" style={{ color: '#1e293b' }}>
                {v}
            </Typography.Text>
        ),
    },
    { title: 'B/E Date', dataIndex: 'billDate', key: 'billDate', render: (v: string) => textSm(v) },
    {
        title: 'Port Code',
        dataIndex: 'portCode',
        key: 'portCode',
        render: (v: string) => (
            <Typography.Text className="text-sm font-mono" style={{ color: '#475569' }}>
                {v}
            </Typography.Text>
        ),
    },
    {
        title: 'Assessable Value (₹)',
        dataIndex: 'taxable',
        key: 'taxable',
        render: (v: number) => textSm(`₹${fmt(v)}`),
    },
    {
        title: 'IGST Paid (₹)',
        dataIndex: 'igst',
        key: 'igst',
        render: (v: number) => textSm(`₹${fmt(v)}`),
    },
    {
        title: 'Cess (₹)',
        dataIndex: 'cess',
        key: 'cess',
        render: (v: number) => textSm(v ? `₹${fmt(v)}` : '—'),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (v: MatchStatus) => statusBadge(v),
    },
];

export const isdColumns: ColumnsType<any> = [
    {
        title: 'ISD Name',
        dataIndex: 'isdName',
        key: 'isdName',
        render: (v: string) => (
            <Typography.Text className="text-sm font-medium" style={{ color: '#1e293b' }}>
                {v}
            </Typography.Text>
        ),
    },
    {
        title: 'ISD GSTIN',
        dataIndex: 'isdGstin',
        key: 'isdGstin',
        render: (v: string) => (
            <Typography.Text className="text-sm font-mono" style={{ color: '#475569' }}>
                {v}
            </Typography.Text>
        ),
    },
    {
        title: 'Document Type',
        dataIndex: 'docType',
        key: 'docType',
        render: (v: string) => {
            const isInvoice = v?.toLowerCase().includes('invoice');
            return (
                <span
                    style={{
                        backgroundColor: isInvoice ? '#ecfdf5' : '#fff7ed',
                        color: isInvoice ? '#43b75d' : '#f97316',
                        borderRadius: 60,
                        padding: '2px 10px',
                        fontSize: 12,
                        fontWeight: 500,
                    }}
                >
                    {v}
                </span>
            );
        },
    },
    {
        title: 'Document No.',
        dataIndex: 'docNo',
        key: 'docNo',
        render: (v: string) => (
            <Typography.Text className="text-sm" style={{ color: '#1e293b' }}>
                {v}
            </Typography.Text>
        ),
    },
    {
        title: 'Document Date',
        dataIndex: 'docDate',
        key: 'docDate',
        render: (v: string) => textSm(v),
    },
    {
        title: 'IGST (₹)',
        dataIndex: 'igst',
        key: 'igst',
        render: (v: number) => textSm(v ? `₹${fmt(v)}` : '—'),
    },
    {
        title: 'CGST (₹)',
        dataIndex: 'cgst',
        key: 'cgst',
        render: (v: number) => textSm(v ? `₹${fmt(v)}` : '—'),
    },
    {
        title: 'SGST (₹)',
        dataIndex: 'sgst',
        key: 'sgst',
        render: (v: number) => textSm(v ? `₹${fmt(v)}` : '—'),
    },
    {
        title: 'Cess (₹)',
        dataIndex: 'cess',
        key: 'cess',
        render: (v: number) => textSm(v ? `₹${fmt(v)}` : '—'),
    },
];

export const tdsColumns: ColumnsType<any> = [
    {
        title: 'Deductor GSTIN',
        dataIndex: 'deductorGstin',
        key: 'deductorGstin',
        render: (v: string) => (
            <Typography.Text className="text-sm font-mono" style={{ color: '#1e293b' }}>
                {v}
            </Typography.Text>
        ),
    },
    {
        title: 'Deductor Name',
        dataIndex: 'deductorName',
        key: 'deductorName',
        render: (v: string) => (
            <Typography.Text className="text-sm font-medium" style={{ color: '#475569' }}>
                {v || '—'}
            </Typography.Text>
        ),
    },
    {
        title: 'TDS Amount (₹)',
        dataIndex: 'tdsAmount',
        key: 'tdsAmount',
        render: (v: number) => textSm(`₹${fmt(v)}`),
    },
    {
        title: 'Period',
        dataIndex: 'period',
        key: 'period',
        render: (v: string) => textSm(v || '—'),
    },
    {
        title: 'Cash Ledger Credit (₹)',
        dataIndex: 'cashLedgerCredit',
        key: 'cashLedgerCredit',
        render: (v: number) => textSm(`₹${fmt(v)}`),
    },
];

export const tcsColumns: ColumnsType<any> = [
    {
        title: 'E-Commerce Operator',
        dataIndex: 'operatorName',
        key: 'operatorName',
        render: (v: string) => (
            <Typography.Text className="text-sm font-medium" style={{ color: '#1e293b' }}>
                {v}
            </Typography.Text>
        ),
    },
    {
        title: 'ECO GSTIN',
        dataIndex: 'ecoGstin',
        key: 'ecoGstin',
        render: (v: string) => (
            <Typography.Text className="text-sm font-mono" style={{ color: '#475569' }}>
                {v}
            </Typography.Text>
        ),
    },
    {
        title: 'Supplies through ECO (₹)',
        dataIndex: 'suppliesValue',
        key: 'suppliesValue',
        render: (v: number) => textSm(`₹${fmt(v)}`),
    },
    {
        title: 'TCS Collected (₹)',
        dataIndex: 'tcsCollected',
        key: 'tcsCollected',
        render: (v: number) => textSm(`₹${fmt(v)}`),
    },
    {
        title: 'Period',
        dataIndex: 'period',
        key: 'period',
        render: (v: string) => textSm(v || '—'),
    },
];

export const amdColumns: ColumnsType<any> = [
    {
        title: 'Original Document',
        dataIndex: 'originalDoc',
        key: 'originalDoc',
        render: (v: string) => (
            <Typography.Text className="text-sm font-mono font-medium" style={{ color: '#1e293b' }}>
                {v}
            </Typography.Text>
        ),
    },
    {
        title: 'Amendment Type',
        dataIndex: 'amendmentType',
        key: 'amendmentType',
        render: (v: string) => (
            <span
                style={{
                    backgroundColor: v === 'Invoice' ? '#ecfdf5' : '#eff6ff',
                    color: v === 'Invoice' ? '#43b75d' : '#3b82f6',
                    borderRadius: 60,
                    padding: '2px 10px',
                    fontSize: 12,
                    fontWeight: 500,
                }}
            >
                {v}
            </span>
        ),
    },
    {
        title: 'Changed By',
        dataIndex: 'changedBy',
        key: 'changedBy',
        render: (v: string) => (
            <Typography.Text className="text-sm font-medium" style={{ color: '#1e293b' }}>
                {v}
            </Typography.Text>
        ),
    },
    {
        title: 'Change Date',
        dataIndex: 'changeDate',
        key: 'changeDate',
        render: (v: string) => textSm(v),
    },
    {
        title: 'What Changed',
        dataIndex: 'whatChanged',
        key: 'whatChanged',
        render: (v: string) => (
            <Typography.Text className="text-xs" style={{ color: '#475569', lineHeight: '1.5' }}>
                {v}
            </Typography.Text>
        ),
    },
    {
        title: 'ITC Impact (₹)',
        dataIndex: 'itcImpact',
        key: 'itcImpact',
        render: (v: number, r: any) => (
            <Typography.Text
                className="text-sm font-semibold"
                style={{ color: r.itcSign === '+' ? '#43b75d' : '#ef4444' }}
            >
                {r.itcSign}₹{fmt(v)}
            </Typography.Text>
        ),
    },
];
