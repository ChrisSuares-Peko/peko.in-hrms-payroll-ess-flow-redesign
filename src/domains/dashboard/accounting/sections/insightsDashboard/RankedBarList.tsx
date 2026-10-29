import { Flex, Progress, Typography } from 'antd';

import { dashboardColors, RankedBarListData } from '../../utils/insightsDashboardData';

const { Title, Text } = Typography;

const RankedBarList = ({ data }: { data: RankedBarListData }) => (
    <Flex
        vertical
        gap={4}
        className="h-full rounded-2xl border border-borderSubtle bg-white p-4 sm:p-6"
    >
        <Title level={5} className="!mb-0 !text-lg !font-semibold !text-ink">
            {data.title}
        </Title>
        <Text className="text-sm text-muted">{data.subtitle}</Text>

        <Flex vertical gap={16} className="mt-4">
            {data.items.map(item => (
                <Flex key={item.key} vertical gap={6}>
                    <Flex align="center" justify="space-between" gap={8}>
                        <Text className="truncate text-sm font-medium text-ink">{item.name}</Text>
                        <Text className="shrink-0 text-sm text-muted">{item.value}</Text>
                    </Flex>
                    <Progress
                        percent={item.percent}
                        showInfo={false}
                        strokeColor={item.color}
                        trailColor={dashboardColors.grid}
                        strokeWidth={6}
                        className="!mb-0"
                    />
                </Flex>
            ))}
        </Flex>
    </Flex>
);

export default RankedBarList;
