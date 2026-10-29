import { Card, Flex, Skeleton } from 'antd';

import { DocListSkeleton } from './DocListItemSkeleton';
import { TemplateCardGridSkeleton } from './TemplateCardSkeleton';

const LandingPageSkeleton = () => (
    <Flex vertical gap={26} className="pt-4 bg-white min-h-screen">
        {/* Page header */}
        <Flex vertical gap={8}>
            <Skeleton.Input active style={{ width: 180, height: 32 }} />
            <Skeleton.Input active size="small" style={{ width: 280, height: 18 }} />
        </Flex>

        <Flex gap={25} align="flex-start" className="flex-col xl:flex-row">
            {/* Left: Browse Templates card */}
            <Card
                variant="borderless"
                className="w-full xl:flex-1 rounded-[32px] outline outline-[0.4px] outline-stone-300 bg-white"
                styles={{ body: { padding: '24px 20px 24px' } }}
            >
                <Flex vertical gap={24}>
                    <Flex justify="space-between" align="center">
                        <Flex vertical gap={4}>
                            <Skeleton.Input active style={{ width: 200, height: 24 }} />
                            <Skeleton.Input active size="small" style={{ width: 260, height: 16 }} />
                        </Flex>
                        <Skeleton.Button active style={{ width: 80, height: 28 }} />
                    </Flex>
                    <TemplateCardGridSkeleton count={8} />
                </Flex>
            </Card>

            {/* Right: My Templates + Recent Documents */}
            <Flex vertical gap={24} className="w-full xl:w-[380px] xl:flex-shrink-0">
                {/* My Templates */}
                <Card className="rounded-[20px]" styles={{ body: { padding: 16 } }}>
                    <Flex vertical gap={12}>
                        <Skeleton.Input active style={{ width: 140, height: 20 }} />
                        <DocListSkeleton count={3} />
                    </Flex>
                </Card>

                {/* Recent Documents */}
                <Card className="rounded-[20px]" styles={{ body: { padding: 16 } }}>
                    <Flex vertical gap={12}>
                        <Skeleton.Input active style={{ width: 160, height: 20 }} />
                        <Flex gap={8}>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton.Button key={i} active size="small" style={{ width: 70, height: 28, borderRadius: 6 }} />
                            ))}
                        </Flex>
                        <DocListSkeleton count={4} />
                    </Flex>
                </Card>
            </Flex>
        </Flex>
    </Flex>
);

export default LandingPageSkeleton;
