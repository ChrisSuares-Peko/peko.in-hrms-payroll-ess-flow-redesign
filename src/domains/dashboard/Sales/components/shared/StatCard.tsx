import React from 'react';

import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

interface Props {
    value: string;
    label: string;
    bgColor: string;
    icon: string;
    badge?: 'growth' | 'text';
    badgeValue?: string;
}

const StatCard: React.FC<Props> = ({ value, label, bgColor, icon, badge, badgeValue }) => (
    <Flex
        vertical
        gap={10}
        className="w-full md:flex-1 md:basis-[220px] rounded-xl px-4 py-4 md:px-5 min-w-0"
        style={{ backgroundColor: bgColor }}
    >
        <Flex align="center" justify="space-between">
            <Flex
                align="center"
                justify="center"
                className="w-9 h-9 bg-white rounded-full [&_svg]:w-5 [&_svg]:h-5"
            >
                <ReactSVG src={icon} />
            </Flex>
            {badge === 'growth' &&
                badgeValue &&
                (() => {
                    const pct = parseFloat(badgeValue);
                    const isPositive = pct >= 0;
                    return (
                        <Flex align="center" gap={4}>
                            <Flex
                                align="center"
                                gap={4}
                                className={`rounded-full px-2 py-[2px] ${isPositive ? 'bg-[#ECFDF5]' : 'bg-[#FEF2F2]'}`}
                            >
                                {isPositive ? (
                                    <ArrowUpOutlined className="text-[#43B75D] text-xs" />
                                ) : (
                                    <ArrowDownOutlined className="text-[#EF4444] text-xs" />
                                )}
                                <Typography.Text
                                    className={`text-xs font-medium leading-3 ${isPositive ? 'text-[#43B75D]' : 'text-[#EF4444]'}`}
                                >
                                    {pct > 0 ? '+' : ''}
                                    {badgeValue}%
                                </Typography.Text>
                            </Flex>
                            <Typography.Text className="text-[#475569] text-xs">
                                vs last month
                            </Typography.Text>
                        </Flex>
                    );
                })()}
            {badge === 'text' && badgeValue && (
                <Typography.Text className="text-[#475569] text-xs">{badgeValue}</Typography.Text>
            )}
        </Flex>
        <Flex vertical gap={2}>
            <Typography.Text className="text-[#1E293B] text-xl font-semibold leading-7">
                {value}
            </Typography.Text>
            <Typography.Text className="text-[#475569] text-sm font-normal leading-5">
                {label}
            </Typography.Text>
        </Flex>
    </Flex>
);

export default React.memo(StatCard);
