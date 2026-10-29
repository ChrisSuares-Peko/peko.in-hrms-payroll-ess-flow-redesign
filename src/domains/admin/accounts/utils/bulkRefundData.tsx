import { Flex, Typography } from 'antd';

import { formattedDateTime } from '@utils/dateFormat';
import { calculateTimeRemainingForPGRefund } from '@utils/paymentGateWay';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { Transaction } from '../types/bulkRefund';

export const categoryData = [
    { label: 'All', value: 'all' },
    { label: 'Etisalat Postpaid', value: 'etisalat_bill' },
    { label: 'Du Postpaid', value: 'du' },
    { label: 'EWE', value: 'fewa_direct' },
    { label: 'AADC', value: 'aadc_direct' },
    { label: 'ADDC', value: 'addc_direct' },
    { label: 'ESIM', value: 'esim' },
];

export function timeRemainingForPGRefund(
    transactionDate: string,
    status: string,
    paymentMode: string
) {
    const { message } = calculateTimeRemainingForPGRefund({ transactionDate, status, paymentMode });
    return message || '';
}

export const BulkRefundColumns = [
    {
        title: 'Date',
        dataIndex: 'transactionDate',
        key: 'transactionDate',
        render: (data: any) => (
            <Typography.Text>{formattedDateTime(new Date(data))}</Typography.Text>
        ),
    },
    {
        title: 'Corporate Name',
        dataIndex: 'credential',
        key: 'credential',
        render: (credential: any) => <Typography.Text>{credential.name}</Typography.Text>,
    },
    {
        title: 'Batch ID',
        dataIndex: 'batchId',
        key: 'batchId',
        // render: (deviceType: any) => <Typography.Text>{deviceType}</Typography.Text>,
    },
    {
        title: 'Transaction ID',
        dataIndex: 'corporateTxnId',
        key: 'corporateTxnId',
        render: (corporateTxnId: string, record: Transaction) => (
            <Flex vertical gap={5}>
                <Typography.Text>{corporateTxnId}</Typography.Text>
                <Typography.Text>{record.serviceOperator.serviceProvider || ''}</Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Amount',
        dataIndex: 'order',
        key: 'order',
        render: (amount: any, record: Transaction) => (
            <Flex vertical gap={5}>
                <Typography.Text>
                    ₹ {formatNumberWithLocalString(Number(amount.amountInINR || 0))}
                </Typography.Text>
                <Typography.Text>{record.order.paymentMode || ''}</Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Refund',
        dataIndex: 'remarks',
        key: 'remarks',
        render: (data: any, record: Transaction) =>
            data === 'PENDING' || data === 'Payment Failed' ? (
                <Flex vertical gap={5}>
                    <Typography.Text className="text-textRed">{data}</Typography.Text>
                    <Typography.Text className="text-textRed">
                        {timeRemainingForPGRefund(
                            record.transactionDate,
                            record.status,
                            record.order.paymentMode
                        )}
                    </Typography.Text>
                </Flex>
            ) : (
                <Typography.Text className="text-textGreen">{data}</Typography.Text>
            ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (data: any) =>
            data === 'FAILURE' ? (
                <Typography.Text className="text-textRed">{data}</Typography.Text>
            ) : (
                <Typography.Text className="text-textGreen">{data}</Typography.Text>
            ),
    },
];
