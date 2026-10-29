import { Flex, Skeleton } from 'antd';

const ReminderRulesSkeleton = () => (
    <Flex vertical gap={8}>
        {[1, 2, 3, 4].map(i => (
            <Flex
                key={i}
                vertical
                gap={10}
                className="px-5 py-4 rounded-xl border border-[#E4E4E7] bg-white"
            >
                <Flex align="center" gap={12}>
                    <Skeleton.Avatar active size="small" shape="circle" />
                    <Flex vertical gap={4} className="flex-1">
                        <Skeleton.Input active size="small" style={{ width: 140, height: 14 }} />
                        <Skeleton.Input active size="small" style={{ width: 220, height: 12 }} />
                    </Flex>
                    <Skeleton.Input active size="small" style={{ width: 110, height: 28 }} />
                </Flex>
            </Flex>
        ))}
    </Flex>
);

export default ReminderRulesSkeleton;
