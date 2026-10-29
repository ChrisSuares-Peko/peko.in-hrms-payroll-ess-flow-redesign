import React from 'react';

import { Flex, Skeleton } from 'antd';

interface CardRowsSkeletonProps {
    count?: number;
    containerClassName?: string;
    rowClassName?: string;
}

const CardRowsSkeleton: React.FC<CardRowsSkeletonProps> = ({
    count = 5,
    containerClassName = 'flex-1',
    rowClassName = 'bg-white rounded-xl px-4 py-3 overflow-hidden',
}) => (
    <Flex vertical gap={12} className={containerClassName}>
        {Array.from({ length: count }).map((_, index) => (
            <Flex
                key={`card-row-skeleton-${index + 1}`}
                justify="space-between"
                align="center"
                gap={12}
                className={rowClassName}
            >
                <Flex vertical gap={8} className="min-w-0 flex-1">
                    <Skeleton.Input active size="small" className="!w-[130px] !max-w-full" />
                    <Skeleton.Input active size="small" className="!w-[110px] !max-w-full" />
                </Flex>
                <Flex justify="flex-end" className="w-[100px] flex-shrink-0 pr-1 pl-2">
                    <Skeleton.Input active size="small" className="!w-full !max-w-full" />
                </Flex>
            </Flex>
        ))}
    </Flex>
);

export default React.memo(CardRowsSkeleton);
