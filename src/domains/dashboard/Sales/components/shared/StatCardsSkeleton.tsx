import React from 'react';

import { Flex, Skeleton } from 'antd';

interface StatCardsSkeletonProps {
    count?: number;
    verticalOnMobile?: boolean;
}

const StatCardsSkeleton: React.FC<StatCardsSkeletonProps> = ({
    count = 2,
    verticalOnMobile = false,
}) => (
    <Flex vertical={verticalOnMobile} gap={16} wrap="wrap" className="w-full">
        {Array.from({ length: count }).map((_, index) => (
            <Flex
                key={`stat-skeleton-${index + 1}`}
                vertical
                gap={16}
                className="w-full md:flex-1 md:basis-[220px] rounded-xl px-4 py-4 md:px-5 bg-[#F8FAFC] min-w-0"
            >
                <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                    <Skeleton.Avatar active size={24} shape="square" />
                    <Skeleton.Button active size="small" className="!w-[120px]" />
                </Flex>
                <Flex vertical gap={8}>
                    <Skeleton.Input active size="small" className="!w-[140px] !max-w-full" />
                    <Skeleton.Input active size="small" className="!w-[180px] !max-w-full" />
                </Flex>
            </Flex>
        ))}
    </Flex>
);

export default React.memo(StatCardsSkeleton);
