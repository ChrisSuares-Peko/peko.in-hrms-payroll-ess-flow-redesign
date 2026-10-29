import React from 'react';

import { Flex, Skeleton } from 'antd';

const ActivitySkeleton = () => (
    <Flex vertical gap={32} className="p-6">
        <Skeleton.Input active block size="small" />
        <Skeleton.Input active block size="small" />

        {/*  TOP SUMMARY CARDS */}
        <Flex gap={24} >
            {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton.Node
                    key={i}
                    active
                    style={{
                        width: 260,
                        height: 120,
                        borderRadius: 16,
                    }}
                />
            ))}
        </Flex>

        {/* QUICK ACTION ICONS */}
        <Flex gap={24} >
            {Array.from({ length: 7 }).map((_, i) => (
                <Flex key={i} vertical align="center" gap={8} style={{ width: 120 }}>
                    {/* Icon square */}
                    <Skeleton.Node
                        active
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: 16,
                        }}
                    />

                    {/* Text label */}
                    <Skeleton active title={false} paragraph={{ rows: 1, width: '80%' }} />
                </Flex>
            ))}
        </Flex>
        {/* Chart section */}

        <Skeleton.Node
            active
            style={{
                width: '100%',
                height: 320,
                borderRadius: 20,
            }}
        />

        {/*  BOTTOM INFO / PROGRESS */}
        <Flex vertical gap={12}>
            <Skeleton.Input active block size="small" />
            <Skeleton.Input active block size="small" />
            <Skeleton.Input active block size="small" />
            <Skeleton.Input active block size="small" />
        </Flex>
    </Flex>
);

export default ActivitySkeleton;
