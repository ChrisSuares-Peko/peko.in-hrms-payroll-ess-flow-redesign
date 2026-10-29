import { Flex, Typography } from 'antd';
import { Cell, Pie, PieChart } from 'recharts';

import { DonutBreakdownData } from '../../utils/insightsDashboardData';

const { Title, Text } = Typography;

const DonutBreakdown = ({ data }: { data: DonutBreakdownData }) => {
    const donutData = data.segments.map(seg => ({
        name: seg.label,
        value: seg.percent,
        color: seg.color,
    }));

    return (
        <Flex
            vertical
            gap={4}
            className="h-full rounded-2xl border border-borderSubtle bg-white p-4 sm:p-6"
        >
            <Title level={5} className="!mb-0 !text-lg !font-semibold !text-ink">
                {data.title}
            </Title>
            <Text className="text-sm text-muted">{data.subtitle}</Text>

            <Flex gap={20} align="center" className="mt-4 flex-col lg:flex-row">
                <div className="relative shrink-0">
                    <PieChart width={196} height={196}>
                        <Pie
                            data={donutData}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={94}
                            paddingAngle={1}
                            stroke="none"
                        >
                            {donutData.map(entry => (
                                <Cell key={entry.name} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                    <Flex
                        vertical
                        align="center"
                        justify="center"
                        className="pointer-events-none absolute inset-0"
                    >
                        <Text className="text-xs text-muted">{data.totalLabel}</Text>
                        <Text className="text-lg font-semibold text-ink">{data.totalValue}</Text>
                    </Flex>
                </div>

                <Flex vertical gap={10} className="w-full min-w-0 flex-1">
                    {data.segments.map(seg => (
                        <Flex key={seg.key} align="center" justify="space-between" gap={8}>
                            <Flex align="center" gap={8} className="min-w-0">
                                <span
                                    className="size-3 shrink-0 rounded-full"
                                    style={{ backgroundColor: seg.color }}
                                />
                                <Text className="truncate text-sm text-bodyText">{seg.label}</Text>
                            </Flex>
                            <Flex align="center" gap={10} className="shrink-0">
                                <Text className="text-sm font-medium text-ink">{seg.value}</Text>
                                <Text className="w-10 text-right text-xs text-muted">
                                    {seg.percent}%
                                </Text>
                            </Flex>
                        </Flex>
                    ))}
                </Flex>
            </Flex>
        </Flex>
    );
};

export default DonutBreakdown;
