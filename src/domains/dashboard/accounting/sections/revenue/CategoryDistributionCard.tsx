import { Flex, Typography } from 'antd';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

import { CategorySlice } from '../../utils/revenueStatementData';
import ReportCardState from '../profitLoss/ReportCardState';
import SectionCard from '../profitLoss/SectionCard';

const { Text } = Typography;

interface CategoryDistributionData {
    title: string;
    centerLabel: string;
    centerValue: string;
    slices: CategorySlice[];
}

interface CategoryDistributionCardProps {
    data: CategoryDistributionData;
    loading?: boolean;
}

const CategoryDistributionCard = ({ data, loading }: CategoryDistributionCardProps) => {
    if (loading || data.slices.length === 0) {
        return (
            <SectionCard title={data.title}>
                <ReportCardState loading={loading} />
            </SectionCard>
        );
    }

    return (
        <SectionCard title={data.title}>
            <Flex gap={20} align="center" className="w-full flex-col lg:flex-row">
                <div className="relative h-[200px] w-[200px] shrink-0 lg:h-[228px] lg:w-[228px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.slices}
                                dataKey="percent"
                                innerRadius="62%"
                                outerRadius="92%"
                                paddingAngle={1}
                                stroke="none"
                            >
                                {data.slices.map((slice: CategorySlice) => (
                                    <Cell key={slice.key} fill={slice.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <Flex
                        vertical
                        align="center"
                        justify="center"
                        gap={2}
                        className="pointer-events-none absolute inset-0"
                    >
                        <Text className="text-xs text-slate-400">{data.centerLabel}</Text>
                        <Text className="text-lg font-semibold text-ink">{data.centerValue}</Text>
                    </Flex>
                </div>

                <Flex vertical gap={12} className="w-full min-w-0 flex-1">
                    {data.slices.map((slice: CategorySlice) => (
                        <Flex
                            key={slice.key}
                            align="center"
                            justify="space-between"
                            gap={12}
                            className="w-full"
                        >
                            <Flex align="center" gap={8} className="min-w-0">
                                <span
                                    className="size-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: slice.color }}
                                />
                                <Text className="truncate text-sm text-bodyText">
                                    {slice.label}
                                </Text>
                            </Flex>
                            <Flex align="center" gap={10} className="shrink-0">
                                <Text className="text-sm font-medium text-ink">
                                    {slice.display}
                                </Text>
                                <Text className="w-14 text-right text-xs text-muted">
                                    {slice.percent}%
                                </Text>
                            </Flex>
                        </Flex>
                    ))}
                </Flex>
            </Flex>
        </SectionCard>
    );
};

export default CategoryDistributionCard;
