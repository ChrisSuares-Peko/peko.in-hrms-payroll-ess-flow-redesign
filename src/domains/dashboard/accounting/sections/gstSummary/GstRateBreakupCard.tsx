import { Flex, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import {
    gstRateBreakupTitle,
    gstRateColumns,
    gstRateTableLabels,
    GstColumn,
    GstRateRow,
    GstTotals,
} from '../../utils/gstSummaryData';

const { Title, Text } = Typography;

const money = (n: number): string => `₹${formatNumberWithLocalString(n)}`;

const GRID = 'grid grid-cols-[5rem_repeat(7,minmax(0,1fr))] gap-2 px-4';

interface GstRateBreakupCardProps {
    rows: GstRateRow[];
    totals: GstTotals;
}

const GstRateBreakupCard = ({ rows, totals }: GstRateBreakupCardProps) => (
    <Flex vertical gap={16} className="w-full">
        <Title level={4} className="!mb-0 !text-lg !font-semibold !text-slate-900 md:!text-xl">
            {gstRateBreakupTitle}
        </Title>

        <div className="w-full overflow-x-auto rounded-[22px] border border-borderStrong bg-white [scrollbar-width:thin]">
            <div className="min-w-[60rem]">
                <div className={`${GRID} rounded-t-[22px] bg-surfaceGray py-3.5`}>
                    <Text className="text-sm font-medium uppercase tracking-wide text-slate-400">
                        {gstRateTableLabels.rateHeader}
                    </Text>
                    {gstRateColumns.map((col: GstColumn) => (
                        <Text
                            key={col.key}
                            className="text-sm font-medium uppercase tracking-wide text-slate-400"
                        >
                            {col.label}
                        </Text>
                    ))}
                </div>

                {rows.map((row: GstRateRow) => (
                    <div key={row.rate} className={`${GRID} border-t border-slate-100 py-3.5`}>
                        <Text className="text-sm font-medium text-slate-500">{row.rate}%</Text>
                        {gstRateColumns.map((col: GstColumn) => (
                            <Text
                                key={col.key}
                                className={`text-sm ${
                                    col.key === 'netPayable'
                                        ? 'font-medium text-warning'
                                        : 'text-bodyText'
                                }`}
                            >
                                {money(row[col.key])}
                            </Text>
                        ))}
                    </div>
                ))}

                <div className={`${GRID} border-t border-slate-200 py-3.5`}>
                    <Text className="text-sm font-semibold text-ink">
                        {gstRateTableLabels.totalRow}
                    </Text>
                    {gstRateColumns.map((col: GstColumn) => (
                        <Text
                            key={col.key}
                            className={`text-sm font-semibold ${
                                col.key === 'netPayable' ? 'text-warning' : 'text-ink'
                            }`}
                        >
                            {money(totals[col.key])}
                        </Text>
                    ))}
                </div>
            </div>
        </div>
    </Flex>
);

export default GstRateBreakupCard;
