import React from 'react';

import { Flex, Tag, Typography } from 'antd';

import { formatAmount } from '../../utils/helperFunctions';

const DOC_TYPE_STYLE: Record<string, { label: string; color: string; bg: string }> = {
    INVOICE:     { label: 'Invoice',     color: '#15803D', bg: '#DCFCE7' },
    QUOTATION:   { label: 'Quotation',   color: '#1D4ED8', bg: '#DBEAFE' },
    SALES_ORDER: { label: 'Sales Order', color: '#7C3AED', bg: '#EDE9FE' },
};

interface RecentDocumentRowProps {
    invoiceNumber: string;
    documentType: string;
    name: string;
    date: string;
    amount: number;
    onClick?: () => void;
}

const RecentDocumentRow: React.FC<RecentDocumentRowProps> = ({
    invoiceNumber,
    documentType,
    name,
    date,
    amount,
    onClick,
}) => {
    const style = DOC_TYPE_STYLE[documentType] ?? DOC_TYPE_STYLE.INVOICE;

    return (
        <Flex
            justify="space-between"
            align="center"
            className="bg-white rounded-xl px-4 py-3 cursor-pointer hover:bg-[#F9FAFB] transition-colors"
            onClick={onClick}
        >
            <Flex vertical gap={2}>
                <Flex align="center" gap={8}>
                    <Typography.Text className="text-sm font-semibold text-[#111827]">
                        {invoiceNumber}
                    </Typography.Text>
                    <Tag
                        className="rounded-full border-0 text-[10px] font-medium px-2 py-0 leading-5 m-0"
                        style={{ backgroundColor: style.bg, color: style.color }}
                    >
                        {style.label}
                    </Tag>
                </Flex>
                <Typography.Text className="text-sm font-normal text-[#374151]">{name}</Typography.Text>
                <Typography.Text className="text-[11px] font-normal text-[#A1A1AA]">{date}</Typography.Text>
            </Flex>
            <Typography.Text className="text-base font-semibold text-[#038E36] shrink-0 ml-4">
                {formatAmount(amount)}
            </Typography.Text>
        </Flex>
    );
};

export default React.memo(RecentDocumentRow);
