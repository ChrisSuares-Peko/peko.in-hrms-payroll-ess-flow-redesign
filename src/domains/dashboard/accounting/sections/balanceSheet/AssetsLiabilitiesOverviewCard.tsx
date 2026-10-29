import { Flex, Typography } from 'antd';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { overviewBars, OverviewDonut, OverviewSlice } from '../../utils/balanceSheetData';
import SectionCard from '../profitLoss/SectionCard';

const { Text } = Typography;

interface AssetsLiabilitiesOverviewCardProps {
    donut: OverviewDonut;
}

const AssetsLiabilitiesOverviewCard = ({ donut }: AssetsLiabilitiesOverviewCardProps) => (
    <SectionCard title={overviewBars.title} subtitle={overviewBars.subtitle}>
        <Flex
            align="center"
            gap={24}
            wrap="wrap"
            className="w-full flex-col pt-2 sm:flex-row sm:flex-nowrap"
        >
            <div className="relative h-[200px] w-full shrink-0 sm:w-[220px]">
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie
                            data={donut.slices}
                            dataKey="value"
                            nameKey="label"
                            innerRadius={58}
                            outerRadius={85}
                            paddingAngle={2}
                            stroke="none"
                        >
                            {donut.slices.map((s: OverviewSlice) => (
                                <Cell key={s.label} fill={s.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <Flex
                    vertical
                    align="center"
                    justify="center"
                    gap={2}
                    className="pointer-events-none absolute inset-0"
                >
                    <Text className="text-xs text-slate-400">{donut.centerLabel}</Text>
                    <Text className="text-lg font-semibold text-ink">{donut.centerValue}</Text>
                </Flex>
            </div>

            <Flex vertical gap={16} className="w-full min-w-0 flex-1">
                {donut.slices.map((s: OverviewSlice) => (
                    <Flex key={s.label} align="center" justify="space-between" gap={12}>
                        <Flex align="center" gap={10} className="min-w-0">
                            <span
                                className="size-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: s.color }}
                            />
                            <Text className="truncate text-sm text-bodyText">{s.label}</Text>
                        </Flex>
                        <Flex align="center" gap={10} className="shrink-0">
                            <Text className="text-sm font-semibold text-ink">{s.display}</Text>
                            <Text className="text-sm text-slate-400">{s.pct}</Text>
                        </Flex>
                    </Flex>
                ))}
            </Flex>
        </Flex>
    </SectionCard>
);

export default AssetsLiabilitiesOverviewCard;
