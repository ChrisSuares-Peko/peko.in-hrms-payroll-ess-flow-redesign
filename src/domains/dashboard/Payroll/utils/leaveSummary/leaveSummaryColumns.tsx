import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Space, TableColumnsType, Typography } from 'antd';

import { formattedDateOnly } from '@utils/dateFormat';

export const getLeaveSummaryColumns = (
    handleDelete: (id: any) => void,
    handleEdit: (id: any) => void,
    
): TableColumnsType<any> => [
    {
        title: 'Leave Type',
        dataIndex: 'leaveType',
        key: 'leaveType',
        render: (leaveType, record) => (
            <Typography.Text strong>{leaveType?.typeOfLeave}</Typography.Text>
        ),
    },

    {
        title: 'Start Date',
        dataIndex: 'startDate',
        key: 'from',
        render: (date: string) => formattedDateOnly(new Date(date)),
    },
    {
        title: 'End Date',
        dataIndex: 'endDate',
        key: 'to',
        render: (date: string) => formattedDateOnly(new Date(date)),
    },
    {
        title: 'Leave Taken',
        dataIndex: 'leaveTaken',
        key: 'leaveTaken',
        render: (days: number) => `${days}`,
    },

    {
        title: <Typography.Text>Action</Typography.Text>,
        dataIndex: 'action',
        key: 'action',

        render: (text, record) => (
            <Space size="middle">
                <Button
                    className="border-0"
                    onClick={() => {
                      
                        handleDelete(record);
                    }}
                >
                    <DeleteOutlined className="text-[#E30000]" />
                </Button>
                <Button className="border-0" onClick={() => handleEdit(record)}>
                    <EditOutlined className="text-[#E30000]" />
                </Button>
            </Space>
        ),
    },
];


