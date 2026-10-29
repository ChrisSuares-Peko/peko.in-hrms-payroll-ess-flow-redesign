import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Avatar, Button, Flex, Space, TableProps, Typography } from 'antd';

import { formatDate } from '../helperFunctions';

function getInitials(name: string): string {
    const words = name.split(' ');
    const initials = words
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 3)
        .toUpperCase();
    return initials;
}

export const fleetUsageHistoryColumn = (
    handleDelete: (record: any) => void,
    handleEdit: (record: any) => void
): TableProps<any>['columns'] => [
    {
        title: 'Employee',
        dataIndex: 'employee',
        key: 'employee',
        render: (text: string, record: any) => (
            <Flex gap={10}>
                <Flex align="center">
                    <Avatar style={{ backgroundColor: '#fde3cf', color: 'red' }}>
                        {getInitials(text || 'N A')}
                    </Avatar>
                </Flex>
                <Flex vertical justify="center">
                    <Typography.Text className="text-base text-gray-900 ">
                        {text || 'N/A'}
                    </Typography.Text>
                    <Typography.Text className="text-sm font-normal text-slate-500">
                        {record?.employeeEmail}
                    </Typography.Text>
                </Flex>
            </Flex>
        ),
    },
    // {
    //     title: 'Department',
    //     dataIndex: 'department',
    //     key: 'department',
    // },
    {
        title: 'Assigned Date',
        dataIndex: 'assignDate',
        key: 'assignedDate',
        render: assignDate => formatDate(assignDate),
    },
    {
        title: 'Returned Date',
        dataIndex: 'returnDate',
        key: 'returnedDate',
        render: returnDate => (
            <Typography.Text>{returnDate ? formatDate(returnDate) : 'N/A'}</Typography.Text>
        ),
    },
    {
        title: 'Returned Status',
        dataIndex: 'returnStatus',
        key: 'returnedStatus',
        render: text => <Typography.Text>{text ? `${text}` : 'N/A'}</Typography.Text>,
    },
    {
        title: 'Remarks',
        dataIndex: 'remarks',
        key: 'remarks',
        render: text => <Typography.Text>{text ? `${text}` : 'N/A'}</Typography.Text>,
    },
    // {
    //     title: 'Status',
    //     dataIndex: 'status',
    //     key: 'status',
    //     render: status => {
    //         let colorClass = '';
    //         if (status === 'ACTIVE' || status === 'AVAILABLE') {
    //             colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
    //         } else if (status === 'IN USE') {
    //             colorClass = 'text-[#FDA700]';
    //         }
    //         const formattedStatus = formatText(status);
    //         return (
    //             <Typography.Text className={`${colorClass} font-normal px-3 py-1 rounded-2xl`}>
    //                 {formattedStatus}
    //             </Typography.Text>
    //         );
    //     },
    // },
    {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        width: '10%',
        render: (text, record) => (
            <Space size="middle">
                <Button className="border-0" onClick={() => handleDelete(record)}>
                    <DeleteOutlined className="text-[#E30000]" />
                </Button>
                <Button className="border-0" onClick={() => handleEdit(record)}>
                    <EditOutlined className="text-[#E30000]" />
                </Button>
            </Space>
        ),
    },
];
