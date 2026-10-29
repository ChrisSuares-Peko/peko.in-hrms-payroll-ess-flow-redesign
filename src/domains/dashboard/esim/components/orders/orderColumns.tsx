import { Button, Flex, TableProps, Typography } from 'antd';

import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

const statusColors: Record<string, string> = {
    SUCCESS: '#26A411',
    FAILURE: '#D7341E',
    REFUNDED: '#D7341E',
};

type Handlers = {
    onView: (record: any) => void;
    onTopUp: (record: any) => void;
};

const renderText = (text: string) => <Typography.Text>{text || '-'}</Typography.Text>;

const renderDate = (date: string) => (date ? formattedDateTime(new Date(date)) : '-');

const renderNoWrap = (text: string) => (
    <Typography.Text className="whitespace-nowrap">{text || '-'}</Typography.Text>
);

export const getOrderColumns = ({ onView, onTopUp }: Handlers): TableProps<any>['columns'] => [
    {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        width: 160,
        render: renderDate,
    },
    {
        title: 'Order ID',
        dataIndex: 'orderId',
        key: 'orderId',
        width: 150,
        render: renderNoWrap,
    },
    {
        title: 'Plan',
        dataIndex: 'plan',
        key: 'plan',
        width: 200,
        render: renderText,
    },
    {
        title: 'Country / Region',
        dataIndex: 'country',
        key: 'country',
        width: 140,
        render: (text: string, record: any) =>
            renderText(text || (record.plan ? record.plan.split(',')[0].trim() : '')),
    },
    {
        title: 'Expires At',
        dataIndex: 'expiresAt',
        key: 'expiresAt',
        width: 160,
        render: renderDate,
    },
    {
        title: 'ICCID No.',
        dataIndex: 'iccid',
        key: 'iccid',
        width: 200,
        render: renderNoWrap,
    },
    {
        title: 'Payment Method',
        dataIndex: 'paymentMethod',
        key: 'paymentMethod',
        width: 140,
        render: (text: string) => <Typography.Text className="capitalize">{text}</Typography.Text>,
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        width: 120,
        render: (amt: string) => (
            <Typography.Text className="whitespace-nowrap">
                ₹ {formatNumberWithLocalString(amt)}
            </Typography.Text>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (status: string) => (
            <Typography.Text
                className="whitespace-nowrap"
               
                style={{
                    color: statusColors[status?.toUpperCase()] || 'gray',
                    whiteSpace: 'nowrap',
                }}
            
            >
                {status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : '-'}
            </Typography.Text>
        ),
    },
    {
        title: 'Action',
        key: 'id',
        dataIndex: 'id',
        width: 180,
        render: (_: unknown, record: any) => (
            <Flex gap={10} wrap={false}>
                <Button className="font-medium" danger onClick={() => onView(record)}>
                    View
                </Button>
                <Button className="font-medium" danger onClick={() => onTopUp(record)}>
                    Top-Up
                </Button>
            </Flex>
        ),
    },
];
