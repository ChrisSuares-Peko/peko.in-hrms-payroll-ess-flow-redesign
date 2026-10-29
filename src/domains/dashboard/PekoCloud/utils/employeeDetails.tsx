import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Avatar, Button, Divider, Flex, Image, Space, TableProps, Tooltip, Typography } from 'antd';

import deviceUsers from '@domains/dashboard/PekoCloud/assets/icons/deviceUsers.svg';
import laptop from '@domains/dashboard/PekoCloud/assets/icons/laptop.svg';
import softwareDefault from '@domains/dashboard/PekoCloud/assets/icons/subscriptions/software-default.svg';
import subscriptionUsers from '@domains/dashboard/PekoCloud/assets/icons/subscriptionUsers.svg';
import totalEmployees from '@domains/dashboard/PekoCloud/assets/icons/totalEmployees.svg';
import totalSpent from '@domains/dashboard/PekoCloud/assets/icons/totalSpent.svg';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { formatDate } from './helperFunctions';
import {
    AssetAndFleet,
    deviceProps,
    Subscription,
    subscriptionProps,
} from '../types/employeeDetails';

// const formatText = (text: string | number) => {
//     if (!text) return '';
//     const stringText = String(text); // Convert any input to a string
//     return stringText.charAt(0).toUpperCase() + stringText.slice(1).toLowerCase();
// };
function getInitials(name: string): string {
    const words = name.split(' ');
    const initials = words
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 3)
        .toUpperCase();
    return initials;
}
const SubscriptionIcons = ({ subscriptions }: subscriptionProps) => {
    const maxIconsToShow = 3;
    const subscriptionDetails = (
        <Space direction="vertical">
            <Typography.Text strong>All Subscriptions</Typography.Text>
            <Divider style={{ margin: '5px 0' }} />

            {subscriptions.map((sub, index) => (
                <Space key={index} align="center">
                    <Avatar src={softwareDefault} size={24} />
                    <Typography.Text>{sub.subscriptionName}</Typography.Text>
                </Space>
            ))}
        </Space>
    );

    return (
        <Flex align="center" className="cursor-pointer">
            {subscriptions.length > maxIconsToShow && (
                <Avatar
                    style={{
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '50%',
                        width: '25px',
                        height: '25px',
                        objectFit: 'cover',
                        zIndex: maxIconsToShow,
                    }}
                    className="p-1"
                >
                    <Typography.Text className="text-[.8rem] font-medium">{`+${subscriptions.length - maxIconsToShow}`}</Typography.Text>
                </Avatar>
            )}
            {subscriptions.slice(0, maxIconsToShow).map((sub: Subscription, index: number) => (
                <Tooltip
                    placement="right"
                    title={subscriptionDetails}
                    overlayInnerStyle={{ backgroundColor: 'white', color: 'black' }}
                    color="white"
                >
                    <Avatar
                        style={{
                            backgroundColor: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '50%',
                            width: '25px',
                            height: '25px',
                            objectFit: 'cover',
                            position: 'absolute',
                            left: `${(index + 2) * 7}%`,
                            zIndex: maxIconsToShow - (index + 1),
                        }}
                        className="p-1"
                        key={index}
                        src={softwareDefault}
                        alt={`Subscription ${index + 1}`}
                    />
                </Tooltip>
            ))}
            <Flex className="ml-1 absolute left-[43%]">
                <Typography.Text className="text-[.8rem] font-medium text-lightRed">{`${subscriptions.length}`}</Typography.Text>
            </Flex>
        </Flex>
    );
};
const DeviceIcons = ({ devices }: deviceProps) => {
    const maxIconsToShow = 3;
    const deviceDetails = (
        <Space direction="vertical">
            <Typography.Text strong>All Devices</Typography.Text>
            <Divider style={{ margin: '5px 0' }} />
            {devices.map((dev, index) => (
                <Space key={index} align="center">
                    <Avatar src={laptop} size={24} />
                    <Typography.Text>{dev.assetName || dev.vehicleName}</Typography.Text>
                </Space>
            ))}
        </Space>
    );

    return (
        <Flex align="center" className="w-full cursor-pointer">
            {devices.length > maxIconsToShow && (
                <Avatar
                    style={{
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '50%',
                        width: '25px',
                        height: '25px',
                        objectFit: 'cover',
                        zIndex: maxIconsToShow, // Set z-index to control stacking order
                    }}
                    className="p-1"
                >
                    <Typography.Text className="text-[.8rem] font-medium">{`+${devices.length - maxIconsToShow}`}</Typography.Text>
                </Avatar>
            )}
            {devices.slice(0, maxIconsToShow).map((dev: AssetAndFleet, index: number) => (
                <Tooltip
                    placement="right"
                    title={deviceDetails}
                    overlayInnerStyle={{ backgroundColor: 'white', color: 'black' }}
                    color="white"
                >
                    <Avatar
                        style={{
                            backgroundColor: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '50%',
                            width: '25px',
                            height: '25px',
                            objectFit: 'cover',
                            position: 'absolute',
                            left: `${(index + 2) * 7}%`, // Adjust the horizontal position
                            zIndex: maxIconsToShow - (index + 1), // Set z-index to control stacking order
                        }}
                        className="p-1"
                        key={index}
                        src={laptop}
                        alt={`Subscription ${index + 1}`}
                    />
                </Tooltip>
            ))}
            <Flex className="ml-1 absolute left-[50%]">
                <Typography.Text className="text-[.8rem] font-medium text-lightRed">{`${devices.length}`}</Typography.Text>
            </Flex>
        </Flex>
    );
};
export const employeeDetailsData = [
    {
        title: 'Total Employees',
        value: '150',
        icon: totalEmployees,
        bgColor: 'bg-[#FFF6F2]',
        isCurrency: false,
    },
    {
        title: 'Device Users',
        value: '130',
        icon: deviceUsers,
        bgColor: 'bg-[#F9F4FF]',
        isCurrency: false,
    },
    {
        title: 'Subscription Users',
        value: '20',
        icon: subscriptionUsers,
        bgColor: 'bg-[#FFFBE4]',
        isCurrency: false,
    },
    {
        title: 'Total Amount Spent',
        value: '100%',
        icon: totalSpent,
        bgColor: 'bg-[#F6FCEB]',
        isCurrency: true,
    },
];
export const employeeDetailsColumn = (
    handleDelete: (record: any) => void,
    handleEdit: (record: any) => void
): TableProps<any>['columns'] => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const dispatch = useAppDispatch();

    return [
        {
            title: 'Employee',
            dataIndex: 'employee',
            key: 'employee',
            render: (text: string, record: any) => (
                <Flex gap={10}>
                    <Flex align="center">
                        {record?.profilePicture ? (
                            <Image
                                width={36}
                                height={36}
                                preview={false}
                                src={record?.profilePicture}
                                className="object-cover rounded-full"
                            />
                        ) : (
                            <Avatar style={{ backgroundColor: '#fde3cf', color: 'red' }}>
                                {getInitials(text)}
                            </Avatar>
                        )}
                    </Flex>
                    <Flex vertical justify="center">
                        <Typography.Text className="text-base font-medium text-gray-900 whitespace-nowrap">
                            {text}
                        </Typography.Text>
                        <Typography.Text className="text-sm font-normal text-slate-500 whitespace-nowrap">
                            {record?.employeeEmail}
                        </Typography.Text>
                    </Flex>
                </Flex>
            ),
        },
        {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
        },
        {
            title: 'No. of Subscriptions',
            dataIndex: 'noOfSubscriptions',
            key: 'noOfSubscriptions',
            render: (subscriptions, record) => <SubscriptionIcons subscriptions={subscriptions} />,
        },
        {
            title: 'No. of Devices',
            dataIndex: 'noOfDevices',
            key: 'noOfDevices',
            render: (devices, record) => <DeviceIcons devices={devices} />,
        },
        {
            title: 'Joining Date',
            dataIndex: 'joiningDate',
            key: 'joiningDate',
            render: joiningDate => formatDate(joiningDate),
        },
        {
            title: 'Monthly Spend',
            dataIndex: 'monthlySpent',
            key: 'monthlySpent',
            render: text => (
                <Typography.Text className="whitespace-nowrap">
                    ₹{' '}
                    {parseFloat(text)
                        .toFixed(2)
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </Typography.Text>
            ),
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
                    <Button
                        className="border-0"
                        onClick={() => {
                            if (
                                record.noOfDevices.length === 0 &&
                                record.noOfSubscriptions.length === 0
                            ) {
                                handleDelete(record);
                            } else {
                                dispatch(
                                    showToast({
                                        description:
                                            'Cannot delete. This employee has active devices or subscriptions.',
                                        variant: 'warning',
                                    })
                                );
                            }
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
};
