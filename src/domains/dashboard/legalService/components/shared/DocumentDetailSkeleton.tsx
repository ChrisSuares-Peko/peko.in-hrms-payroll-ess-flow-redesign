import { Flex, Skeleton } from 'antd';

const DocumentDetailSkeleton = () => (
    <Flex vertical gap={36} className="pt-4 pb-10">
        {/* Header */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
            <Flex align="center" gap={12}>
                <Skeleton.Input active style={{ width: 240, height: 32 }} />
                <Skeleton.Button active style={{ width: 72, height: 28, borderRadius: 999 }} />
            </Flex>
            <Flex gap={12}>
                <Skeleton.Button active style={{ width: 90, height: 40, borderRadius: 8 }} />
                <Skeleton.Button active style={{ width: 110, height: 40, borderRadius: 8 }} />
                <Skeleton.Button active style={{ width: 90, height: 40, borderRadius: 8 }} />
            </Flex>
        </Flex>

        {/* Body */}
        <Flex className="flex-col xl:flex-row items-stretch gap-0">
            {/* PDF area */}
            <Flex vertical gap={12} className="flex-1 min-w-0 p-8 bg-gray-50 rounded-tl-[28px] rounded-bl-[28px]" style={{ minHeight: 600 }}>
                {Array.from({ length: 18 }).map((_, i) => (
                    <Skeleton.Input key={i} active style={{ width: i % 5 === 4 ? '60%' : '100%', height: 14 }} />
                ))}
            </Flex>

            {/* Sidebar */}
            <Flex vertical gap={24} className="w-full xl:w-[420px] shrink-0 p-4 pt-6 bg-white rounded-tr-[28px] rounded-br-[28px]">
                {/* Timeline */}
                <Flex vertical gap={16} className="p-4 py-6 rounded-[20px] outline outline-[0.38px] outline-stone-300">
                    <Skeleton.Input active style={{ width: 160, height: 18 }} />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Flex gap={8} key={i} align="flex-start">
                            <Skeleton.Avatar active size={24} />
                            <Flex vertical gap={4} className="flex-1">
                                <Skeleton.Input active size="small" style={{ width: '60%', height: 14 }} />
                                <Skeleton.Input active size="small" style={{ width: '80%', height: 12 }} />
                            </Flex>
                        </Flex>
                    ))}
                </Flex>

                {/* Metadata */}
                <Flex vertical gap={16} className="p-6 bg-gray-50 rounded-2xl">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Flex justify="space-between" key={i}>
                            <Skeleton.Input active size="small" style={{ width: 100, height: 14 }} />
                            <Skeleton.Input active size="small" style={{ width: 120, height: 14 }} />
                        </Flex>
                    ))}
                </Flex>
            </Flex>
        </Flex>
    </Flex>
);

export default DocumentDetailSkeleton;
