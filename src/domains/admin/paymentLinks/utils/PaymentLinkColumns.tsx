import { CopyOutlined } from '@ant-design/icons';
import { Button, Flex, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { Link } from 'react-router-dom';

import { formatDate, formatTime } from './helpers';

const { Text } = Typography;
const toTitleCase = (text: string) =>
    text?.replace(
        /\w\S*/g,
        (word: string) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
    );

const PaymentLinkColumns = ({
    tooltipText,
    setTooltipText,
    setSelectedLinkDetails,
    setModalVisible,
    accessPermission,
}: any): ColumnsType<any> => [
    {
        title: 'Created Date',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        render: (createdAt: any) => (
            <Flex className="whitespace-nowrap" gap={5}>
                <Typography.Text>{formatDate(createdAt)}</Typography.Text>
                <Typography.Text>{formatTime(createdAt)}</Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Customer Name',
        dataIndex: 'customerName',
        key: 'customerName',
        sorter: true,
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount, record) => `₹ ${amount}`,
        sorter: true,
    },
    {
        title: 'Expiry time',
        dataIndex: 'expiryDate',
        key: 'expiryDate',
        sorter: true,
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        sorter: true,
        render: status => {
            let colorClass = '';
            if (status === 'Paid') {
                colorClass = 'text-[#05BE63]';
            } else {
                colorClass = 'text-[#E38800]';
            }
            const formattedStatus = toTitleCase(status);
            return (
                <Typography.Text className={`${colorClass} font-normal whitespace-nowrap`}>
                    {formattedStatus}
                </Typography.Text>
            );
        },
    },
    {
        title: 'Payment Link',
        dataIndex: 'paymentLinks',
        key: 'paymentLinks',
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
                <Tooltip
                    placement="top"
                    title={
                        !accessPermission?.update
                            ? 'Sorry, you do not have permission to perform this action'
                            : ''
                    }
                >
                    <span>
                        <Button
                            type="default"
                            danger
                            className="w-full"
                            size="small"
                            disabled={record?.status === 'paid' || !accessPermission?.update}
                            onClick={() => {
                                setSelectedLinkDetails(record);
                                setModalVisible(true);
                            }}
                        >
                            Resend
                        </Button>
                    </span>
                </Tooltip>
            </Flex>
        ),
    },
];

export default PaymentLinkColumns;
