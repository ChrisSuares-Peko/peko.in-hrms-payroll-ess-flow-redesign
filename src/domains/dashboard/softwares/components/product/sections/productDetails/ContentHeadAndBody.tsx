import React from 'react';

import { Flex, Typography } from 'antd';

const { Text } = Typography;

type Props = {
    header: string;
    textContent: string | null;
    children?: React.ReactNode;
};

const ContentHeadAndBody = ({ header, textContent = null, children }: Props) => (
    <Flex vertical className="gap-3">
        <Text className="mt-7 font-semibold text-xl text-[#0A0A0A]">{header}</Text>
        {textContent !== null ? (
            <Text className="font-normal text-base text-[#425466]">{textContent}</Text>
        ) : (
            children
        )}
    </Flex>
);

export default ContentHeadAndBody;
