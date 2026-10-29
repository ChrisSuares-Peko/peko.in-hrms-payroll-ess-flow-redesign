import { Flex, Typography } from 'antd';

import { RankRow, SERIES_COLOR } from '../../utils/dashboardCharts';

type RankRowsProps = {
    rows: RankRow[];
    emptyText: string;
    color?: string;
};

const RankRows = ({ rows, emptyText, color = SERIES_COLOR }: RankRowsProps) => {
    if (!rows.length) {
        return <Typography.Text className="text-sm text-textBody">{emptyText}</Typography.Text>;
    }

    const max = Math.max(...rows.map(row => row.value));

    return (
        <Flex vertical gap={14}>
            {rows.map(row => (
                <Flex key={row.key} align="center" gap={12}>
                    <span
                        className="w-28 shrink-0 truncate text-sm text-textHeadings"
                        title={row.label}
                    >
                        {row.label}
                    </span>
                    <div className="flex-1 min-w-0">
                        <div
                            role="meter"
                            aria-label={row.label}
                            aria-valuemin={0}
                            aria-valuemax={max}
                            aria-valuenow={row.value}
                            className="h-2.5 rounded-r-full"
                            style={{ width: `${row.pct}%`, backgroundColor: color }}
                        />
                    </div>
                    <Flex vertical align="end" className="shrink-0">
                        <span className="text-sm font-medium text-textHeadings whitespace-nowrap">
                            {row.display}
                        </span>
                        {row.sub && (
                            <span className="text-[11px] text-textBody whitespace-nowrap">
                                {row.sub}
                            </span>
                        )}
                    </Flex>
                </Flex>
            ))}
        </Flex>
    );
};

export default RankRows;
