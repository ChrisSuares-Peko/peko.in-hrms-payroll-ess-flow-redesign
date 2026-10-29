import React from 'react';

import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { STATUS_STYLE } from '../../constants/style';
import { formatDate, toTitleCase } from '../helperFunctions';

export type AgingInvoiceRow = {
    id: string;
    invoiceNo: string;
    customerName: string;
    issueDate: string;
    dueDate: string;
    total: string;
    paid: string;
    outstanding: string;
    daysOverdue: number | null;
    status: string;
};

const getDaysOverdueBadge = (days: number | null) => {
    if (days === null || days <= 0) {
        return <span className="text-sm text-gray-400">On time</span>;
    }

    let color = '#D97706';
    let bg = '#FEF3C7';
    let border = '#FDE68A';

    if (days > 90) {
        color = '#991B1B'; bg = '#FEE2E2'; border = '#FECACA';
    } else if (days > 60) {
        color = '#DC2626'; bg = '#FEE2E2'; border = '#FECACA';
    } else if (days > 30) {
        color = '#EA580C'; bg = '#FFEDD5'; border = '#FED7AA';
    }

    return (
        <span
            className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold border"
            style={{ color, backgroundColor: bg, borderColor: border }}
        >
            {days}d
        </span>
    );
};

export const buildAgingColumns = (): ColumnsType<AgingInvoiceRow> => [
    {
        title: 'Invoice #',
        key: 'invoiceNo',
        render: (_v, r) => <span className="text-sm font-medium text-gray-900">{r.invoiceNo}</span>,
    },
    {
        title: 'Customer',
        key: 'customerName',
        render: (_v, r) => <span className="text-sm text-gray-900">{r.customerName}</span>,
    },
    {
        title: 'Issue Date',
        key: 'issueDate',
        render: (_v, r) => <span className="text-sm text-gray-700">{formatDate(r.issueDate)}</span>,
    },
    {
        title: 'Due Date',
        key: 'dueDate',
        render: (_v, r) => <span className="text-sm text-gray-700">{formatDate(r.dueDate)}</span>,
    },
    {
        title: 'Total',
        key: 'total',
        render: (_v, r) => <span className="text-sm font-medium text-gray-900">{r.total}</span>,
    },
    {
        title: 'Paid',
        key: 'paid',
        render: (_v, r) => <span className="text-sm text-green-600">{r.paid}</span>,
    },
    {
        title: 'Outstanding',
        key: 'outstanding',
        dataIndex: 'outstanding',
        sorter: true,
        render: (_v, r) => <span className="text-sm font-semibold text-red-600">{r.outstanding}</span>,
    },
    {
        title: 'Days Overdue',
        key: 'daysOverdue',
        dataIndex: 'daysOverdue',
        sorter: true,
        render: (_v, r) => getDaysOverdueBadge(r.daysOverdue),
    },
    {
        title: 'Status',
        key: 'status',
        render: (_v, r) => {
            const key = r.status ? toTitleCase(r.status) : '';
            return (
                <Tag className={`rounded-full text-xs font-medium border-0 px-3 py-1 ${STATUS_STYLE[key] ?? 'bg-[#F4F4F5] text-[#71717A]'}`}>
                    {key}
                </Tag>
            );
        },
    },
];
