import React from 'react';

import { Flex } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

import quickActionIcon from '../../assets/icons/eInvoice/quick-action.svg';
import { EInvoiceQuickActionItem } from '../../types/eInvoice';

interface Props extends Omit<EInvoiceQuickActionItem, 'id'> {}

const EInvoiceQuickActionCard: React.FC<Props> = ({ title, description, onClick }) => (
    <Flex
        align="center"
        gap={10}
        onClick={onClick}
        className="w-full px-4 py-3 md:px-5 md:py-4 rounded-xl border border-[#E4E4E7] hover:shadow-md transition-shadow cursor-pointer"
    >
        <Flex
            align="center"
            justify="center"
            className="w-10 h-10 md:w-12 md:h-12 bg-[#F4F4F5] rounded-xl flex-shrink-0"
        >
            <img src={quickActionIcon} alt="" aria-hidden className="w-5 h-5 md:w-6 md:h-6" />
        </Flex>
        <Flex vertical gap={2} className="min-w-0">
            <TypographyText className="text-base font-semibold">{title}</TypographyText>
            <TypographyText className="text-[#475467] text-sm">{description}</TypographyText>
        </Flex>
    </Flex>
);

export default React.memo(EInvoiceQuickActionCard);
