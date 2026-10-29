import {  EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { TableProps, Typography, Space, Button } from 'antd';

import { formatLeaveTypeString } from '../../hooks/leaveHooks/useLeaveListApi';
import { LeaveTableRow } from '../../types/leaveSection';

export const leaveListColumn = (
    handleDelete: (id: LeaveTableRow) => void,
    handleEdit: (id: LeaveTableRow) => void
): TableProps<LeaveTableRow>['columns'] => [
    {
        title: <Typography.Text>Leave Type</Typography.Text>,
        dataIndex: 'leaveType',
        key: 'leaveType',

        render: typeOfLeave => formatLeaveTypeString(typeOfLeave),
    },
    {
        title: <Typography.Text>From</Typography.Text>,
        dataIndex: 'from',
        key: 'fromDate',
    },
    {
        title: <Typography.Text>To</Typography.Text>,
        dataIndex: 'to',
        key: 'toDate',
    },
    {
        title: <Typography.Text>Total Days</Typography.Text>,
        dataIndex: 'totalDays',
        key: 'totalDays',
    },
    // {
    //     title: (
    //         <Typography.Text
    //             className=" text-salaryTableSubText font-normal "
    //             style={{ fontSize: '0.838rem' }}
    //         >
    //             File
    //         </Typography.Text>
    //     ),
    //     dataIndex: 'file',
    //     key: 'file',
    // },
    {
        title: <Typography.Text>Action</Typography.Text>,
        dataIndex: 'action',
        key: 'action',

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


