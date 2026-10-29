import { Flex, Typography } from 'antd';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import {
    distributionCenterLabel,
    distributionTitle,
    formatRupee,
    CategorySlice,
} from '../../utils/expenseStatementData';
import { capitalizeFirst } from '../../utils/reportFormat';
import ReportCardState from '../profitLoss/ReportCardState';
import SectionCard from '../profitLoss/SectionCard';

const { Text } = Typography;

interface CategoryDistributionCardProps {
    slices: CategorySlice[];
    centerValue: string;
    centerLabel?: string;
    title?: string;
    loading?: boolean;
}

const CategoryDistributionCard = ({
    slices,
    centerValue,
    centerLabel = distributionCenterLabel,
    title = distributionTitle,
    loading,
}: CategoryDistributionCardProps) => {
    if (loading || slices.length === 0) {
        return (
            <SectionCard title={title}>
                <ReportCardState loading={loading} />
            </SectionCard>
        );
    }

    return (
        <SectionCard title={title}>
            <Flex gap={24} className="w-full flex-col items-center md:flex-row">
                <div className="relative h-[200px] w-[200px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={slices}
                                dataKey="amount"
                                nameKey="label"
                                cx="50%"
                                cy="50%"
                                innerRadius={62}
                                outerRadius={92}
                                paddingAngle={2}
                                stroke="none"
                            >
                                {slices.map((slice: CategorySlice) => (
                                    <Cell key={slice.key} fill={slice.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number, name: string | number) => [
                                    formatRupee(value),
                                    capitalizeFirst(name),
                                ]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <Flex
                        vertical
                        align="center"
                        justify="center"
                        className="pointer-events-none absolute inset-0"
                    >
                        <Text className="text-lg font-semibold text-ink">{centerValue}</Text>
                        <Text className="text-xs text-slate-400">{centerLabel}</Text>
                    </Flex>
                </div>

                <Flex vertical gap={10} className="w-full min-w-0 flex-1">
                    {slices.map((slice: CategorySlice) => (
                        <Flex
                            key={slice.key}
                            align="center"
                            justify="space-between"
                            gap={8}
                            className="w-full"
                        >
                            <Flex align="center" gap={8} className="min-w-0">
                                <span
                                    className="size-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: slice.color }}
                                />
                                <Text className="min-w-0 truncate text-sm text-bodyText">
                                    {slice.label}
                                </Text>
                            </Flex>
                            <Flex align="center" gap={10} className="shrink-0">
                                <Text className="text-sm font-medium text-ink">
                                    {slice.display}
                                </Text>
                                <Text className="w-12 text-right text-xs text-slate-400">
                                    {slice.pct}%
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
