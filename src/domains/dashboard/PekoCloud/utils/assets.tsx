/* eslint-disable no-nested-ternary */
import { DeleteOutlined } from '@ant-design/icons';
import { Button, Flex, Space, TableProps, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import cctvCat from '@domains/dashboard/PekoCloud/assets/icons/assets/cctv-category.svg';
import laptopCat from '@domains/dashboard/PekoCloud/assets/icons/assets/laptop-category.svg';
import memoryCat from '@domains/dashboard/PekoCloud/assets/icons/assets/memory-category.svg';
import printerCat from '@domains/dashboard/PekoCloud/assets/icons/assets/printer-category.svg';
import cartLagguage from '@domains/dashboard/PekoCloud/assets/icons/cartLagguage.svg';
import laptop from '@domains/dashboard/PekoCloud/assets/icons/laptop.svg';
import users from '@domains/dashboard/PekoCloud/assets/icons/users.svg';
import wallet from '@domains/dashboard/PekoCloud/assets/icons/wallet.svg';
import { paths } from '@src/routes/paths';

import { formatDate } from './helperFunctions';

const formatText = (text: string | number) => {
    if (!text) return '';
    const stringText = String(text); // Convert any input to a string
    return stringText.charAt(0).toUpperCase() + stringText.slice(1).toLowerCase();
};
export const assetsData = [
    {
        title: 'Total Assets',
        value: '150',
        isCurrency: false,
        icon: laptop,
        bgColor: 'bg-[#FFF6F2]',
    },
    {
        title: 'Total Assigned',
        value: '130',
        isCurrency: false,
        icon: users,
        bgColor: 'bg-[#F9F4FF]',
    },
    {
        title: 'Available Assets',
        value: '20',
        isCurrency: false,
        icon: cartLagguage,
        bgColor: 'bg-[#FFFBE4]',
    },
    {
        title: 'Total Amount Spent for Assets',
        value: '100',
        isCurrency: true,
        icon: wallet,
        bgColor: 'bg-[#F6FCEB]',
    },
];
export const assetsColumn = (
    handleDelete: (record: any) => void,
    handleEdit: (record: any) => void
): TableProps<any>['columns'] => [
    {
        title: 'Asset Name',
        dataIndex: 'assetName',
        key: 'assetName',
        render: (text: string, record: any) => (
            <Flex gap={10}>
                <Flex align="center">
                    <ReactSVG
                        src={
                            record.assetCategory === 'CCTV'
                                ? cctvCat
                                : record.assetCategory === 'Printer'
                                  ? printerCat
                                  : record.assetCategory === 'Memory Device'
                                    ? memoryCat
                                    : laptopCat
                        }
                    />
                </Flex>
                <Flex vertical justify="center">
                    <Typography.Text className="font-medium text-gray-900 text-normal whitespace-nowrap">
                        {' '}
                        <Link
                            style={{ color: '#101828', textDecoration: 'none' }}
                            to={`/${paths.pekoCloud.index}/${paths.pekoCloud.assets}/${paths.pekoCloud.assetsDetails}`}
                            state={{
                                assetId: record.id,
                                data: record,
                            }}
                        >
                            {text}
                        </Link>
                    </Typography.Text>
                </Flex>
            </Flex>
        ),
    },
    {
        title: 'Asset Category',
        dataIndex: 'assetCategory',
        key: 'assetCategory',
    },
    {
        title: 'Assigned to',
        dataIndex: 'usedBy',
        key: 'usedBy',
        render: text => (
            <Typography.Text className="text-[#FF4F4F]  whitespace-nowrap">
                {text || 'N/A'}
            </Typography.Text>
        ),
    },
    {
        title: 'Serial Number',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        render: text => <Typography.Text className="whitespace-nowrap">{text}</Typography.Text>,
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
            if (type === 'RENT') {
                colorClass = 'text-[#940000]';
            } else if (type === 'LEASED') {
                colorClass = 'text-[#20366E]';
            } else if (type === 'OWNED') {
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
        title: 'Warranty',
        dataIndex: 'warranty',
        key: 'warranty',
        render: (year, record) =>
            year ? (
                <Typography.Text className="font-normal whitespace-nowrap">
                    {year === 'UNLIMITED' ? `Unlimited` : `${year} Year`}
                </Typography.Text>
            ) : (
                <Typography.Text className="font-normal whitespace-nowrap">N/A</Typography.Text>
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
            <Space size="middle">
                <Button className="border-0" onClick={() => handleDelete(record)}>
                    <DeleteOutlined className="text-[#E30000]" />
                </Button>
            </Space>
        ),
    },
];
