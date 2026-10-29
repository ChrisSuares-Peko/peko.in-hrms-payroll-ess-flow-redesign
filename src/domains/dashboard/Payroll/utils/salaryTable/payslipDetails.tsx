import { DownloadOutlined, MailOutlined } from '@ant-design/icons';
import { Badge, Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';

export interface PayslipType {
    id: string;
    payrunDate: string;
    payrunMode: string;
    status: 'Paid' | 'Pending';
    totalPaid: string;
}

export const getPayslipColumns = (): ColumnsType<PayslipType> => [
    {
        title: 'Payrun',
        dataIndex: 'payrunDate',
        key: 'payrunDate',
    },
    {
        title: 'Payrun Mode',
        dataIndex: 'payrunMode',
        key: 'payrunMode',
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => (
            <Badge color={status === 'Paid' ? 'green' : 'orange'} text={status} />
        ),
    },
    {
        title: 'Total Paid',
        dataIndex: 'totalPaid',
        key: 'totalPaid',
    },
    {
        title: 'Action',
        key: 'action',
        render: () => (
            <Space size="middle">
                <Button className="text-textRed" type="text" icon={<MailOutlined />} />
                <Button className="text-textRed" type="text" icon={<DownloadOutlined />} />
            </Space>
        ),
    },
];

export const payslipData: PayslipType[] = [
    {
        id: '1',
        payrunDate: '08-04-2023',
        payrunMode: 'N/A',
        status: 'Paid',
        totalPaid: '₹ 10,000',
    },
    {
        id: '2',
        payrunDate: '08-04-2023',
        payrunMode: 'N/A',
        status: 'Paid',
        totalPaid: '₹ 10,000',
    },
    {
        id: '3',
        payrunDate: '08-04-2023',
        payrunMode: 'N/A',
        status: 'Paid',
        totalPaid: '₹ 10,000',
    },
    {
        id: '4',
        payrunDate: '08-04-2023',
        payrunMode: 'N/A',
        status: 'Paid',
        totalPaid: '₹ 10,000',
    },
];
