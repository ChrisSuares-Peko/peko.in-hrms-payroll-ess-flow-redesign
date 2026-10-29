import React from 'react';

import { Flex, Typography } from 'antd';

type Props = {
    label?: string;
    value?: string;
};

const { Text } = Typography;

const TextCard = ({ label, value }: Props) => (
    <Flex vertical gap={10}>
        {label && <Text className="text-gray-400">{label}</Text>}
        <Text className="">{value}</Text>
    </Flex>
);

export default TextCard;
