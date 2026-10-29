import type { ReactNode } from 'react';

import { Divider, Flex, Skeleton } from 'antd';

const SkeletonCard = ({ children }: { children: ReactNode }) => (
    <Flex vertical gap={16} className="rounded-xl border border-[#E5E7EB] p-4">
        {children}
    </Flex>
);

const PaymentDetailsSkeleton = () => (
    <Flex gap={24} align="flex-start" className="flex-col lg:flex-row">
        {/* LEFT COLUMN */}
        <Flex vertical gap={16} className="flex-1 w-full">
            {/* PaymentSummary skeleton */}
            <SkeletonCard>
                <Flex justify="space-between" align="center">
                    <Skeleton.Input active className="!w-36 !h-5" />
                </Flex>
                <Flex
                    wrap
                    gap={8}
                    className="[&>*]:flex-[0_0_100%] [&>*]:sm:flex-[0_0_calc(50%-4px)]"
                >
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Flex
                            key={i}
                            vertical
                            gap={4}
                            className="bg-[#F9FAFB] rounded-xl px-4 py-3"
                        >
                            <Skeleton.Input active size="small" className="!w-24 !h-3" />
                            <Skeleton.Input active size="small" className="!w-36 !h-4" />
                        </Flex>
                    ))}
                </Flex>
            </SkeletonCard>

            {/* LinkedInvoice skeleton */}
            <SkeletonCard>
                <Skeleton.Input active className="!w-28 !h-5" />
                <Flex vertical gap={10}>
                    <Flex justify="space-between" align="center" gap={10}>
                        <Flex align="center" gap={10} className="min-w-0">
                            <Skeleton.Avatar active size={36} shape="square" />
                            <Flex vertical gap={4} className="min-w-0">
                                <Skeleton.Input active size="small" className="!w-32 !h-4" />
                                <Skeleton.Input active size="small" className="!w-24 !h-3" />
                            </Flex>
                        </Flex>
                        <Flex vertical gap={4} className="flex-shrink-0">
                            <Skeleton.Input active size="small" className="!w-20 !h-4" />
                            <Skeleton.Input active size="small" className="!w-16 !h-3" />
                        </Flex>
                        <Skeleton.Button active className="!w-28 !h-9 !rounded-md" />{' '}
                    </Flex>
                </Flex>
            </SkeletonCard>

            {/* TransactionTimeline skeleton */}
            <SkeletonCard>
                <Skeleton.Input active className="!w-44 !h-5" />
                <Flex vertical gap={0}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Flex key={i} gap={16} align="flex-start">
                            <Flex vertical align="center" className="flex-shrink-0 w-4">
                                <div className="w-4 h-4 rounded-full bg-[#D1FAE5]" />
                                {i < 2 && (
                                    <div
                                        className="w-0.5 mt-1 bg-[#D1FAE5]"
                                        style={{ minHeight: 36 }}
                                    />
                                )}
                            </Flex>
                            <Flex vertical gap={4} className="pb-5">
                                <Skeleton.Input active size="small" className="!w-28 !h-4" />
                                <Skeleton.Input active size="small" className="!w-20 !h-3" />
                            </Flex>
                        </Flex>
                    ))}
                </Flex>
            </SkeletonCard>
        </Flex>

        {/* RIGHT COLUMN */}
        <Flex vertical gap={16} className="w-full lg:w-[360px] flex-shrink-0">
            {/* CustomerInformation skeleton */}
            <SkeletonCard>
                <Skeleton.Input active className="!w-44 !h-5" />
                <Flex align="center" gap={10}>
                    <Skeleton.Avatar active size={36} shape="square" />
                    <Flex vertical gap={4}>
                        <Skeleton.Input active size="small" className="!w-32 !h-4" />
                        <Skeleton.Input active size="small" className="!w-24 !h-3" />
                    </Flex>
                </Flex>
                <Divider className="m-0" />
                <Flex vertical gap={10}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Flex key={i} justify="space-between" align="center">
                            <Skeleton.Input active size="small" className="!w-14 !h-3" />
                            <Skeleton.Input active size="small" className="!w-36 !h-3" />
                        </Flex>
                    ))}
                </Flex>
            </SkeletonCard>

            {/* PaymentReceiptPreview skeleton */}
            <SkeletonCard>
                <Skeleton.Input active className="!w-48 !h-5" />
                <Flex vertical className="rounded-2xl overflow-hidden border border-[#E5E7EB]">
                    <div className="h-32 bg-[#FEE2E2] rounded-t-2xl" />
                    <Flex vertical gap={10} className="px-4 py-5">
                        <Flex justify="center" align='center' vertical gap={4}>
                            <Skeleton.Input active size="small" className="!w-32 !h-3" />
                            <Skeleton.Input active className="!h-6 !rounded-full" />
                        </Flex>
                        <Divider className="m-0" />
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Flex key={i} justify="space-between" align="center">
                                <Skeleton.Input active size="small" className="!h-3" />
                                <Skeleton.Input active size="small" className="!h-3" />
                            </Flex>
                        ))}
                        <Divider className="m-0" />
                        <Flex justify="space-between" align="center">
                            <Skeleton.Input active size="small" className="!h-3" />
                            <Skeleton.Input active size="small" className="!h-3" />
                        </Flex>
                    </Flex>
                </Flex>
            </SkeletonCard>

            {/* Download button skeleton */}
            <Skeleton.Button active block className="!h-11 !rounded-lg" />
        </Flex>
    </Flex>
);

export default PaymentDetailsSkeleton;
