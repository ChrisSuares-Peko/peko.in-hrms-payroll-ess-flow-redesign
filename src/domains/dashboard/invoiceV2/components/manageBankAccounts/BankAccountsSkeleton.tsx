import React from 'react';

import { Flex, Skeleton } from 'antd';

interface BankAccountsSkeletonProps {
    count?: number;
}

const BankAccountsSkeleton: React.FC<BankAccountsSkeletonProps> = ({ count = 2 }) => (
    <Flex vertical gap={12}>
        {Array.from({ length: count }, (_, index) => (
            <Flex
                key={index}
                vertical
                gap={16}
                className="bg-[#F9FAFB] border border-[#E4E4E7] rounded-2xl px-4 py-4 md:px-5"
            >
                <Flex vertical gap={12} className="md:flex-row md:items-center md:justify-between">
                    <Flex align="center" gap={10} className="flex-1 flex-wrap">
                        <Skeleton.Input active size="small" style={{ width: 160, maxWidth: '100%' }} />
                        <Skeleton.Button active size="small" style={{ width: 72 }} />
                    </Flex>
                    <Flex gap={8} wrap="wrap">
                        <Skeleton.Button active size="small" style={{ width: 88, maxWidth: '100%' }} />
                        <Skeleton.Button active size="small" style={{ width: 24 }} />
                        <Skeleton.Button active size="small" style={{ width: 24 }} />
                    </Flex>
                </Flex>

                <Flex vertical gap={12}>
                    {Array.from({ length: 3 }, (_row, rowIndex) => (
                        <Flex key={rowIndex} vertical gap={12} className="sm:flex-row sm:justify-between">
                            <Skeleton.Input active size="small" style={{ width: '100%' }} />
                            <Skeleton.Input active size="small" style={{ width: '100%' }} />
                        </Flex>
                    ))}
                </Flex>
            </Flex>
        ))}
    </Flex>
);

export default React.memo(BankAccountsSkeleton);
