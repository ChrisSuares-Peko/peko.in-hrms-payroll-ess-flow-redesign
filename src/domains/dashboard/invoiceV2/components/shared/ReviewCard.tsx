import React from 'react';

import { Flex } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

import LabelValueRow from './LabelValueRow';

interface ReviewCardProps {
    title: string;
    rows: { label: string; value: string }[];
}

const ReviewCard: React.FC<ReviewCardProps> = ({ title, rows }) => (
    <Flex vertical className="rounded-xl border border-[#E4E4E7] overflow-hidden h-full">
        <TypographyText className="text-base font-semibold px-4 pt-3">{title}</TypographyText>
        <Flex vertical gap={5} className="px-4 py-2">
            {rows.map(row => (
                <LabelValueRow key={row.label} label={row.label} value={row.value || '—'} />
            ))}
        </Flex>
    </Flex>
);

export default ReviewCard;
