import React from 'react';

import { Flex, Input, Typography } from 'antd';

type Props = {
    label: string;
    defaultValue: string;
};

const { Text } = Typography;

const CustomTextAreaWithLabel = ({ label, defaultValue }: Props) => (
    <Flex
        gap={5}
        align="center"
        className="justify-between px-3 py-2 bg-gray-100 border border-gray-200 borderjust rounded-xl"
    >
        <Flex align="center">
            <Text className="text-gray-500 text-nowrap"> {label}</Text>
        </Flex>
        <Flex>
            <Input className="p-0 text-black text-end" variant="borderless" value={defaultValue} />
        </Flex>
    </Flex>
);

export default React.memo(CustomTextAreaWithLabel);
