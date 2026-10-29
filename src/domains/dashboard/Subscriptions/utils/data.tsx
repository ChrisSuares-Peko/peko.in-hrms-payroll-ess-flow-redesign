import { TableColumnsType, TableProps, Typography } from 'antd';
import '@domains/dashboard/Subscriptions/assets/styles/styles.css';

import {
    DataType,
    OrderHistoryTableData,
    filterOption,
} from '@domains/dashboard/Subscriptions/types/types';
import { serviceCategoryNames } from '@utils/accessKeys';
import { formattedDateOnly as formatDate, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

const { Text } = Typography;

export const columns: TableProps<DataType>['columns'] = [
    {
        title: 'Text',
        dataIndex: 'text',
        key: 'text',
        render: text => <a>{text}</a>,
    },
];

export const filterOptions: filterOption[] = [
    {
        value: 'All',
        label: 'All',
    },
    {
        value: 'bills',
        label: serviceCategoryNames.utility,
    },
    {
        value: 'office',
        label: 'Office Supplies',
    },
];
export const filterOptions2: filterOption[] = [
    {
        value: 'all',
        label: 'All',
    },
    {
        value: 'popular',
        label: 'Popular',
    },
    {
        value: 'latest',
        label: 'Latest',
    },
    {
        value: 'oldest',
        label: 'Oldest',
    },
];

export const OrderHistoryColumns: TableColumnsType<OrderHistoryTableData> = [
    {
        title: 'Date',
        dataIndex: 'dateandtime',
        render: (date: string) => (
            <div>
                <Text className="text-sm text-nowrap">{formatDate(new Date(date))}</Text> at{' '}
                <Text className="text-sm text-nowrap">{formattedTime(new Date(date))}</Text>
            </div>
        ),
        key: 'dateandtime',
    },
    {
        title: 'Software Name',
        dataIndex: 'subscriptionName',
        key: 'subscriptionName',
    },
    {
        title: 'Order ID',
        dataIndex: 'transactionId',
        key: 'transactionId',
    },
    {
        title: 'Software Plan',
        dataIndex: 'plan',
        key: 'plan',
        width: '20%',
    },
    {
        title: 'Payment Mode',
        dataIndex: 'paymentMode',
        key: 'paymentMode',
        render: (text: string) => <Text>{text.charAt(0) + text.slice(1).toLowerCase()}</Text>,
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (text: string) => <Text>INR {formatNumberWithLocalString(text)}</Text>,
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (text: string) => (
            <Text
                className={`${text === 'SUCCESS' ? 'text-textGreen' : 'text-bgOrange2'} capitalize text-nowrap`}
            >
                {text.toLowerCase()}
            </Text>
        ),
    },
];

export const formattedDateOnly = (date: Date): string => {
    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return `${monthName} ${day}-${year} ${time}`;
};

export const formattedDate = (date: Date): string => {
    const day = `0${date.getDate()}`.slice(-2); // Ensure leading zero if necessary
    const month = `0${date.getMonth() + 1}`.slice(-2); // Month is zero-based
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
};

export const getUserDisplayText = (count: number) => {
    if (count === 0) {
        return 'Unlimited users';
    }
    if (count === 1) {
        return '1 User';
    }
    return `${count} Users`;
};
