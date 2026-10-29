import { Button, Flex, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { NavigateFunction } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import type { OneTimePayment } from '../../api/salaryHistoryApi/salaryHistoryDetail';

const { Text } = Typography;

export interface SalaryHistoryRecord {
    key: string;
    month: string;
    monthNumber: number;
    year: number;
    employees: number;
    salariesProcessed: number;
    totalPayout: number;
    status: string;
}

export type { OneTimePayment };

export interface DetailRecord {
    key: string;
    empId: string;
    name: string;
    email: string;
    accountPrimary: string;
    accountLabel: string;
    transType: 'NEFT' | 'UPI' | 'IMPS' | 'RTGS';
    grossSalary: number;
    deduction: number;
    netSalary: number;
    status: 'Paid' | 'Pending';
    oneTimePayments: OneTimePayment[];
}

export const statusConfig: Record<DetailRecord['status'], { bg: string; color: string }> = {
    Paid: { bg: '#ECFDF5', color: '#03A254' },
    Pending: { bg: '#FFFBEB', color: '#F59E0B' },
};

export const getSalaryHistoryColumns = (navigate: NavigateFunction): ColumnsType<SalaryHistoryRecord> => [
    {
        title: <Text style={{ fontSize: 14, color: '#101828', fontWeight: 600 }}>Salary Month</Text>,
        dataIndex: 'month',
        key: 'month',
        render: (val: string) => (
            <Text style={{ fontSize: 14, color: '#101828', fontWeight: 500 }}>{val}</Text>
        ),
    },
    {
        title: <Text style={{ fontSize: 14, color: '#101828', fontWeight: 600 }}>Employees</Text>,
        dataIndex: 'employees',
        key: 'employees',
        render: (val: number) => (
            <Text style={{ fontSize: 14, color: '#42526D' }}>{val}</Text>
        ),
    },
    {
        title: <Text style={{ fontSize: 14, color: '#101828', fontWeight: 600 }}>Salaries Processed</Text>,
        dataIndex: 'salariesProcessed',
        key: 'salariesProcessed',
        render: (val: number) => (
            <Text style={{ fontSize: 14, color: '#42526D' }}>{val}</Text>
        ),
    },
    {
        title: <Text style={{ fontSize: 14, color: '#101828', fontWeight: 600 }}>Total Payout</Text>,
        dataIndex: 'totalPayout',
        key: 'totalPayout',
        render: (val: number) => (
            <Text style={{ fontSize: 14, color: '#42526D' }}>
                ₹{(val ?? 0).toLocaleString('en-IN')}
            </Text>
        ),
    },
    {
        title: <Text style={{ fontSize: 14, color: '#101828', fontWeight: 600 }}>Status</Text>,
        dataIndex: 'status',
        key: 'status',
        render: (val: string) => {
            const label = val
                ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()
                : '—';
            const styleMap: Record<string, { bg: string; border: string; color: string }> = {
                Completed: { bg: '#ECFDF5', border: '1px solid #CEF7E3', color: '#03A254' },
                Pending:   { bg: '#FFFBEB', border: '1px solid #FDE68A', color: '#F59E0B' },
                Failed:    { bg: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444' },
            };
            const s = styleMap[label] ?? { bg: '#F5F6F7', border: '1px solid #E2E8F0', color: '#42526D' };
            return (
                <Flex
                    align="center"
                    justify="center"
                    style={{
                        display: 'inline-flex',
                        background: s.bg,
                        border: s.border,
                        borderRadius: 20,
                        padding: '3px 12px',
                    }}
                >
                    <Text style={{ fontSize: 13, color: s.color, fontWeight: 500 }}>{label}</Text>
                </Flex>
            );
        },
    },
    {
        title: '',
        key: 'action',
        render: (_: unknown, record: SalaryHistoryRecord) => (
            <Button
                onClick={() =>
                    navigate(`/${paths.payroll.index}/${paths.payroll.salaryHistoryDetails}`, {
                        state: { record },
                    })
                }
                style={{
                    height: 34,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    border: '1px solid #FF4F4F',
                    color: '#FF4F4F',
                    background: '#FFFFFF',
                    padding: '0 16px',
                }}
            >
                View details
            </Button>
        ),
    },
];

export type OneTimePaymentRecord = OneTimePayment & { key: string };

export const otpStatusColor: Record<string, string> = {
    SUCCESS: '#03A254',
    FAILED: '#EF4444',
    PENDING: '#F59E0B',
    UPCOMING: '#F59E0B',
};

export const oneTimePaymentColumns: ColumnsType<OneTimePaymentRecord> = [
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (val: number) => (
            <Text style={{ fontSize: 13, color: '#1E293B' }}>
                ₹{(val ?? 0).toLocaleString('en-IN')}
            </Text>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'paymentStatus',
        key: 'paymentStatus',
        render: (val: string) => (
            <Tag
                style={{
                    borderRadius: 20,
                    padding: '2px 10px',
                    fontSize: 12,
                    fontWeight: 500,
                    color: otpStatusColor[val] ?? '#42526D',
                    background: '#F5F6F7',
                    border: 'none',
                }}
            >
                {val.charAt(0) + val.slice(1).toLowerCase()}
            </Tag>
        ),
    },
    {
        title: 'Reference ID',
        dataIndex: 'referenceId',
        key: 'referenceId',
        render: (val: string | null) => (
            <Text style={{ fontSize: 13, color: '#42526D' }}>{val ?? '—'}</Text>
        ),
    },
    {
        title: 'Remark',
        dataIndex: 'remark',
        key: 'remark',
        render: (val: string | null) => (
            <Text style={{ fontSize: 13, color: '#A1A1AA' }}>{val ?? '—'}</Text>
        ),
    },
    {
        title: 'Initiated At',
        dataIndex: 'initiatedAt',
        key: 'initiatedAt',
        render: (val: string | null) => (
            <Text style={{ fontSize: 13, color: '#42526D' }}>
                {val ? new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </Text>
        ),
    },
];

export const getSalaryHistoryDetailColumns = (): ColumnsType<DetailRecord> => [
    {
        title: <Text style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>Emp ID</Text>,
        dataIndex: 'empId',
        key: 'empId',
        render: (val: string) => (
            <Text style={{ fontSize: 15, color: '#171717' }}>{val}</Text>
        ),
    },
    {
        title: <Text style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>Employee name & email</Text>,
        key: 'name',
        render: (_: unknown, row: DetailRecord) => (
            <Flex vertical gap={2}>
                <Text style={{ fontSize: 15, fontWeight: 500, color: '#1E293B' }}>{row.name}</Text>
                <Text style={{ fontSize: 12, color: '#8993A4' }}>{row.email}</Text>
            </Flex>
        ),
    },
    {
        title: <Text style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>Account detail</Text>,
        key: 'accountDetail',
        render: (_: unknown, row: DetailRecord) => (
            <Flex vertical gap={2}>
                <Text style={{ fontSize: 15, color: '#42526D' }}>{row.accountPrimary}</Text>
                <Text style={{ fontSize: 12, color: '#8993A4' }}>{row.accountLabel}</Text>
            </Flex>
        ),
    },
    {
        title: <Text style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>Trans. type</Text>,
        dataIndex: 'transType',
        key: 'transType',
        render: (val: string) => (
            <Flex
                align="center"
                justify="center"
                style={{
                    display: 'inline-flex',
                    background: '#F7EEFF',
                    border: '1px solid #ECD3FF',
                    borderRadius: 50,
                    padding: '4px 8px',
                }}
            >
                <Text style={{ fontSize: 14, color: '#171717' }}>{val}</Text>
            </Flex>
        ),
    },
    {
        title: <Text style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>Gross salary</Text>,
        dataIndex: 'grossSalary',
        key: 'grossSalary',
        render: (val: number) => (
            <Text style={{ fontSize: 15, color: '#1E293B' }}>₹{(val ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        ),
    },
    {
        title: <Text style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>Deduction</Text>,
        dataIndex: 'deduction',
        key: 'deduction',
        render: (val: number) => (
            <Text style={{ fontSize: 15, color: '#1E293B' }}>₹{(val ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        ),
    },
    {
        title: <Text style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>Net Payable Salary</Text>,
        dataIndex: 'netSalary',
        key: 'netSalary',
        render: (val: number) => (
            <Text style={{ fontSize: 15, fontWeight: 500, color: '#1E293B' }}>₹{(val ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        ),
    },
    {
        title: <Text style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>Status</Text>,
        dataIndex: 'status',
        key: 'status',
        render: (val: DetailRecord['status']) => {
            const cfg = statusConfig[val];
            return (
                <Flex
                    align="center"
                    justify="center"
                    style={{
                        display: 'inline-flex',
                        background: cfg.bg,
                        borderRadius: 20,
                        padding: '3px 12px',
                        minWidth: 80,
                    }}
                >
                    <Text style={{ fontSize: 13, color: cfg.color, fontWeight: 500 }}>{val}</Text>
                </Flex>
            );
        },
    },
];
