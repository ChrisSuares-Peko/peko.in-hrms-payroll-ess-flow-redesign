/* eslint-disable no-nested-ternary */
import { DeleteOutlined } from '@ant-design/icons';
import { Button, Flex, Space, TableProps, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import carCat from '@domains/dashboard/PekoCloud/assets/icons/fleet/car-category.svg';
import suvCat from '@domains/dashboard/PekoCloud/assets/icons/fleet/suv-category.svg';
import truckCat from '@domains/dashboard/PekoCloud/assets/icons/fleet/truck-category.svg';
import twoWheelerCat from '@domains/dashboard/PekoCloud/assets/icons/fleet/twoWheeler-category.svg';
import onMaintenance from '@domains/dashboard/PekoCloud/assets/icons/onMaintenance.svg';
import totalAssigned from '@domains/dashboard/PekoCloud/assets/icons/totalAssigned.svg';
import totalUnused from '@domains/dashboard/PekoCloud/assets/icons/totalUnused.svg';
import vehicle from '@domains/dashboard/PekoCloud/assets/icons/vehicle.svg';
import { paths } from '@src/routes/paths';

import { formatDate } from '../helperFunctions';

const formatText = (text: string | number) => {
    if (!text) return '';
    const stringText = String(text); // Convert any input to a string
    return stringText.charAt(0).toUpperCase() + stringText.slice(1).toLowerCase();
};
export const fleetManagementData = [
    {
        title: 'Total Vehicles',
        value: '150',
        isCurrency: false,
        icon: vehicle,
        bgColor: 'bg-[#FFF6F2]',
    },
    {
        title: 'Total Assigned',
        value: '130',
        isCurrency: false,
        icon: totalAssigned,
        bgColor: 'bg-[#F9F4FF]',
    },
    {
        title: 'Total Unused',
        value: '20',
        isCurrency: false,
        icon: totalUnused,
        bgColor: 'bg-[#FFFBE4]',
    },
    {
        title: 'On Maintenance',
        value: '100',
        isCurrency: true,
        icon: onMaintenance,
        bgColor: 'bg-[#F6FCEB]',
    },
];
export const fleetManagementColumn = (
    handleDelete: (record: any) => void,
    handleEdit: (record: any) => void
): TableProps<any>['columns'] => [
    {
        title: 'Vehicles',
        dataIndex: 'vehicleName',
        key: 'vehicles',
        render: (text: string, record: any) => (
            <Flex gap={10}>
                <Flex align="center">
                    <ReactSVG
                        src={
                            record.vehicleType === 'Suv'
                                ? suvCat
                                : record.vehicleType === 'Truck'
                                  ? truckCat
                                  : record.vehicleType === 'Two Wheeler'
                                    ? twoWheelerCat
                                    : carCat
                        }
                    />
                </Flex>
                <Flex vertical justify="center">
                    <Typography.Text className="text-gray-900 text-normal font-medium whitespace-nowrap">
                        {' '}
                        <Link
                            style={{ color: '#101828', textDecoration: 'none' }}
                            to={`/${paths.pekoCloud.index}/${paths.pekoCloud.fleet}/${paths.pekoCloud.fleetDetails}`}
                            state={{
                                fleetId: record.id,
                                data: record,
                            }}
                        >
                            {text || 'N/A'}
                        </Link>
                    </Typography.Text>
                </Flex>
            </Flex>
        ),
    },
    {
        title: 'Vehicle Type',
        dataIndex: 'vehicleType',
        key: 'vehicleType',
        render: vehicleType => (
            <Typography.Text className="whitespace-nowrap">{vehicleType || 'N/A'}</Typography.Text>
        ),
    },
    {
        title: 'Assigned to',
        dataIndex: 'usedBy',
        key: 'usedBy',
        render: text => (
            <Typography.Text className="text-[#FF4F4F] whitespace-nowrap">
                {text || 'N/A'}
            </Typography.Text>
        ),
    },
    {
        title: 'Vehicle Number',
        dataIndex: 'vehicleNumber',
        key: 'vehicleNo',
    },
    {
        title: 'Purchased Date',
        dataIndex: 'purchasedDate',
        key: 'purchasedDate',
        render: startDate => (
            <Typography.Text className="whitespace-nowrap">
                {startDate ? formatDate(startDate) : 'N/A'}{' '}
            </Typography.Text>
        ),
    },
    {
        title: 'Asset Type',
        dataIndex: 'assetType',
        key: 'assetType',
        render: type => {
            let colorClass = '';
            if (type === 'Rented') {
                colorClass = 'text-[#940000]';
            } else if (type === 'Leased') {
                colorClass = 'text-[#20366E]';
            } else if (type === 'Owned') {
                colorClass = 'text-[#206E47]';
            }
            const formattedStatus = formatText(type);
            return (
                <Typography.Text
                    className={`${colorClass} font-normal px-3 py-1 rounded-2xl whitespace-nowrap`}
                >
                    {formattedStatus || 'N/A'}
                </Typography.Text>
            );
        },
    },
    {
        title: 'Registration Renewal Date',
        dataIndex: 'dateOfRenewal',
        key: 'dateOfRenewal',
        render: dateofRenewal => (
            <Typography.Text className="whitespace-nowrap">
                {dateofRenewal ? formatDate(dateofRenewal) : 'N/A'}{' '}
            </Typography.Text>
        ),
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount, record) =>
            amount ? (
                <Typography.Text className="font-normal whitespace-nowrap">
                    {record.assetType === 'RENT'
                        ? `₹ ${parseFloat(amount)
                              .toFixed(2)
                              .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}/m`
                        : `₹ ${parseFloat(amount)
                              .toFixed(2)
                              .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`}
                </Typography.Text>
            ) : (
                <Typography.Text className="font-normal whitespace-nowrap">N/A</Typography.Text>
            ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: status => {
            let colorClass = '';
            if (status === 'Active' || status === 'Reserved') {
                colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
            } else {
                colorClass = 'text-[#FDA700] bg-[#FFFBE4]';
            }
            const formattedStatus = formatText(status);
            return status ? (
                <Typography.Text
                    className={`${colorClass} font-normal px-3 py-1 rounded-2xl whitespace-nowrap`}
                >
                    {formattedStatus}
                </Typography.Text>
            ) : (
                <Typography.Text
                    className={`${colorClass} font-normal px-3 py-1 rounded-2xl whitespace-nowrap`}
                >
                    N/A
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
                <Button type="link" className="border-0" onClick={() => handleDelete(record)}>
                    <DeleteOutlined className="text-[#E30000]" />
                </Button>
            </Space>
        ),
    },
];

export const retrieveVehicleData = (data: string | number | null | undefined | false) => {
    if (data === null) return 'N/A';
    if (data === '') return 'N/A';
    if (data === undefined) return 'N/A';
    if (data === false) return 'N/A';
    return data;
};
