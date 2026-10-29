import React from 'react';

import { Card, Flex, Typography } from 'antd';
import { twMerge } from 'tailwind-merge';

type Props = {
    icon: React.ReactNode;
    title: string;
    description: string;
    className?: string;
    iconBgClass?: string;
};

const InfoItem = ({ icon, title, description, className, iconBgClass }: Props) => (
    <Card
        className={twMerge(
            'rounded-xl border-0 bg-[#FAFAFA] [&_.ant-card-body]:flex [&_.ant-card-body]:gap-3 [&_.ant-card-body]:items-center [&_.ant-card-body]:py-3 [&_.ant-card-body]:px-4',
            className
        )}
    >
        <Flex
            align="center"
            justify="center"
            className={twMerge('w-9 h-9 rounded-xl text-base', iconBgClass)}
        >
            {icon}
        </Flex>
        <Flex vertical gap={1}>
            <Typography.Text className="text-sm font-semibold block">{title}</Typography.Text>
            <Typography.Text className="text-[#6a7282] text-xs block">
                {description}
            </Typography.Text>
        </Flex>
    </Card>
);

export default InfoItem;
