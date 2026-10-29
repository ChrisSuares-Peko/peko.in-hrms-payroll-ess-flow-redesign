import { Flex, Typography } from 'antd';

import SectionCard from './SectionCard';
import { SummaryRow } from '../../utils/profitLossData';

const { Text } = Typography;

const EMPHASIS_ROW_CLASS: Record<NonNullable<SummaryRow['emphasis']>, string> = {
    warning: 'border border-warning-border bg-warning-surface',
    subtotal: 'border border-borderStrong bg-surfaceGray',
    success: 'border border-success-border bg-success-surface',
};

const EMPHASIS_VALUE_CLASS: Record<NonNullable<SummaryRow['emphasis']>, string> = {
    warning: 'text-warning !font-semibold',
    subtotal: 'text-ink !font-semibold',
    success: 'text-success !font-semibold',
};

interface PnlSummaryData {
    title: string;
    rows: SummaryRow[];
    margins: { label: string; value: string }[];
}

interface PnlSummaryCardProps {
    data: PnlSummaryData;
}

const PnlSummaryCard = ({ data }: PnlSummaryCardProps) => (
    <SectionCard title={data.title}>
        <Flex vertical gap={8}>
            {data.rows.map((row: SummaryRow) => {
                const isNegative = row.value.trim().startsWith('-');

                return (
                    <Flex
                        key={row.label}
                        justify="space-between"
                        align="center"
                        className={`rounded-lg px-4 py-2.5 ${row.emphasis ? EMPHASIS_ROW_CLASS[row.emphasis] : ''}`.trim()}
                    >
                        <Text className="text-sm text-bodyText">
                            {row.label}
                            {row.note && (
                                <Text className="ml-1 text-xs text-slate-400">({row.note})</Text>
                            )}
                        </Text>
                        <Text
                            className={`text-sm font-medium ${
                                isNegative ? 'text-danger' : ''
                            } ${row.emphasis ? EMPHASIS_VALUE_CLASS[row.emphasis] : ''}`
                                .replace(/\s+/g, ' ')
                                .trim()}
                        >
                            {row.value}
                        </Text>
                    </Flex>
                );
            })}
        </Flex>

        <Flex justify="space-between" wrap gap={16} className="mt-3 border-t border-slate-100 pt-5">
            {data.margins.map(margin => (
                <Flex key={margin.label} vertical align="center" gap={4} className="min-w-[64px] flex-1">
                    <Text className="text-xl font-bold text-ink sm:text-2xl">{margin.value}</Text>
                    <Text className="text-xs text-slate-400">{margin.label}</Text>
                </Flex>
            ))}
        </Flex>
    </SectionCard>
);

export default PnlSummaryCard;
