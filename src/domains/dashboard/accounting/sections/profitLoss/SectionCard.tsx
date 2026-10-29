import { ReactNode } from 'react';

import { Flex, Typography } from 'antd';

const { Title, Text } = Typography;

interface SectionCardProps {
    title: string;
    subtitle?: string;

    action?: ReactNode;
    children: ReactNode;
    className?: string;
}

const SectionCard = ({ title, subtitle, action, children, className = '' }: SectionCardProps) => (
    <Flex
        vertical
        gap={16}
        className={`h-full w-full rounded-[22px] bg-white p-4 shadow-[0px_1.68px_16.79px_1.55px_#0000000F] md:p-6 ${className}`.trim()}
    >
        <Flex align="flex-start" justify="space-between" gap={12} className="w-full">
            <Flex vertical gap={2} className="min-w-0">
                <Title level={5} className="!mb-0 !text-base !font-semibold !text-ink md:!text-lg">
                    {title}
                </Title>
                {subtitle && <Text className="text-xs text-slate-400">{subtitle}</Text>}
            </Flex>
            {action}
        </Flex>
        {children}
    </Flex>
);

export default SectionCard;
