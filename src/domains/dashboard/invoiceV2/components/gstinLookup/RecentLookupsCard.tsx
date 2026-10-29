import React from 'react';

import { Badge, Flex } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

import { GstinRecentLookup, GstinStatus } from '../../types/gstinLookup';

interface Props {
    lookups: GstinRecentLookup[];
    onSelect?: (gstin: string) => void;
}

const STATUS_COLOR: Record<GstinStatus, string> = {
    Active: '#10B981',
    Inactive: '#9CA3AF',
    Cancelled: '#EF4444',
    Suspended: '#F59E0B',
};

const STATUS_TEXT: Record<GstinStatus, string> = {
    Active: 'text-[#047857]',
    Inactive: 'text-[#475467]',
    Cancelled: 'text-[#DC2626]',
    Suspended: 'text-[#B45309]',
};

const RecentLookupsCard: React.FC<Props> = ({ lookups, onSelect }) => (
    <Flex
        vertical
        gap={16}
        className="w-full p-4 md:p-5 bg-white rounded-2xl border border-[#E4E4E7]"
    >
        <TypographyText className="text-base font-semibold">Recent Lookups</TypographyText>
        {lookups.length === 0 ? (
            <Flex align="center" justify="center" className="w-full h-20 px-4 py-3 rounded-xl">
                <TypographyText className="text-[#475467] text-sm font-normal">
                    No recent searches
                </TypographyText>
            </Flex>
        ) : (
            <Flex vertical gap={10}>
                {lookups.map(item => (
                    <Flex
                        key={item.gstin}
                        align="center"
                        justify="space-between"
                        gap={10}
                        onClick={() => onSelect?.(item.gstin)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#F9FAFB] border border-[#E4E4E7] hover:border-[#D1D5DB] transition-colors cursor-pointer"
                    >
                        <Flex vertical gap={2} className="min-w-0">
                            <TypographyText className="text-sm font-semibold">
                                {item.gstin}
                            </TypographyText>
                            <TypographyText className="text-[#475467] text-xs font-medium">
                                {item.legalName}
                            </TypographyText>
                        </Flex>
                        <Flex align="center" gap={5} className="shrink-0">
                            <Badge color={STATUS_COLOR[item.status]} />
                            <TypographyText
                                className={`text-xs font-normal leading-4 ${STATUS_TEXT[item.status]}`}
                            >
                                {item.status}
                            </TypographyText>
                        </Flex>
                    </Flex>
                ))}
            </Flex>
        )}
    </Flex>
);

export default RecentLookupsCard;
