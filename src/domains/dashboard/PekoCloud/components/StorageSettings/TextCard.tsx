import React from 'react';

import { Flex, Typography } from 'antd';

type Props = {
    label?: string;
    value?: string;
    valueColor?: string;
};

const TextCard = ({ label, value, valueColor }: Props) => (
    <Flex vertical gap={10}>
        {label && <Typography.Text className="text-gray-400">{label}</Typography.Text>}
        <Typography.Text className={valueColor && `text-[${valueColor}]`}>{value}</Typography.Text>
    </Flex>
);

export default TextCard;
