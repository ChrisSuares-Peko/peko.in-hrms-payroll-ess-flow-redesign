import React from 'react';

import { Flex } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

import statActiveIcon from '../../assets/icons/eInvoice/stat-active.svg';
import statCancelledIcon from '../../assets/icons/eInvoice/stat-cancelled.svg';
import statTotalIcon from '../../assets/icons/eInvoice/stat-total.svg';
import statWaybillIcon from '../../assets/icons/eInvoice/stat-waybill.svg';
import { EInvoiceStatItem, EInvoiceStatKey } from '../../types/eInvoice';

const ICON_BY_KEY: Record<EInvoiceStatKey, string> = {
    total: statTotalIcon,
    active: statActiveIcon,
    cancelled: statCancelledIcon,
    waybill: statWaybillIcon,
};

interface Props extends Omit<EInvoiceStatItem, 'id'> {}

const EInvoiceStatCard: React.FC<Props> = ({ label, value, subLabel, bgColor, iconKey }) => (
    <Flex
        vertical
        gap={8}
        className="w-full rounded-2xl px-4 py-3 md:px-6 md:py-4"
        style={{ backgroundColor: bgColor }}
    >
        <Flex
            align="center"
            justify="center"
            className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-full"
        >
            <img src={ICON_BY_KEY[iconKey]} alt="" aria-hidden className="w-4 h-4 md:w-5 md:h-5" />
        </Flex>
        <Flex vertical gap={2}>
            <TypographyText className="text-[#475467] text-sm font-normal leading-5">
                {label}
            </TypographyText>
            <TypographyText className="text-xl md:text-2xl font-semibold leading-7">
                {value}
            </TypographyText>
            <TypographyText className="text-[#475467] text-xs font-normal leading-4">
                {subLabel}
            </TypographyText>
        </Flex>
    </Flex>
);

export default React.memo(EInvoiceStatCard);
