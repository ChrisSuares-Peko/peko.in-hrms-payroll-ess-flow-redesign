import React from 'react';

import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

interface StatCardProps {
    label: string;
    value: string;
    bgColor: string;
    icon: string;
    growthPercent?: number;
    growthLabel?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, bgColor, icon, growthPercent, growthLabel = 'vs last month' }) => (
    <Flex
        vertical
        gap={12}
        className="flex-1 rounded-xl px-4 py-4 md:px-5 min-w-0"
        style={{ backgroundColor: bgColor }}
    >
        <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
           <Flex align="center" justify="center" className="w-9 h-9 bg-white rounded-full ">
                <ReactSVG src={icon} />
            </Flex>
            {growthPercent !== undefined && (
                <Flex align="center" gap={4} wrap="wrap" justify="flex-end">
                    <Flex
                        align="center"
                        gap={4}
                        className={`rounded-full px-2 py-[2px] ${growthPercent >= 0 ? 'bg-[#ECFDF5]' : 'bg-[#FEF2F2]'}`}
                    >
                        {growthPercent >= 0 ? (
                            <ArrowUpOutlined className="text-[#43B75D] text-xs" />
                        ) : (
                            <ArrowDownOutlined className="text-[#EF4444] text-xs" />
                        )}
                        <Typography.Text
                            className={`text-xs font-medium leading-3 ${growthPercent >= 0 ? 'text-[#43B75D]' : 'text-[#EF4444]'}`}
                        >
                            {growthPercent > 0 ? '+' : ''}
                            {growthPercent}%
                        </Typography.Text>
                    </Flex>
                    <Typography.Text className="text-[#475569] text-xs">
                        vs last month
                    </Typography.Text>
                </Flex>
            )}
        </Flex>
        <Flex vertical gap={4}>
            <Typography.Text className="text-[#475569] text-sm font-normal leading-5">
                {label}
            </Typography.Text>
            <Typography.Text className="text-[#1E293B] text-xl font-semibold leading-7">
                {value}
            </Typography.Text>
        </Flex>
    </Flex>
);

export default React.memo(StatCard);
