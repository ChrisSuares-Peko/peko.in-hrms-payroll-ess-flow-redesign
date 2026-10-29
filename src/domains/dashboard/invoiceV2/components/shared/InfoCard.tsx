import React from 'react';

import { Card, Flex, Typography } from 'antd';
import { twMerge } from 'tailwind-merge';

interface InfoCardProps {
    title: string;
    items: React.ReactNode[];
    titleIcon?: React.ReactNode;
    itemsIcon?: React.ReactNode;
    className?: string;
}

const InfoCard = ({ title, items, titleIcon, itemsIcon, className }: InfoCardProps) => (
        <Card className={twMerge('rounded-2xl bg-[#F8FAFC] border-0', className)}>
            <Flex vertical gap={12}>
                <Flex align="center" gap={8}>
                    {titleIcon}
                    <Typography.Text className="text-base font-semibold">{title}</Typography.Text>
                </Flex>
                <Flex vertical gap={8}>
                    {items.map((item, i) => (
                        <Flex key={i} align={itemsIcon ? 'center' : 'flex-start'} gap={10}>
                            {itemsIcon || (
                                <Typography.Text className="text-sm">•</Typography.Text>
                            )}
                            <Typography.Text className="text-sm text-[#475569]">
                                {item}
                            </Typography.Text>
                        </Flex>
                    ))}
                </Flex>
            </Flex>
        </Card>
    );

export default InfoCard;
