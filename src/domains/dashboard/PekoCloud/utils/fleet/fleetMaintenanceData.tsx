import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Space, TableProps } from 'antd';

import { formatDate } from '../helperFunctions';

// const formatText = (text: string | number) => {
//     if (!text) return '';
//     const stringText = String(text); // Convert any input to a string
//     return stringText.charAt(0).toUpperCase() + stringText.slice(1).toLowerCase();
// };

export const fleetMaintenanceColumn = (
    handleDelete: (record: any) => void,
    handleEdit: (record: any) => void
): TableProps<any>['columns'] => [
    {
        title: 'Date and Time',
        dataIndex: 'dateAndTime',
        key: 'dateAndTime',
        render: date => formatDate(date),
    },
    {
        title: 'Repair Category',
        dataIndex: 'repairCategory',
        key: 'repairCategory',
    },
    {
        title: 'Service Type',
        dataIndex: 'serviceType',
        key: 'serviceType',
    },
    {
        title: 'Date Received',
        dataIndex: 'dateReceived',
        key: 'dateReceived',
        render: dateReceived => formatDate(dateReceived),
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: text =>
            `₹ ${parseFloat(text)
                .toFixed(2)
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
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
