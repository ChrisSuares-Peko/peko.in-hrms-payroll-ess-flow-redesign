import { Badge, Flex, TableColumnsType, Typography } from 'antd';
import dayjs from 'dayjs';

import BillList from '../assets/icons/BillList-minimalistic.svg';
import Checklist from '../assets/icons/Checklist-minimalistic.svg';
import DeviceLaptop from '../assets/icons/DevicesLaptop-minimalistic.svg';
import DiscountCircle from '../assets/icons/DiscountCircle-minimalistic.svg';
import Documents from '../assets/icons/Documents-minimalistic.svg';
import LikeThumb from '../assets/icons/LikeThumb-minimalistic.svg';
import SmartPhoneUpdate from '../assets/icons/SmartPhoneUpdate-minimalistic.svg';
import StatusOffline from '../assets/icons/StatusOffline-minimalistic.svg';
import StockOut from '../assets/icons/StockOut-minimalistic.svg';
import UsersGroup from '../assets/icons/UsersGroup-minimalistic.svg';
import { BPOSHistory } from '../types/index';

export const firstCaroselItems: string[] = [
    'Trusted brand by millions of businesses',
    'Pre integrated with payment devices',
    'Competitive prices with free updates for life',
    'Compatibility across devices: Desktop, EDC, Tablet, Phone',
    'Best in class service: Available for you, hears you, implements feedback',
];

export const secondCaroselItems: string[] = [
    'Customisable reports : Sales/outlets/products',
    'Single dashboard to manage PnL',
    'Inventory report: Low inventory triggers, audit reports to prevent fraud',
    'Customer reports: Credit, active/inactive, no of visits, above/below average order value (AOV)',
    'Compatible with Mloyal*',
];

export const thirdCaroselItems = [
    { iconSrc: Checklist, text: 'Exhaustive Promotions Module' },
    { iconSrc: BillList, text: 'Customizable Digital Invoice' },
    { iconSrc: StockOut, text: 'Inventory Management' },
    { iconSrc: StatusOffline, text: 'Offline and Online Mode' },
    { iconSrc: Documents, text: 'Daily Business Reports' },
    { iconSrc: SmartPhoneUpdate, text: 'Free Continuous Updates' },
    { iconSrc: DiscountCircle, text: 'No Additional Charges' },
    { iconSrc: DeviceLaptop, text: 'Multi Platform Support' },
    { iconSrc: LikeThumb, text: 'Easy & Simple to Use' },
    { iconSrc: UsersGroup, text: 'Unlimited Users & Installs' },
];

export const OrderHistoryColumns: TableColumnsType<BPOSHistory> = [
    {
        title: 'Date',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: createdAt => dayjs(createdAt).format('YYYY-MM-DD') || 'N/A',
    },
    {
        title: 'Contact Person & Email',
        dataIndex: 'contactPerson',
        key: 'contactPerson',
        render: (contactPerson, record) => (
            <Flex vertical justify="center">
                <Typography.Text className="  text-gray-900 text-base font-medium">
                    {contactPerson}
                </Typography.Text>
                <Typography.Text className="text-slate-500 text-sm font-normal">
                    {record.email}
                </Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Store Name',
        dataIndex: 'storeName',
        key: 'storeName',
    },
    {
        title: 'Mobile Number',
        dataIndex: 'mobileNumber',
        key: 'mobileNumber',
    },
    {
        title: 'City',
        dataIndex: 'city',
        key: 'city',
        render: city => city || 'N/A',
    },
    {
        title: 'Business Category',
        dataIndex: 'businessCategory',
        key: 'businessCategory',
        render: businessCategory => businessCategory || 'N/A',
    },
    {
        title: 'Preferred language',
        dataIndex: 'preferredLanguage',
        key: 'preferredLanguage',
        render: preferredLanguage => preferredLanguage || 'N/A',
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        align: 'center',
        render: (status: string) => {
            if (status === 'Customer Contacted') {
                return (
                    <Badge
                        status="default"
                        text={status}
                        className="py-2 px-3 rounded-2xl"
                        style={{ backgroundColor: '#EAECF0', color: '#8C8C8C' }}
                    />
                );
            }
            if (status === 'Product Demo Done') {
                return (
                    <Badge
                        status="warning"
                        text={status}
                        className="py-2 px-3 rounded-2xl"
                        style={{ backgroundColor: '#FFFDD4', color: '#B78912' }}
                    />
                );
            }
            if (status === 'Payment Received') {
                return (
                    <Badge
                        status="success"
                        text={status}
                        className="py-2 px-3 rounded-2xl"
                        style={{ backgroundColor: '#ECFDF3', color: '#027A48' }}
                    />
                );
            }
            if (status === 'Setup Completed') {
                return (
                    <Badge
                        status="success"
                        text={status}
                        className="py-2 px-3 rounded-2xl"
                        style={{ backgroundColor: '#ECFDF3', color: '#027A48' }}
                    />
                );
            }
            return <Badge status="default" text={status} className="px-2 rounded-2xl" />;
        },
    },
];
