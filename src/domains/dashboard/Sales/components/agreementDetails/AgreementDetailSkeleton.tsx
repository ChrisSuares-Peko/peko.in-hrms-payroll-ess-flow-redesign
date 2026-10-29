import { Divider, Flex, Skeleton } from 'antd';
import { Content } from 'antd/es/layout/layout';

const AgreementDetailSkeleton = () => (
    <Content className="px-0">
        <Flex justify="space-between" align="flex-start" className="mt-4 mb-6" wrap="wrap" gap={12}>
            <Flex vertical gap={8}>
                <Skeleton.Input active style={{ width: 300, height: 24 }} />
                <Skeleton.Input active size="small" style={{ width: 200, height: 16 }} />
            </Flex>
            <Flex gap={8} wrap="wrap">
                {[90, 90, 100, 80].map((w, i) => (
                    <Skeleton.Button key={i} active style={{ width: w, height: 36 }} />
                ))}
            </Flex>
        </Flex>

        <Flex className="w-full gap-6 flex-col lg:flex-row lg:items-start">
            <Flex vertical className="flex-1 min-w-0 gap-6">
                <Flex vertical className="rounded-2xl border border-[#E5E7EB] p-6 gap-5">
                    <Skeleton.Input active size="small" style={{ width: 150, height: 16 }} />
                    <Flex wrap gap={8} className="[&>*]:flex-[0_0_calc(50%-4px)]">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Flex key={i} vertical gap={2} className="bg-[#F9FAFB] rounded-xl px-4 py-3">
                                <Skeleton.Input active size="small" style={{ width: 70, height: 12 }} />
                                <Skeleton.Input active size="small" style={{ width: 110, height: 16 }} />
                            </Flex>
                        ))}
                    </Flex>
                </Flex>
            </Flex>

            <Flex vertical className="w-full lg:w-[360px] lg:shrink-0 gap-6">
                <Flex vertical className="rounded-2xl border border-[#E5E7EB] p-6 gap-5">
                    <Skeleton.Input active size="small" style={{ width: 160, height: 16 }} />
                    <Flex align="center" gap={12}>
                        <Skeleton.Avatar active size={48} shape="square" />
                        <Skeleton.Input active size="small" style={{ width: 120, height: 16 }} />
                    </Flex>
                    <Divider className="my-0" style={{ borderColor: 'rgba(0,0,0,0.05)' }} />
                    <Flex vertical gap={16}>
                        {[1, 2, 3].map(i => (
                            <Flex key={i} justify="space-between">
                                <Skeleton.Input
                                    active
                                    size="small"
                                    style={{ width: 60, height: 14 }}
                                />
                                <Skeleton.Input
                                    active
                                    size="small"
                                    style={{ width: 140, height: 14 }}
                                />
                            </Flex>
                        ))}
                    </Flex>
                </Flex>

                <Flex vertical className="rounded-2xl border border-[#E5E7EB] p-6 gap-5">
                    <Skeleton.Input active size="small" style={{ width: 130, height: 16 }} />
                    <Skeleton.Input active style={{ width: '100%', height: 40 }} />
                </Flex>

                <Flex vertical className="rounded-2xl border border-[#E5E7EB] p-6 gap-5">
                    <Skeleton.Input active size="small" style={{ width: 140, height: 16 }} />
                    <Flex vertical gap={8}>
                        {[1, 2, 3].map(i => (
                            <Flex key={i} align="center" gap={10} className="px-3 py-2">
                                <Skeleton.Avatar active size={16} shape="circle" />
                                <Flex vertical gap={4}>
                                    <Skeleton.Input
                                        active
                                        size="small"
                                        style={{ width: 160, height: 14 }}
                                    />
                                    <Skeleton.Input
                                        active
                                        size="small"
                                        style={{ width: 80, height: 12 }}
                                    />
                                </Flex>
                            </Flex>
                        ))}
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    </Content>
);

export default AgreementDetailSkeleton;
