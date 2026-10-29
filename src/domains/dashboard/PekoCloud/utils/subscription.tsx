import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Flex, Space, TableProps, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import imacDesktop from '@domains/dashboard/PekoCloud/assets/icons/imacDesktop.svg';
import software from '@domains/dashboard/PekoCloud/assets/icons/software.svg';
import softwareDefault from '@domains/dashboard/PekoCloud/assets/icons/subscriptions/software-default.svg';
import users from '@domains/dashboard/PekoCloud/assets/icons/users.svg';
import wallet from '@domains/dashboard/PekoCloud/assets/icons/wallet.svg';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { formatDate } from './helperFunctions';

const formatText = (text: string | number) => {
    if (!text) return '';
    const stringText = String(text); // Convert any input to a string
    return stringText.charAt(0).toUpperCase() + stringText.slice(1).toLowerCase();
};
export const subscriptionData = [
    {
        title: 'Total Subscriptions',
        value: '150',
        isCurrency: false,
        icon: imacDesktop,
        bgColor: 'bg-[#FFF6F2]',
    },
    {
        title: 'Active Subscriptions ',
        value: '130',
        isCurrency: false,
        icon: software,
        bgColor: 'bg-[#F9F4FF]',
    },
    {
        title: 'Total Users',
        value: '20',
        isCurrency: false,
        icon: users,
        bgColor: 'bg-[#FFFBE4]',
    },
    {
        title: 'Total Amount Spent for Subscriptions',
        value: '100',
        isCurrency: true,
        icon: wallet,
        bgColor: 'bg-[#F6FCEB]',
    },
];
export const subscriptionColumn = (
    handleDelete: (record: any) => void,
    handleEdit: (record: any) => void,
    handleEmployeesList: (record: any) => void
): TableProps<any>['columns'] => [
    {
        title: 'Subscription Name',
        dataIndex: 'subscriptionName',
        key: 'softwareName',
        render: (text: string, record: any) => (
            <Flex gap={10}>
                <Flex align="center">
                    <ReactSVG src={softwareDefault} />
                </Flex>
                <Flex vertical justify="center">
                    <Typography.Text className="text-gray-900 text-base font-medium whitespace-nowrap">
                        {text}
                    </Typography.Text>
                </Flex>
            </Flex>
        ),
    },
    {
        title: 'Plan Details',
        dataIndex: 'planDetails',
        key: 'planDetails',
    },
    {
        title: 'Billing Start Date',
        dataIndex: 'billingStartDate',
        key: 'billingStartDate',
        render: startDate => (
            <Typography.Text className="ml-[.125rem] whitespace-nowrap">
                {startDate ? formatDate(startDate) : ''}{' '}
            </Typography.Text>
        ),
    },
    {
        title: 'Billing Cycle',
        dataIndex: 'billingCycle',
        key: 'billingCycle',
    },
    {
        title: 'Assigned to',
        dataIndex: 'assignedTo',
        key: 'assignedTo',
        render: (count, record) => (
            <Typography.Text
                className="text-[#FF4F4F] font-normal whitespace-nowrap cursor-pointer"
                onClick={() => handleEmployeesList(record)}
            >
                {`${count} Employees`}
            </Typography.Text>
        ),
    },
    {
        title: 'No. of Users',
        dataIndex: 'numberOfDevices',
        key: 'devicesCount',
        render: user => (
            <Typography.Text className="font-normal whitespace-nowrap">{user || 0}</Typography.Text>
        ),
    },
    {
        title: 'Charges(Per License)',
        dataIndex: 'amount',
        key: 'amount',
        render: amount => (
            <Typography.Text className="font-normal whitespace-nowrap">{`${formatNumberWithLocalString(amount)}`}</Typography.Text>
        ),
    },
    {
        title: 'Total Charges',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount, record) => (
            <Typography.Text className="font-normal whitespace-nowrap">{`${formatNumberWithLocalString(amount * record.assignedTo)}`}</Typography.Text>
        ),
    },
    {
        title: 'Currency',
        dataIndex: 'currency',
        key: 'currency',
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: status => {
            let colorClass = '';
            if (status === 'Active' || status === 'Active') {
                colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
            } else if (
                status === 'Trial' ||
                status === 'Renewing' ||
                status === 'Upgrade Pending' ||
                status === 'Downgrade Pending' ||
                status === 'Grace Period'
            ) {
                colorClass = 'text-[#007BFF] bg-[#E0F3FF]';
            } else {
                colorClass = 'text-[#FDA700] bg-[#FFFBE4]';
            }
            const formattedStatus = formatText(status);
            return (
                <Typography.Text
                    className={`${colorClass} font-normal px-3 py-1 rounded-2xl whitespace-nowrap`}
                >
                    {formattedStatus}
                </Typography.Text>
            );
        },
    },
    {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        width: '10%',
        render: (text, record) => (
            <Space>
                <Button type="link" className="border-0" onClick={() => handleEdit(record)}>
                    <EditOutlined className="text-[#E30000]" />
                </Button>
                <Button type="link" className="border-0" onClick={() => handleDelete(record)}>
                    <DeleteOutlined className="text-[#E30000]" />
                </Button>
            </Space>
        ),
    },
];
