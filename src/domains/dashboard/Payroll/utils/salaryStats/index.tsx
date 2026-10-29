import { Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table/interface';

import { SalaryStatsRecord } from '../../types/salaryStats';

const { Text } = Typography;

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const YEARS = ['2024', '2025', '2026'];

export const salaryStatsColumns: ColumnsType<SalaryStatsRecord> = [
    {
        title: 'Emp ID',
        dataIndex: 'empId',
        key: 'empId',
        width: 100,
        render: (val: string) => (
            <Text style={{ fontSize: 14, color: '#42526D' }}>{val}</Text>
        ),
    },
    {
        title: 'Employee Name',
        dataIndex: 'name',
        key: 'name',
        width: 180,
        render: (val: string) => (
            <Text style={{ fontSize: 14, fontWeight: 500, color: '#101828' }}>{val}</Text>
        ),
    },
    ...MONTHS.map(month => ({
        title: month,
        key: month,
        width: 110,
        render: (_: unknown, row: SalaryStatsRecord) => {
            const val = row.salaries[month];
            const amount = Number(val);
            const hasAmount = val !== undefined && val !== null && Number.isFinite(amount);
            return (
                <Text style={{ fontSize: 14, color: '#42526D' }}>
                    {hasAmount ? `₹${amount.toLocaleString('en-IN')}` : '—'}
                </Text>
            );
        },
    })),
];
