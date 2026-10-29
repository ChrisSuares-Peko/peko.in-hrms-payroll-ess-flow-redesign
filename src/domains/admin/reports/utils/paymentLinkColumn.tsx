import { CopyOutlined } from '@ant-design/icons';
import { Button, Flex, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router-dom';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { PaymentLinkOrder } from '../types/paymentLinks';

const PaymentLinkColumns = ({
    tooltipText,
    setTooltipText,
}: any): ColumnsType<PaymentLinkOrder> => [
    {
        title: 'Date',
        dataIndex: 'createdAt',
        sorter: true,
        key: 'createdAt',
        render: (date: string) => (
            <Flex vertical>
                <Typography.Text>{formattedDateOnly(new Date(date))}</Typography.Text>
                <Typography.Text>{formattedTime(new Date(date))}</Typography.Text>
            </Flex>
        ),
    },
    // {
    //     title: 'Invoice ID',
    //     dataIndex: 'invoiceId',
    //     sorter: true,
    //     key: 'invoiceId',
    //     render: (invoiceId: string) => <Typography.Text>{invoiceId ?? '-'}</Typography.Text>,
    // },
    {
        title: 'Corporate ID',
        sorter: true,
        dataIndex: ['credential', 'username'],
        key: 'corporateUsername',
        render: (username: string) => <Typography.Text>{username || '-'}</Typography.Text>,
    },
    {
        title: 'Corporate Name',
        dataIndex: ['credential', 'name'],
        sorter: true,
        key: 'corporateName',
        render: (corporateName: string) => <Typography.Text>{corporateName}</Typography.Text>,
    },
    {
        title: 'Amount',
        sorter: true,
        dataIndex: 'amount',
        key: 'amount',
        render: (amount: string) => (
            <Typography.Text>₹ {formatNumberWithLocalString(amount)}</Typography.Text>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        sorter: true,
        key: 'status',
        render: (status: string) => <Typography.Text>{status || '-'}</Typography.Text>,
    },
    {
        title: 'Type',
        dataIndex: 'type',
        sorter: true,
        key: 'type',
        render: (type: string) => <Typography.Text>{type || 'Corporate'}</Typography.Text>,
    },
    {
        title: 'Link',
        dataIndex: 'paymentLink',
        sorter: true,
        key: 'paymentLink',
        // render: (client_url: string) => (
        //     <Flex gap="middle">
        //         <Link to={client_url}>
        //             <Button type="link" danger>
        //                 Payment Link
        //             </Button>
        //         </Link>
        //         <Tooltip
        //             title={tooltipText}
        //             onVisibleChange={visible => {
        //                 if (!visible) {
        //                     setTooltipText('Copy to clipboard');
        //                 }
        //             }}
        //         >
        //             <CopyOutlined
        //                 className="text-iconRed custom-copyable"
        //                 onClick={() => {
        //                     navigator.clipboard
        //                         .writeText(client_url)
        //                         .then(() => {
        //                             setTooltipText('Copied!');
        //                         })
        //                         .catch(err => {
        //                             setTooltipText('Failed to copy');
        //                         });
        //                 }}
        //             />
        //         </Tooltip>
        //     </Flex>
        // ),
        render: (url: string) => (
            <Flex>
                <Link to={url}>
                    <Button type="link" danger>
                        Payment Link
                    </Button>
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
];
export const paymentLinkStatusData = [
    { label: 'Created', value: 'created' },
    { label: 'Paid', value: 'paid' },
];

export default PaymentLinkColumns;
