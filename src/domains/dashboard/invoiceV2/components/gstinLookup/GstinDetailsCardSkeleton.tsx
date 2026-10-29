import React from 'react';

import { Flex, Skeleton } from 'antd';

const FieldSkeleton: React.FC = () => (
    <Flex gap={6} align="flex-start">
        <Skeleton.Avatar active size={16} shape="circle" className="mt-0.5 flex-shrink-0" />
        <Flex vertical gap={4}>
            <Skeleton.Input active size="small" className="!w-[80px] !h-3" />
            <Skeleton.Input active size="small" className="!w-[160px] !max-w-full" />
        </Flex>
    </Flex>
);

const GstinDetailsCardSkeleton: React.FC = () => (
    <Flex vertical gap={20} className="w-full p-5 md:p-6 rounded-2xl border">
        {/* Header */}
        <Flex align="center" gap={6}>
            <Skeleton.Avatar active size={18} shape="circle" />
            <Skeleton.Input active size="default" className="!w-[160px]" />
        </Flex>

        {/* GSTIN row */}
        <Flex
            align="center"
            justify="space-between"
            className="px-4 py-3 rounded-xl bg-[#F9FAFB] border border-[#E4E4E7]"
        >
            <Flex vertical gap={4}>
                <Skeleton.Input active size="small" className="!w-[40px] !h-3" />
                <Skeleton.Input active size="small" className="!w-[200px] !max-w-full" />
            </Flex>
            <Skeleton.Input active size="small" />
        </Flex>

        {/* Fields — 2 columns */}
        <Flex gap={20} className="w-full flex-col md:flex-row">
            <Flex vertical gap={16} className="flex-1 min-w-0">
                <FieldSkeleton />
                <FieldSkeleton />
                <FieldSkeleton />
                <FieldSkeleton />
            </Flex>
            <Flex vertical gap={16} className="flex-1 min-w-0">
                <FieldSkeleton />
                <FieldSkeleton />
                <FieldSkeleton />
            </Flex>
        </Flex>
    </Flex>
);

export default GstinDetailsCardSkeleton;
