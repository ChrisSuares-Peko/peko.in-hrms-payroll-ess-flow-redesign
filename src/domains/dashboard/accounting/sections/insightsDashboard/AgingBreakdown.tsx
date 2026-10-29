import { Flex, Typography } from 'antd';

import { AgingData } from '../../utils/insightsDashboardData';

const { Title, Text } = Typography;

const AgingBreakdown = ({ data }: { data: AgingData }) => (
    <Flex
        vertical
        gap={4}
        className="h-full rounded-2xl border border-borderSubtle bg-white p-4 sm:p-6"
    >
        <Flex align="flex-start" justify="space-between" gap={12}>
            <Flex vertical gap={2} className="min-w-0">
                <Title level={5} className="!mb-0 !text-lg !font-semibold !text-ink">
                    {data.title}
                </Title>
                <Text className="text-sm text-muted">{data.subtitle}</Text>
            </Flex>
            <Text className="shrink-0 text-base font-semibold text-ink">{data.totalShort}</Text>
        </Flex>

        <Flex gap={4} className="mt-4 h-2.5 w-full">
            {data.buckets.map(bucket => (
                <div
                    key={bucket.key}
                    className="h-full rounded-full"
                    style={{
                        flexGrow: bucket.percent,
                        flexBasis: 0,
                        backgroundColor: bucket.color,
                    }}
                />
            ))}
        </Flex>

        <Flex vertical gap={12} className="mt-4">
            {data.buckets.map(bucket => (
                <Flex key={bucket.key} align="center" justify="space-between" gap={8}>
                    <Flex align="center" gap={8} className="min-w-0">
                        <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: bucket.color }}
                        />
                        <Text className="text-sm text-bodyText">{bucket.label}</Text>
                    </Flex>
                    <Flex align="center" gap={12} className="shrink-0">
                        <Text className="text-xs text-muted">{bucket.percent}%</Text>
                        <Text className="w-14 text-right text-sm font-medium text-ink">
                            {bucket.value}
                        </Text>
                    </Flex>
                </Flex>
            ))}
        </Flex>
    </Flex>
);

export default AgingBreakdown;
