import React from 'react';

import { Flex, Typography } from 'antd';

interface HeaderProps {
    title: string;
    subTitle: string;
}
const SectionHeader = ({ title, subTitle }: HeaderProps) => (
    <Flex vertical gap={10} className="mb-5">
        <Typography.Text className="text-2xl font-medium">{title}</Typography.Text>
        <Typography.Text className="text-gray-500 font-light text-base">{subTitle}</Typography.Text>
    </Flex>
);

export default SectionHeader;
