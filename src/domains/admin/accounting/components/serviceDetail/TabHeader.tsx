import { ReactNode } from 'react';

import { Flex, Typography } from 'antd';

type TabHeaderProps = {
    title: string;
    description: string;
    action?: ReactNode;
};

const TabHeader = ({ title, description, action }: TabHeaderProps) => (
    <Flex align="center" gap={16} wrap="wrap" className="mb-4">
        <div className="flex-1 min-w-[220px]">
            <Typography.Title level={4} className="!mb-0 !text-lg !text-textHeadings">
                {title}
            </Typography.Title>
            <Typography.Text className="text-[13px] text-textBody">{description}</Typography.Text>
        </div>
        {action}
    </Flex>
);

export default TabHeader;
