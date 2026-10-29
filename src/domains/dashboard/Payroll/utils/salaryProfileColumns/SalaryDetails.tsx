import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

export type SalaryBreakdownRow = {
    component: string;
    category: string;
    amount: string;
    status: string;
};

export const salaryBreakdownData: SalaryBreakdownRow[] = [
    { component: 'Basic Salary', category: 'Earnings', amount: '₹ 80,000',status: 'Paid' },
    { component: 'Dearness Pay', category: 'Bonus', amount: '₹ 3,000',status: 'Paid' },
    { component: 'Leave Travel Allowance', category: 'Allowance', amount: '₹ 3,000' ,status: 'Paid'},
    { component: 'House Rent Allowance', category: 'Allowance', amount: '₹ 3,000',status: 'Paid' },
    { component: 'Conveyance Allowance', category: 'Allowance', amount: '₹ 3,000',status: 'Paid' },
    { component: 'Overtime Allowance', category: 'Bonus', amount: '₹ 6,000' ,status: 'Paid'},
    { component: 'Medical Allowance', category: 'Bonus', amount: '₹ 3,000',status: 'Paid' },
    { component: 'Health Insurance Deduction', category: 'Deduction', amount: '₹ 3,000' ,status: 'Paid'},
    { component: 'ESI', category: 'Deduction', amount: '₹ 3,000',status: 'Paid' },
    { component: 'EPF', category: 'Deduction', amount: '₹ 3,000',status: 'Paid' },
    { component: 'LWF', category: 'Deduction', amount: '₹ 3,000' ,status: 'Paid'},
    { component: 'Professional Tax', category: 'Deduction', amount: '₹ 3,000',status: 'Paid' },
];

export const getSalaryBreakdownColumns = (): ColumnsType<SalaryBreakdownRow> => [
    {
        title: 'Component Name',
        dataIndex: 'component',
        key: 'component',
    },
    {
        title: 'Category',
        dataIndex: 'category',
        key: 'category',
    },
    {
        title: 'Amount/Percentage',
        dataIndex: 'amount',
        key: 'amount',
    },
     {
            title: 'Status',
            key: 'status',
            dataIndex: 'status',
            render: (status: any) => (
                <Tag
                    style={{
                        backgroundColor: status === 'Active' ? '#e6f9f0' : '#ffebeb',
                        color: status === 'Active' ? '#28a745' : '#ff4d4f',
                        borderRadius: '20px',
                        padding: '4px 12px',
                        border: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                    }}
                >
                      ● {status}
                </Tag>
            ),
        },
];
