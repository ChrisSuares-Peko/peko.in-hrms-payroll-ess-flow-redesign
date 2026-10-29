import { Flex, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import type { OneTimePayment } from '../../api/salaryHistoryApi/salaryHistoryDetail';

const { Text } = Typography;

export type { OneTimePayment };

export interface PayrollHistoryDetailRecord {
    key: string;
    empId: string;
    name: string;
    email: string;
    grossSalary: number;
    deduction: number;
    netSalary: number;
    status: 'Paid' | 'Pending' | 'Upcoming' | 'Approved';
    oneTimePayments: OneTimePayment[];
}

export const payrollDetailStatusConfig: Record<PayrollHistoryDetailRecord['status'], { bg: string; color: string }> = {
    Paid: { bg: '#ECFDF5', color: '#03A254' },
    Approved: { bg: '#ECFDF5', color: '#03A254' },
    Pending: { bg: '#FFFBEB', color: '#F59E0B' },
    Upcoming: { bg: '#FFFBEB', color: '#F59E0B' },
};

export const getPayrollHistoryDetailColumns = (): ColumnsType<PayrollHistoryDetailRecord> => [
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
        render: (_: unknown, row: PayrollHistoryDetailRecord) => (
            <Flex vertical gap={2}>
                <Text style={{ fontSize: 15, fontWeight: 500, color: '#1E293B' }}>{row.name}</Text>
                <Text style={{ fontSize: 12, color: '#8993A4' }}>{row.email}</Text>
            </Flex>
        ),
    },
    {
        title: <Text style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>Gross salary</Text>,
        dataIndex: 'grossSalary',
        key: 'grossSalary',
        render: (val: number) => (
            <Text style={{ fontSize: 15, color: '#1E293B' }}>₹{(val ?? 0).toLocaleString('en-IN')}</Text>
        ),
    },
    {
        title: <Text style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>Deduction</Text>,
        dataIndex: 'deduction',
        key: 'deduction',
        render: (val: number) => (
            <Text style={{ fontSize: 15, color: '#1E293B' }}>₹{(val ?? 0).toLocaleString('en-IN')}</Text>
        ),
    },
    {
        title: <Text style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>Net Payable Salary</Text>,
        dataIndex: 'netSalary',
        key: 'netSalary',
        render: (val: number) => (
            <Text style={{ fontSize: 15, fontWeight: 500, color: '#1E293B' }}>₹{(val ?? 0).toLocaleString('en-IN')}</Text>
        ),
    },
    {
        title: <Text style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>Status</Text>,
        dataIndex: 'status',
        key: 'status',
        render: (val: PayrollHistoryDetailRecord['status']) => {
            const cfg = payrollDetailStatusConfig[val] ?? payrollDetailStatusConfig.Pending;
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
