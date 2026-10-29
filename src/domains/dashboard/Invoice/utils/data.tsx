import { CopyOutlined } from '@ant-design/icons';
import { Flex, Typography, Tooltip, Button } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router-dom';

import customer from '@domains/dashboard/Invoice/assets/customer.svg';
import paymentlink from '@domains/dashboard/Invoice/assets/paymentlink.svg';
import track from '@domains/dashboard/Invoice/assets/track.svg';
import upload from '@domains/dashboard/Invoice/assets/upload.svg';
import { paths } from '@src/routes/paths';
import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';
import { toTitleCase } from '@utils/wordFormat';

import CashIcon from '../assets/orderHistory/cash.svg';
import PendingIcon from '../assets/orderHistory/pending.svg';
import ReceiveMoneyIcon from '../assets/orderHistory/receive-money.svg';
import SendIcon from '../assets/orderHistory/send.svg';
import { PaymentLinkOrder, Statistics } from '../types/paymentlinkType';

const { Text, Paragraph } = Typography;

export const columns = [
    {
        title: 'Description',
        dataIndex: 'name',
        key: 'name',
        render: (name: { firstRow: string; secondRow: string }) => (
            <Flex vertical>
                <Paragraph>{name.firstRow}</Paragraph>
                <Paragraph>{name.secondRow}</Paragraph>
            </Flex>
        ),
    },
    {
        title: 'Quantity',
        dataIndex: 'quantity',
        key: 'quantity',
    },
    {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        render: (amount: string) => `₹ ${formatNumberWithLocalString(Number(amount))}`,
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount: string) => `₹ ${formatNumberWithLocalString(Number(amount))}`,
    },
];

export const featureRow = [
    {
        image: customer,
        title: 'Create Invoice',
        link: `${paths.invoice.create}`,
    },
    {
        image: track,
        title: 'Upload Invoice',
        link: `${paths.invoice.upload}`,
    },
    {
        image: upload,
        title: 'Track Invoice',
        link: `${paths.invoice.invoicehistory}`,
    },
    {
        image: paymentlink,
        title: 'Payment Links',
        link: `${paths.invoice.paymentLinks}`,
    },
];

export const PaymentLinkColumns = ({
    tooltipText,
    setTooltipText,
    resendPaymentLink,
}: any): ColumnsType<PaymentLinkOrder> => [
    {
        title: 'Date & Time',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (date: string) => <span>{formattedDateTime(new Date(date))}</span>,
    },
    {
        title: 'Customer Name',
        dataIndex: 'sentPayload',
        key: 'sentPayload',
        render: (sentPayload: any) => {
            const obj = sentPayload || null;
            return obj ? obj.full_name : 'N/A';
        },
    },
    {
        title: 'Payment ID',
        dataIndex: 'reference_id',
        key: 'invoiceId',
        render: (id: any) => id || 'N/A',
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount: string) => <Text>₹ {formatNumberWithLocalString(amount)}</Text>,
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'paymentMode',
        render: (text: string) => {
            toTitleCase(text);
            if (text === 'paid') return <Text className="text-textLime">Completed</Text>;
            return <Text className="text-textYellow">Pending</Text>;
        },
    },
    {
        title: 'Payment Link',
        dataIndex: 'paymentLink',
        key: 'client_url',
        render: (url: string) => (
            <Flex>
                <Link to={url} target="_blank">
                    <Text className="w-40" ellipsis>
                        {url}
                    </Text>
                </Link>
                <Tooltip
                    title={tooltipText}
                    onOpenChange={visible => {
                        if (!visible) {
                            setTooltipText('Copy to clipboard');
                        }
                    }}
                >
                    <CopyOutlined
                        className="text-iconRed custom-copyable"
                        onClick={() => {
                            navigator.clipboard
                                .writeText(url)
                                .then(() => {
                                    setTooltipText('Copied!');
                                })
                                .catch(err => {
                                    setTooltipText('Failed to copy');
                                });
                        }}
                    />
                </Tooltip>
            </Flex>
        ),
    },
    {
        title: 'Action',
        dataIndex: 'action',
        key: 'action',
        render: (_, record) => (
            <Flex justify="center">
                <Button
                    type="text"
                    danger
                    className="w-full"
                    size="small"
                    disabled={record?.status === 'paid'}
                    onClick={() => resendPaymentLink(record.id)}
                >
                    Resend Link
                </Button>
            </Flex>
        ),
    },
];

export const getCardData = (statisticsData?: Statistics) => [
    {
        bgColor: 'bg-[#F9F4FF]',
        borderColor: 'border-[#DBBDFF]',
        icon1: SendIcon,
        title1: 'Total Number of Payment Links Sent',
        value1: statisticsData?.totalPaymentRequests || 0,
        icon2: CashIcon,
        title2: 'Total Amount Requested',
        value2: statisticsData?.totalAmountRequested || 0,
    },
    {
        bgColor: 'bg-[#F5FFEC]',
        borderColor: 'border-[#A7CE85]',
        icon1: ReceiveMoneyIcon,
        title1: 'Total Number of Payments Received',
        value1: statisticsData?.totalPaidRequests || 0,
        icon2: CashIcon,
        title2: 'Total Amount Received',
        value2: statisticsData?.totalPaidAmount || 0,
    },
    {
        bgColor: 'bg-[#FFFBE4]',
        borderColor: 'border-[#DDCB63]',
        icon1: PendingIcon,
        title1: 'Total Number of Payments Pending',
        value1: statisticsData?.totalPendingRequests || 0,
        icon2: CashIcon,
        title2: 'Total Amount Pending',
        value2: statisticsData?.totalPendingAmount || 0,
    },
];

export const paymentLinkNotification = [
    { value: 'EML', label: 'Email' },
    { value: 'SMS', label: 'SMS' },
    { value: 'LNK', label: 'Invoice Link' },
    { value: 'ALL', label: 'ALL' },
];
