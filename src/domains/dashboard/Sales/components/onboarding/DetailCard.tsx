import React from 'react';

import { Flex, Typography } from 'antd';
import { twMerge } from 'tailwind-merge';

type Props = {
    icon?: React.ReactNode;
    label: string;
    title?: string;
    subText?: string;
    action?: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
};

const DetailCard = ({ icon, label, title, subText, action, className, children }: Props) => (
    <Flex
        vertical={!!children}
        justify={children ? undefined : 'space-between'}
        align={children ? undefined : 'center'}
        gap={children ? 16 : undefined}
        className={twMerge(
            'px-4 py-4 md:px-5 bg-gray-50 rounded-2xl border border-gray-200',
            className
        )}
    >
        <Flex align="center" gap={16} className="flex-1 min-w-0">
            {icon && (
                <Flex
                    align="center"
                    justify="center"
                    className="w-10 h-10 bg-white rounded-xl border border-gray-200 flex-shrink-0"
                >
                    {icon}
                </Flex>
            )}
            <Flex vertical gap={2} className="min-w-0">
                <Typography.Text className="!text-gray-500 !text-xs">{label}</Typography.Text>
                {title && (
                    <Typography.Text className="!text-neutral-950 !text-sm !font-medium break-words">
                        {title}
                    </Typography.Text>
                )}
                {subText && (
                    <Typography.Text className="!text-gray-500 !text-xs break-all">
                        {subText}
                    </Typography.Text>
                )}
            </Flex>
        </Flex>
        {!children && <div className="shrink-0">{action}</div>}
        {children}
    </Flex>
);

export default DetailCard;
