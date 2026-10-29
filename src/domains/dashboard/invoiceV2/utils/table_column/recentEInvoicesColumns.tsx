import type { CSSProperties } from 'react';

import { Flex, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import TypographyText from '@components/atomic/typography/typographyText';

import { RecentEInvoiceRow } from '../../types/eInvoice';

export const TABLE_HEADER_STYLE: CSSProperties = {
    backgroundColor: '#FAFBFB',
    color: '#42526D',
    fontWeight: 600,
    fontSize: '14px',
    borderBottom: '1.24px solid #EAECF0',
};

const recentEInvoicesColumns: ColumnsType<RecentEInvoiceRow> = [
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
                {value}
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
        title: 'Supply',
        dataIndex: 'supply',
        key: 'supply',
        render: (value: string) => (
            <Flex
                align="center"
                justify="center"
                className="px-3 py-1 bg-[#F4F4F5] rounded-full w-fit"
            >
                <TypographyText className="text-sm font-normal leading-6">{value}</TypographyText>
            </Flex>
        ),
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (value: string) => (
            <TypographyText className="text-[#475467] text-sm font-normal leading-5">
                {value}
            </TypographyText>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (value: 'Active' | 'Cancelled') => {
            const isActive = value === 'Active';
            return (
                <Tag
                    className={`px-2 py-0.5 m-0 rounded-full border-0 text-xs font-normal ${
                        isActive ? 'bg-[#ECFDF5] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]'
                    }`}
                >
                    {value}
                </Tag>
            );
        },
    },
];

export default recentEInvoicesColumns;
