import { Button, Flex, Tag, Typography } from 'antd';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

export const walletReportcolumns = (onViewJournal: (record: any) => void) => [
    {
        title: 'Transaction Date',
        sorter: true,
        dataIndex: 'transactionDate',
        render: (date: any) => (
            <Flex vertical>
                <Typography.Text>{formattedDateOnly(new Date(date))}</Typography.Text>
                <Typography.Text>{formattedTime(new Date(date))}</Typography.Text>
            </Flex>
        ),
    },
    {
        sorter: true,
        title: 'Transaction ID',
        dataIndex: 'corporateTxnId',
        render: (data: string) => data,
    },
    {
        sorter: true,
        title: 'Corporate Name',
        dataIndex: ['credential', 'name'],
        render: (data: any, record: any) => (
            <Typography.Text>{record?.credential?.name}</Typography.Text>
        ),
    },
    {
        title: 'Corporate ID',
        sorter: true,
        dataIndex: ['credential', 'username'],
        render: (data: any, record: any) => (
            <Typography.Text>{record?.credential?.username}</Typography.Text>
        ),
    },
    {
        title: 'Transaction Type',
        sorter: true,
        dataIndex: 'transactionType',
        render: (data: string) => data,
    },
    {
        title: 'Debit Amount',
        sorter: true,
        dataIndex: 'debitAmount',
        render: (amount: string) => `₹ ${formatNumberWithLocalString(amount)}`,
    },
    {
        title: 'Credit Amount',
        sorter: true,
        dataIndex: 'creditAmount',
        render: (amount: string) => `₹ ${formatNumberWithLocalString(amount)}`,
    },
    {
        title: 'Status',
        sorter: true,
        dataIndex: 'status',
        render: (status: string) => status || '-',
    },
    {
        title: 'Journal Status',
        key: 'journalStatus',
        render: (_: any, record: any) => {
            const status = record?.journalRecordStatus?.walletTransfer;
            if (record?.journalData?.walletTransfer?.skipped) return <Tag>Skipped</Tag>;
            if (status === true) return <Tag color="green">Success: 1</Tag>;
            if (status === false) return <Tag color="red">Failed: 1</Tag>;
            return <Tag>Not recorded</Tag>;
        },
    },
    {
        title: 'Actions',
        key: 'actions',
        render: (_: any, record: any) => (
            <Button size="small" onClick={() => onViewJournal(record)}>
                View
            </Button>
        ),
    },
];
