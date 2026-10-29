import React from 'react';

import { Flex } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

import { GSTIN_BREAKDOWN } from '../../constants/gstinLookup';

const GstinFormatCard: React.FC = () => (
    <Flex
        vertical
        gap={12}
        className="w-full p-4 md:p-5 bg-[#F5F3FF] rounded-2xl border border-[#94A3B8]"
    >
        <TypographyText className="text-[#4338CA] text-base font-semibold">
            GSTIN Format
        </TypographyText>
        <Flex align="center" justify="center" className="w-full h-8 rounded bg-[#EDE9FE]">
            <TypographyText className="text-[#4338CA] text-xs font-medium leading-4 tracking-wide">
                29AABCU9603R1ZX
            </TypographyText>
        </Flex>
        <Flex vertical gap={2}>
            {GSTIN_BREAKDOWN.map(({ code, description }) => (
                <Flex key={code} gap={4} align="center">
                    <TypographyText className="text-[#4338CA] text-xs font-semibold leading-5">
                        {code}
                    </TypographyText>
                    <TypographyText className="text-[#4338CA] text-xs font-normal leading-5">
                        — {description}
                    </TypographyText>
                </Flex>
            ))}
        </Flex>
    </Flex>
);

export default GstinFormatCard;
