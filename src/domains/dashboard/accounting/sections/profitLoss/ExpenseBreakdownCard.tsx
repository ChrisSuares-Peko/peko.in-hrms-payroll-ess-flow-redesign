import { Flex, Typography } from 'antd';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import ReportCardState from './ReportCardState';
import SectionCard from './SectionCard';
import { ExpenseSlice } from '../../utils/profitLossData';
import { capitalizeFirst, formatRupee } from '../../utils/reportFormat';

const { Text } = Typography;

interface ExpenseBreakdownData {
    title: string;
    centerLabel: string;
    centerValue: string;
    slices: ExpenseSlice[];
}

interface ExpenseBreakdownCardProps {
    data: ExpenseBreakdownData;
    loading?: boolean;
}

const ExpenseBreakdownCard = ({ data, loading }: ExpenseBreakdownCardProps) => {
    if (loading || data.slices.length === 0) {
        return (
            <SectionCard title={data.title}>
                <ReportCardState loading={loading} />
            </SectionCard>
        );
    }

    return (
        <SectionCard title={data.title}>
            <div className="relative h-[200px] w-full">
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie
                            data={data.slices}
                            dataKey="value"
                            nameKey="label"
                            innerRadius={58}
                            outerRadius={85}
                            paddingAngle={2}
                            stroke="none"
                        >
                            {data.slices.map((s: ExpenseSlice) => (
                                <Cell key={s.label} fill={s.color} />
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
                    gap={2}
                    className="pointer-events-none absolute inset-0"
                >
                    <Text className="text-xs text-slate-400">{data.centerLabel}</Text>
                    <Text className="text-lg font-semibold text-ink">{data.centerValue}</Text>
                </Flex>
            </div>
            <Flex vertical gap={12} className="w-full">
                {data.slices.map((s: ExpenseSlice) => (
                    <Flex
                        key={s.label}
                        align="center"
                        justify="space-between"
                        gap={12}
                        className="w-full"
                    >
                        <Flex align="center" gap={8} className="min-w-0">
                            <span
                                className="size-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: s.color }}
                            />
                            <Text className="truncate text-sm text-bodyText">{s.label}</Text>
                        </Flex>
                        <Flex align="center" gap={8} className="shrink-0">
                            <Text className="text-sm font-medium text-ink">{s.display}</Text>
                            <Text className="text-xs text-slate-400">{s.pct}</Text>
                        </Flex>
                    </Flex>
                ))}
            </Flex>
        </SectionCard>
    );
};

export default ExpenseBreakdownCard;
