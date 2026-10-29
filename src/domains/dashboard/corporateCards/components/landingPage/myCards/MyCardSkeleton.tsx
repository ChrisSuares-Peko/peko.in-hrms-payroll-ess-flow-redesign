import { Flex, Skeleton } from 'antd';

const MyCardSkeleton = () => (
    <article className="flex flex-col gap-5 rounded-2xl border border-borderCard bg-white p-5 xl:p-6">
        <Flex justify="space-between">
            <Skeleton.Button active size="small" shape="round" style={{ width: 90 }} />
            <Skeleton.Button active size="small" shape="round" style={{ width: 70 }} />
        </Flex>

        <Flex justify="center">
            <Skeleton.Input active style={{ width: '66%', height: 140, borderRadius: 16 }} />
        </Flex>

        <Flex vertical align="center" gap={6}>
            <Skeleton.Input active size="small" style={{ width: 80 }} />
            <Skeleton.Input active style={{ width: 120 }} />
        </Flex>

        <Flex vertical gap={8}>
            <Skeleton.Input active size="small" style={{ width: 100 }} />
            <div className="h-2 w-full overflow-hidden rounded-full bg-listBg" />
            <Flex justify="space-between">
                <Skeleton.Input active size="small" style={{ width: 90 }} />
                <Skeleton.Input active size="small" style={{ width: 90 }} />
            </Flex>
        </Flex>

        <Flex gap={8}>
            <Skeleton.Button active block />
            <Skeleton.Button active block />
            <Skeleton.Button active block />
        </Flex>
    </article>
);

export default MyCardSkeleton;
