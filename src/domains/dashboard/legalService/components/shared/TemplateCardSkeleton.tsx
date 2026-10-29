import { Flex, Skeleton } from 'antd';

const TemplateCardSkeleton = () => (
    <Flex vertical gap={12} className="p-4 rounded-2xl border border-gray-100 bg-white" style={{ minWidth: 200, flex: '1 1 calc(33.333% - 12px)' }}>
        <Flex align="center" gap={12}>
            <Skeleton.Avatar active size={40} shape="square" style={{ borderRadius: 10 }} />
            <Flex vertical gap={4} className="flex-1">
                <Skeleton.Input active size="small" style={{ width: '70%', height: 16 }} />
                <Skeleton.Input active size="small" style={{ width: '40%', height: 12 }} />
            </Flex>
        </Flex>
        <Skeleton.Input active size="small" style={{ width: '90%', height: 12 }} />
        <Skeleton.Input active size="small" style={{ width: '60%', height: 12 }} />
        <Skeleton.Button active size="small" style={{ width: 80, height: 28, borderRadius: 8 }} />
    </Flex>
);

export const TemplateCardGridSkeleton = ({ count = 8 }: { count?: number }) => (
    <Flex wrap gap={16} style={{ width: '100%' }}>
        {Array.from({ length: count }).map((_, i) => (
            <TemplateCardSkeleton key={i} />
        ))}
    </Flex>
);

export default TemplateCardSkeleton;
