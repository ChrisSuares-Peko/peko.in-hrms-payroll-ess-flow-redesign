import { Flex, Skeleton } from 'antd';

const DocListItemSkeleton = () => (
    <Flex align="center" gap={12} className="py-3 px-2">
        <Skeleton.Avatar active size={40} shape="square" style={{ borderRadius: 8 }} />
        <Flex vertical gap={4} className="flex-1">
            <Skeleton.Input active size="small" style={{ width: '60%', height: 14 }} />
            <Skeleton.Input active size="small" style={{ width: '40%', height: 12 }} />
        </Flex>
        <Skeleton.Button active size="small" style={{ width: 60, height: 24, borderRadius: 6 }} />
    </Flex>
);

export const DocListSkeleton = ({ count = 5 }: { count?: number }) => (
    <Flex vertical>
        {Array.from({ length: count }).map((_, i) => (
            <DocListItemSkeleton key={i} />
        ))}
    </Flex>
);

export default DocListItemSkeleton;
