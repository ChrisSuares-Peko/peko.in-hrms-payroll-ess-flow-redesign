import { Flex, Tag, Typography } from 'antd';

import {
    agingColumns,
    agingRowTotal,
    agingTitle,
    agingTotalHeader,
    agingTotalsRowLabel,
    agingVendorHeader,
    formatRupee,
    AgingColumn,
    AgingRow,
    AgingTotals,
} from '../../utils/accountsPayableData';

const { Title, Text } = Typography;

interface ApAgingAnalysisCardProps {
    rows: AgingRow[];
    totals: AgingTotals;
    outstandingTag: string;
}

const GRID = 'grid grid-cols-[minmax(10rem,1.4fr)_repeat(5,minmax(0,1fr))] gap-2 px-4';

const toneClass = (tone: AgingColumn['tone']): string => {
    switch (tone) {
        case 'success':
            return 'text-success';
        case 'warning':
            return 'text-warning';
        case 'orange':
            return 'text-orange-600';
        default:
            return 'text-danger';
    }
};

const ApAgingAnalysisCard = ({ rows, totals, outstandingTag }: ApAgingAnalysisCardProps) => {
    const grandTotal = totals.d0_30 + totals.d31_60 + totals.d61_90 + totals.d90;

    return (
        <Flex vertical gap={16} className="w-full">
            <Flex align="center" justify="space-between" gap={12} className="w-full flex-wrap">
                <Title level={4} className="!mb-0 !text-lg !font-semibold !text-ink md:!text-xl">
                    {agingTitle}
                </Title>
                <Tag className="m-0 rounded-full border border-warning-border bg-warning-surface px-3 py-1 text-xs font-medium text-warning">
                    {outstandingTag}
                </Tag>
            </Flex>

            <div className="w-full overflow-x-auto rounded-[22px] border border-borderStrong bg-white [scrollbar-width:thin]">
                <div className="min-w-[56rem]">
                    <div className={`${GRID} rounded-t-[22px] bg-surfaceGray py-3.5`}>
                        <Text className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            {agingVendorHeader}
                        </Text>
                        {agingColumns.map((col: AgingColumn) => (
                            <Text
                                key={col.key}
                                className="text-xs font-medium uppercase tracking-wide text-slate-400"
                            >
                                {col.label}
                            </Text>
                        ))}
                        <Text className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            {agingTotalHeader}
                        </Text>
                    </div>

                    {rows.map((row: AgingRow) => (
                        <div
                            key={row.vendor}
                            className={`${GRID} border-t border-slate-100 py-3.5`}
                        >
                            <Text className="text-sm font-medium text-ink">{row.vendor}</Text>
                            {agingColumns.map((col: AgingColumn) => {
                                const value = row[col.key];
                                return value > 0 ? (
                                    <Text
                                        key={col.key}
                                        className={`text-sm ${toneClass(col.tone)}`}
                                    >
                                        {formatRupee(value)}
                                    </Text>
                                ) : (
                                    <Text key={col.key} className="text-sm text-slate-400">
                                        -
                                    </Text>
                                );
                            })}
                            <Text className="text-sm font-medium text-ink">
                                {formatRupee(agingRowTotal(row))}
                            </Text>
                        </div>
                    ))}

                    <div className={`${GRID} border-t border-slate-200 py-3.5 font-semibold`}>
                        <Text className="text-sm font-semibold text-ink">
                            {agingTotalsRowLabel}
                        </Text>
                        {agingColumns.map((col: AgingColumn) => {
                            const value = totals[col.key];
                            return value > 0 ? (
                                <Text
                                    key={col.key}
                                    className={`text-sm font-semibold ${toneClass(col.tone)}`}
                                >
                                    {formatRupee(value)}
                                </Text>
                            ) : (
                                <Text
                                    key={col.key}
                                    className="text-sm font-semibold text-slate-400"
                                >
                                    -
                                </Text>
                            );
                        })}
                        <Text className="text-sm font-semibold text-ink">
                            {formatRupee(grandTotal)}
                        </Text>
                    </div>
                </div>
            </div>
        </Flex>
    );
};

export default ApAgingAnalysisCard;
