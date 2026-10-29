import { Flex, Skeleton } from 'antd';

const SelectionCardSkeleton = () => (
    <Flex vertical gap={6} className="overflow-y-auto pe-1" style={{ maxHeight: 320 }}>
        {[...Array(4)].map((_, i) => (
            <Flex
                key={i}
                justify="space-between"
                align="center"
                className="p-3 rounded-xl border border-[#E5E7EB]"
            >
                <Flex align="center" gap={10}>
                    <Skeleton.Avatar active shape="circle" size={32} />
                    <Flex vertical gap={4}>
                        <Skeleton.Input active size="small" style={{ width: 120, height: 12 }} />
                        <Skeleton.Input active size="small" style={{ width: 160, height: 10 }} />
                    </Flex>
                </Flex>
                <Skeleton.Input active size="small" style={{ width: 80, height: 12 }} />
            </Flex>
        ))}
    </Flex>
);

export default SelectionCardSkeleton;
