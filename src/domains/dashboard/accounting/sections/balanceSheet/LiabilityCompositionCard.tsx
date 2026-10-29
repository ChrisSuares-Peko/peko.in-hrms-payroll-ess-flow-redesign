import { Flex, Typography } from 'antd';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { CompositionSlice, liabilityComposition } from '../../utils/balanceSheetData';
import SectionCard from '../profitLoss/SectionCard';

const { Text } = Typography;

interface LiabilityCompositionCardProps {
    centerValue: string;
    slices: CompositionSlice[];
}

const LiabilityCompositionCard = ({ centerValue, slices }: LiabilityCompositionCardProps) => (
    <SectionCard title={liabilityComposition.title} subtitle={liabilityComposition.subtitle}>
        <div className="relative h-[200px] w-full">
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie
                        data={slices}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={58}
                        outerRadius={85}
                        paddingAngle={2}
                        stroke="none"
                    >
                        {slices.map((s: CompositionSlice) => (
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
                <Text className="text-xs text-slate-400">{liabilityComposition.centerLabel}</Text>
                <Text className="text-lg font-semibold text-ink">{centerValue}</Text>
            </Flex>
        </div>
        <Flex vertical gap={12} className="w-full">
            {slices.map((s: CompositionSlice) => (
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

export default LiabilityCompositionCard;
