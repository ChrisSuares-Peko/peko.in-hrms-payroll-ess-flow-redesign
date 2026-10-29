import { ReactNode } from 'react';

import { Card, Flex, Typography } from 'antd';

type ChartCardProps = {
    icon: ReactNode;
    title: string;
    caption?: string;
    help?: ReactNode;
    extra?: ReactNode;
    children: ReactNode;
};

const ChartCard = ({ icon, title, caption, help, extra, children }: ChartCardProps) => (
    <Card
        className="w-full h-full border border-borderCard shadow-none rounded-xl"
        styles={{ body: { padding: 0 } }}
    >
        <Flex align="center" gap={10} wrap="wrap" className="px-5 py-4 border-b border-borderCard">
            <span className="text-base text-textHeadings">{icon}</span>
            <Flex vertical className="min-w-0">
                <Typography.Text className="text-[15px] font-semibold text-textHeadings">
                    {title}
                    {help}
                </Typography.Text>
                {caption && (
                    <Typography.Text className="text-xs text-textBody">{caption}</Typography.Text>
                )}
            </Flex>
            {extra && <div className="ml-auto">{extra}</div>}
        </Flex>
        <div className="p-4">{children}</div>
    </Card>
);

export default ChartCard;
