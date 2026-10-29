import React from 'react';

import { Flex } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

interface LabelValueRowProps {
    label: string;
    value: string;
    bold?: boolean;
}

const LabelValueRow: React.FC<LabelValueRowProps> = ({ label, value, bold }) => (
    <Flex align="flex-start" gap={8}>
        <TypographyText
            className={`${bold ? 'text-sm font-bold' : 'text-sm text-[#475467]'} flex-shrink-0 whitespace-nowrap`}
        >
            {label}
        </TypographyText>
        <TypographyText
            className={`${bold ? 'text-sm font-bold' : 'text-sm text-[#475467]'} ml-auto max-w-[60%] text-right min-w-0 break-words`}
        >
            {value}
        </TypographyText>
    </Flex>
);

export default LabelValueRow;
