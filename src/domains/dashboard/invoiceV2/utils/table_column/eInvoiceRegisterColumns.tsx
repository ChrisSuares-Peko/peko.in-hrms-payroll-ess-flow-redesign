import { Flex, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import TypographyText from '@components/atomic/typography/typographyText';

import { EInvoiceRegisterRow } from '../../types/eInvoiceRegister';
import { formatAmount } from '../helperFunctions';

const eInvoiceRegisterColumns: ColumnsType<EInvoiceRegisterRow> = [
    {
        title: 'Date',
        dataIndex: 'date',
        key: 'docDate',
        sorter: true,
        render: (value: string) => (
            <TypographyText className="text-[#475467] text-sm font-normal leading-5 whitespace-nowrap">
                {value}
            </TypographyText>
        ),
    },
    {
        title: 'Document',
        dataIndex: 'document',
        key: 'docNo',
        sorter: true,
        render: (value: string) => (
            <TypographyText className="text-[#475467] text-sm font-normal leading-5 whitespace-nowrap">
                {value}
            </TypographyText>
        ),
    },
    {
        title: 'Buyer',
        dataIndex: 'buyerName',
        key: 'buyer',
        render: (_: string, record) => (
            <Flex vertical gap={4}>
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
        title: 'IRN',
        dataIndex: 'irnHash',
        key: 'irn',
        render: (_: string, record) => (
            <Flex vertical gap={4}>
                <TypographyText className="text-sm font-normal leading-5 whitespace-nowrap overflow-hidden text-ellipsis block max-w-[180px]">
                    {record.irnHash.length > 20
                        ? `${record.irnHash.slice(0, 20)}...`
                        : record.irnHash}
                </TypographyText>
                <TypographyText className="text-[#A1A1AA] text-xs font-normal leading-4 whitespace-nowrap">
                    {record.irnAck}
                </TypographyText>
            </Flex>
        ),
    },
    {
        title: 'Supply',
        dataIndex: 'supply',
        key: 'supply',
        filters: [
            { text: 'B2B – Business to Business', value: 'B2B' },
            { text: 'SEZWP – SEZ With Payment', value: 'SEZWP' },
            { text: 'SEZWOP – SEZ Without Payment', value: 'SEZWOP' },
            { text: 'EXPWP – Export With Payment', value: 'EXPWP' },
            { text: 'EXPWOP – Export Without Payment', value: 'EXPWOP' },
            { text: 'DEXP – Deemed Export', value: 'DEXP' },
        ],
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
        key: 'totalAmount',
        sorter: true,
        render: (_: string, record) => (
            <Flex vertical gap={4}>
                <TypographyText className="text-sm font-normal leading-5 whitespace-nowrap">
                    {formatAmount(record.amount)}
                </TypographyText>
                <TypographyText className="text-[#A1A1AA] text-xs font-normal leading-4 whitespace-nowrap">
                    Taxable: {formatAmount(record.taxableAmount)}
                </TypographyText>
            </Flex>
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
                    className={`px-3 py-0.5 m-0 rounded-full border-0 text-sm font-normal ${
                        isActive ? 'bg-[#ECFDF5] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]'
                    }`}
                >
                    {value}
                </Tag>
            );
        },
    },
    {
        title: 'EWB',
        dataIndex: 'ewb',
        key: 'ewb',
        render: (value: string) => (
            <TypographyText className="text-[#475467] text-sm font-normal leading-5 whitespace-nowrap">
                {value}
            </TypographyText>
        ),
    },
];

export default eInvoiceRegisterColumns;
