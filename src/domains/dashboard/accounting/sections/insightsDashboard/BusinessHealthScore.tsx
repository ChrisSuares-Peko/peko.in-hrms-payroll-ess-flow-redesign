import { Empty, Flex, Progress, Spin, Typography } from 'antd';
import { Cell, Pie, PieChart } from 'recharts';

import { BusinessHealth } from '../../api/reports';
import { dashboardColors } from '../../utils/insightsDashboardData';

const { Title, Text } = Typography;

const METRIC_COLORS: Record<string, string> = {
    'revenue-growth': dashboardColors.revenueGrowth,
    'profit-margin': dashboardColors.profitMargin,
    'cash-flow': dashboardColors.cashFlow,
    'gst-compliance': dashboardColors.gstCompliance,
    'ar-health': dashboardColors.arHealth,
};

interface BusinessHealthScoreProps {
    data: BusinessHealth | null;
    loading: boolean;
}

const BusinessHealthScore = ({ data, loading }: BusinessHealthScoreProps) => (
    <Flex
        vertical
        gap={4}
        className="h-full rounded-2xl border border-borderSubtle bg-white p-4 sm:p-6"
    >
        <Title level={5} className="!mb-0 !text-lg !font-semibold !text-ink">
            Business Health Score
        </Title>
        <Text className="text-sm text-muted">
            Composite score from revenue, margin, cash flow & receivables
        </Text>

        {loading && (
            <Flex align="center" justify="center" className="min-h-[180px] flex-1">
                <Spin />
            </Flex>
        )}

        {!loading && !data && (
            <Flex align="center" justify="center" className="min-h-[180px] flex-1">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No health data" />
            </Flex>
        )}

        {!loading && data && (
            <Flex gap={24} align="center" className="mt-4 flex-col md:flex-row">
                <Flex vertical align="center" className="max-w-full shrink-0">
                    <div className="relative max-w-full overflow-x-hidden">
                        <PieChart width={240} height={140}>
                            <Pie
                                data={[{ value: data.score }, { value: 100 - data.score }]}
                                dataKey="value"
                                cx="50%"
                                cy="100%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius={82}
                                outerRadius={116}
                                cornerRadius={10}
                                stroke="none"
                            >
                                <Cell fill={dashboardColors.gaugeFill} />
                                <Cell fill={dashboardColors.gaugeTrack} />
                            </Pie>
                        </PieChart>
                        <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center">
                            <Text className="!text-xl !font-bold !text-success">
                                {data.score}/100
                            </Text>
                        </div>
                    </div>
                    <Flex
                        justify="space-between"
                        className="w-full max-w-[240px] px-3 text-xs text-muted"
                    >
                        <span>0</span>
                        <span>100</span>
                    </Flex>
                </Flex>

                <Flex vertical gap={14} className="w-full min-w-0 flex-1">
                    {data.metrics.map(metric => (
                        <Flex key={metric.key} vertical gap={4}>
                            <Flex align="center" justify="space-between" gap={8}>
                                <Text className="text-sm text-bodyText">{metric.label}</Text>
                                <Text className="shrink-0 text-sm font-semibold text-ink">
                                    {metric.value}
                                </Text>
                            </Flex>
                            <Progress
                                percent={metric.percent}
                                showInfo={false}
                                strokeColor={
                                    metric.pending
                                        ? dashboardColors.gaugeTrack
                                        : METRIC_COLORS[metric.key]
                                }
                                trailColor={dashboardColors.gaugeTrack}
                                strokeWidth={6}
                                className="!mb-0"
                            />
                        </Flex>
                    ))}
                </Flex>
            </Flex>
        )}
    </Flex>
);

export default BusinessHealthScore;
