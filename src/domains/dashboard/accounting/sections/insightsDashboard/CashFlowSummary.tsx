import { Flex, Progress, Typography } from 'antd';

import {
    CashFlowItem,
    CashFlowSummaryData,
    dashboardColors,
} from '../../utils/insightsDashboardData';

const { Title, Text } = Typography;

const TONE: Record<CashFlowItem['tone'], { text: string; stroke: string; percent: number }> = {
    positive: { text: 'text-success', stroke: dashboardColors.revenueGrowth, percent: 100 },
    negative: { text: 'text-danger', stroke: dashboardColors.profitMargin, percent: 100 },
    neutral: { text: 'text-muted', stroke: dashboardColors.grid, percent: 0 },
};

const CashFlowSummary = ({ data }: { data: CashFlowSummaryData }) => (
    <Flex
        vertical
        gap={4}
        className="h-full rounded-2xl border border-borderSubtle bg-white p-4 sm:p-6"
    >
        <Title level={5} className="!mb-0 !text-lg !font-semibold !text-ink">
            {data.title}
        </Title>
        <Text className="text-sm text-muted">{data.subtitle}</Text>

        <Flex vertical gap={20} className="mt-4">
            {data.items.map(item => {
                const tone = TONE[item.tone];
                return (
                    <Flex key={item.key} vertical gap={6}>
                        <Flex align="center" justify="space-between" gap={8}>
                            <Text className="truncate text-sm font-medium text-ink">
                                {item.label}
                            </Text>
                            <Text className={`shrink-0 text-sm font-semibold ${tone.text}`}>
                                {item.value}
                            </Text>
                        </Flex>
                        <Progress
                            percent={tone.percent}
                            showInfo={false}
                            strokeColor={tone.stroke}
                            trailColor={dashboardColors.grid}
                            strokeWidth={6}
                            className="!mb-0"
                        />
                    </Flex>
                );
            })}
        </Flex>
    </Flex>
);

export default CashFlowSummary;
