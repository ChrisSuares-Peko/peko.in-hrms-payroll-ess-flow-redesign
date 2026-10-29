import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Avatar, Button, Flex, Space, Tag, Typography } from 'antd';
import type { TableProps } from 'antd';

import { AttendanceRow } from '../../types/attendance/attendanceTypes';

export const attendanceTableColumns = (
    handleEdit: (row: AttendanceRow) => void,
    handleDelete: (row: AttendanceRow) => void
): TableProps<AttendanceRow>['columns'] => [
    {
        title: <Typography.Text>Name</Typography.Text>,
        dataIndex: 'employeeName',
        key: 'employeeName',
        render: (name: string, record: AttendanceRow) => {
            const initials = name
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);

            return (
                <Flex vertical>
                    <Space>
                        <Avatar style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}>
                            {initials}
                        </Avatar>
                        <Typography.Text strong>{name}</Typography.Text>
                    </Space>
                    <Typography.Text type="secondary" className="text-sm">
                        {record.employeeMail}
                    </Typography.Text>
                </Flex>
            );
        },
    },
    {
        title: <Typography.Text>Employee ID</Typography.Text>,
        dataIndex: 'employeeId',
        key: 'employeeId',
        render: id => <Tag>{id}</Tag>,
    },
    {
        title: <Typography.Text>Total Work Days</Typography.Text>,
        dataIndex: 'totalWorkDays',
        key: 'totalWorkDays',
    },
    {
        title: <Typography.Text>Loss of Pay</Typography.Text>,
        dataIndex: 'lossOfPay',
        key: 'lossOfPay',
    },
    {
        title: <Typography.Text>Total Pay Days</Typography.Text>,
        dataIndex: 'totalPayDays',
        key: 'totalPayDays',
    },
    {
        title: <Typography.Text>Action</Typography.Text>,
        key: 'action',
        render: (_, record) => (
            <Space>
                <Button className="border-0" onClick={() => handleEdit(record)}>
                    <EditOutlined className="text-[#E30000]" />
                </Button>
                <Button className="border-0" onClick={() => handleDelete(record)}>
                    <DeleteOutlined className="text-[#E30000]" />
                </Button>
            </Space>
        ),
    },
];
