import { Card, Flex, Skeleton } from 'antd';

const DocumentPageSkeleton = () => (
    <Flex vertical gap={24} className="pt-4 pb-10">
        {/* Header */}
        <Flex vertical gap={8}>
            <Skeleton.Input active style={{ width: 280, height: 32 }} />
            <Skeleton.Input active size="small" style={{ width: 180, height: 16 }} />
        </Flex>

        {/* Tabs */}
        <Flex gap={8}>
            <Skeleton.Button active style={{ width: 120, height: 40, borderRadius: 8 }} />
            <Skeleton.Button active style={{ width: 120, height: 40, borderRadius: 8 }} />
        </Flex>

        {/* Main content: form + preview */}
        <Flex gap={24} className="flex-col xl:flex-row">
            {/* Left: form fields */}
            <Card className="flex-1 rounded-2xl" styles={{ body: { padding: 24 } }}>
                <Flex vertical gap={20}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Flex vertical gap={6} key={i}>
                            <Skeleton.Input active size="small" style={{ width: 120, height: 14 }} />
                            <Skeleton.Input active style={{ width: '100%', height: 40 }} />
                        </Flex>
                    ))}
                    <Skeleton.Button active style={{ width: 120, height: 40, borderRadius: 8 }} />
                </Flex>
            </Card>

            {/* Right: PDF preview */}
            <Flex vertical gap={12} className="w-full xl:w-[420px] shrink-0 rounded-2xl bg-gray-50 p-8" style={{ minHeight: 500 }}>
                {Array.from({ length: 16 }).map((_, i) => (
                    <Skeleton.Input key={i} active style={{ width: i % 5 === 4 ? '55%' : '100%', height: 14 }} />
                ))}
            </Flex>
        </Flex>
    </Flex>
);

export default DocumentPageSkeleton;
