import React from 'react';

import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

interface Props {
    value: string;
    label: string;
    bgColor: string;
    icon: string;
}

const StatCard: React.FC<Props> = ({ value, label, bgColor, icon }) => (
    <Flex
        vertical
        gap={10}
        className="w-full md:flex-1 md:basis-[220px] rounded-xl px-4 py-4 md:px-5 min-w-0"
        style={{ backgroundColor: bgColor }}
    >
        <Flex
            align="center"
            justify="center"
            className="w-9 h-9 bg-white rounded-full [&_svg]:w-5 [&_svg]:h-5"
        >
            <ReactSVG src={icon} />
        </Flex>
        <Flex vertical gap={2}>
            <Typography.Text className="text-[#1E293B] text-lg md:text-xl font-semibold leading-7">
                {value}
            </Typography.Text>
            <Typography.Text className="text-[#475569] text-sm font-normal leading-5">
                {label}
            </Typography.Text>
        </Flex>
    </Flex>
);

export default React.memo(StatCard);
