import { Flex, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import TypographyText from '@components/atomic/typography/typographyText';

import { STATUS_STYLE } from '../../constants/style';
import { ConvertToEInvoiceRow } from '../../types/convertToEInvoice';
import { formatAmount, formatDate, toTitleCase } from '../helperFunctions';

const convertToEInvoiceColumns: ColumnsType<ConvertToEInvoiceRow> = [
    {
        title: 'Invoice ID',
        dataIndex: 'invoiceId',
        key: 'invoiceId',
        render: (value: string) => (
            <TypographyText className="text-[#475467] text-sm font-normal leading-5">
                {value}
            </TypographyText>
        ),
    },
    {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        render: (value: string) => (
            <TypographyText className="text-[#475467] text-sm font-normal leading-5">
                {formatDate(value)}
            </TypographyText>
        ),
    },
    {
        title: 'Buyer',
        dataIndex: 'buyerName',
        key: 'buyer',
        render: (_: string, record) => (
            <Flex vertical gap={2}>
                <TypographyText className="text-sm font-normal leading-5">
                    {record.buyerName}
                </TypographyText>
                <TypographyText className="text-[#A1A1AA] text-xs font-normal leading-4">
                    {record.buyerGstin}
                </TypographyText>
            </Flex>
        ),
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (value: string) => (
            <TypographyText className="text-[#475467] text-sm font-normal leading-5">
                {formatAmount(value)}
            </TypographyText>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (value: 'Paid' | 'Pending' | 'Overdue') => {
            const key = value ? toTitleCase(value) : '';
            return (
                <Tag
                    className={`rounded-full text-xs font-medium border-0 px-3 py-1 ${STATUS_STYLE[key] ?? 'bg-[#F4F4F5] text-[#71717A]'}`}
                >
                    {key}
                </Tag>
            );
        },
    },
];

export default convertToEInvoiceColumns;
