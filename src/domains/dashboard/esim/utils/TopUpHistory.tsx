import { TableProps, Typography } from 'antd';

import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { convertMBtoGB } from './helperFunction';

const formatPlanData = (value: string | number | null | undefined): string => {
    if (value == null) return 'N/A';
    if (Number(value) === 0) return 'Unlimited';
    return `${convertMBtoGB(value)} GB`;
};

export const topUpHistoryColumns: TableProps<any>['columns'] = [
    {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        render: (date: string) => formattedDateTime(new Date(date)),
    },
    {
        title: 'Plan',
        dataIndex: 'plan',
        key: 'plan',
        render: (text: string) => (
            <Typography.Text>{formatPlanData(text)}</Typography.Text>
        ),
    },
    {
        title: 'Validity',
        dataIndex: 'validity',
        key: 'validity',
        render: (text: string) => <Typography.Text>{text || 'N/A'}</Typography.Text>,
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (amt: string) => (
            <Typography.Text>₹ {formatNumberWithLocalString(amt)}</Typography.Text>
        ),
    },
    {
        title: 'Payment Method',
        dataIndex: 'paymentMethod',
        key: 'paymentMethod',
        render: (text: string) => <Typography.Text className="capitalize">{text}</Typography.Text>,
    },
];
