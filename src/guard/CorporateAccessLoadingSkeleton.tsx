import { Flex, Skeleton } from 'antd';

export default function CorporateAccessLoadingSkeleton() {
    return (
        <Flex vertical className="min-h-svh bg-white">
            <Flex
                align="center"
                justify="space-between"
                className="px-6 py-4 border-b border-solid border-gray-100"
            >
                <Skeleton active />
            </Flex>

            <Flex vertical gap={20} className="p-6 sm:p-8">
                <Skeleton.Input active block style={{ height: 220, borderRadius: 12 }} />

                <Flex gap={20} wrap="wrap">
                    <Skeleton.Input active style={{ width: 280, height: 120, borderRadius: 12 }} />
                    <Skeleton.Input active style={{ width: 280, height: 120, borderRadius: 12 }} />
                    <Skeleton.Input active style={{ width: 280, height: 120, borderRadius: 12 }} />
                </Flex>

                <Flex gap={20} wrap="wrap">
                    <Skeleton.Input active style={{ width: 520, height: 280, borderRadius: 12 }} />
                    <Skeleton.Input active style={{ width: 360, height: 280, borderRadius: 12 }} />
                </Flex>
            </Flex>
        </Flex>
    );
}
