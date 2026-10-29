import React from 'react';

import { Flex } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

import { EligibleInvoice } from '../../types/eWaybill';

interface Props {
    invoice: EligibleInvoice;
    isSelected?: boolean;
    onClick?: () => void;
}

const InvoiceListItem: React.FC<Props> = ({ invoice, isSelected, onClick }) => (
    <Flex
        vertical
        gap={6}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={`w-full px-4 py-3 bg-[#F8FAFC] rounded-xl border transition-colors ${
            isSelected ? 'border-[#FF4F4F]' : ''
        } ${onClick ? 'cursor-pointer hover:bg-[#F4F4F5]' : ''}`}
    >
        <TypographyText className="text-sm font-semibold">{invoice.invoiceNo}</TypographyText>
        <TypographyText className="text-[#475467] text-sm font-medium">
            {invoice.buyerName}
        </TypographyText>
        <TypographyText className="text-[#475467] text-xs font-normal">
            {invoice.amount} · {invoice.date}
        </TypographyText>
    </Flex>
);

export default React.memo(InvoiceListItem);
