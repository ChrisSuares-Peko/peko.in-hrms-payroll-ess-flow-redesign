import React from 'react';

import { Flex } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

import gstinSearchIcon from '../../assets/icons/eInvoice/gstin-search.svg';

const GstinLookupEmptyState: React.FC = () => (
    <Flex
        vertical
        align="center"
        justify="center"
        gap={16}
        className="w-full min-h-[280px] md:min-h-[360px] p-6 md:p-8 rounded-2xl border border-[#E4E4E7] bg-white"
    >
        <img src={gstinSearchIcon} alt="" aria-hidden className="w-20 h-20 select-none" />
        <Flex vertical align="center" gap={4}>
            <TypographyText className="text-sm md:text-base font-semibold leading-6 text-center">
                Enter a GSTIN to verify and fetch details
            </TypographyText>
            <TypographyText className="text-[#475467] text-xs md:text-sm font-normal leading-5 text-center">
                Supports all registered taxpayers on GST portal
            </TypographyText>
        </Flex>
    </Flex>
);

export default GstinLookupEmptyState;
