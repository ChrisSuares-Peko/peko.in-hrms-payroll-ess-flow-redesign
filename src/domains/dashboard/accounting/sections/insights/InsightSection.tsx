import { ReactNode } from 'react';

import { Flex, Typography } from 'antd';

const { Text } = Typography;

interface InsightSectionProps {
    title: string;
    children: ReactNode;
}

const InsightSection = ({ title, children }: InsightSectionProps) => (
    <Flex vertical gap={12}>
        <Text className="text-sm font-medium text-titleMuted">{title}</Text>
        {children}
    </Flex>
);

export default InsightSection;
