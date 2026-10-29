import { Flex, Typography } from 'antd';

import {
    breakdownTitle,
    collectionSummaryTitle,
    formatRupee,
    BreakdownSegment,
    CollectionStat,
    StatTone,
} from '../../utils/accountsReceivableData';

const { Title, Text } = Typography;

const toneTextClass = (tone: StatTone): string => {
    switch (tone) {
        case 'success':
            return 'text-success';
        case 'warning':
            return 'text-warning';
        default:
            return 'text-danger';
    }
};

const toneBgClass = (tone: StatTone): string => {
    switch (tone) {
        case 'success':
            return 'bg-success';
        case 'warning':
            return 'bg-warning';
        default:
            return 'bg-danger';
    }
};

interface CollectionSummaryProps {
    data: { stats: CollectionStat[]; segments: BreakdownSegment[]; total: number };
}

const CollectionSummary = ({ data }: CollectionSummaryProps) => (
    <Flex vertical gap={20} className="w-full">
        <Title level={4} className="!mb-0 !text-lg !font-semibold !text-ink md:!text-xl">
            {collectionSummaryTitle}
        </Title>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.stats.map((stat: CollectionStat) => (
                <Flex
                    key={stat.key}
                    vertical
                    gap={8}
                    className="min-w-0 rounded-[22px] bg-surfaceGray px-5 py-5 shadow-[0px_1.68px_16.79px_1.55px_#0000000F]"
                >
                    <Text className="text-xs font-medium uppercase tracking-wide text-slate-400 md:text-sm">
                        {stat.label}
                    </Text>
                    <Text
                        className={`text-xl font-semibold md:text-2xl ${toneTextClass(stat.tone)}`}
                    >
                        {stat.value}
                    </Text>
                    <Text className="text-xs text-slate-400 md:text-sm">{stat.caption}</Text>
                </Flex>
            ))}
        </div>

        <Flex vertical gap={12} className="mt-2 w-full">
            <Text className="text-sm font-medium text-bodyText md:text-base">
                {`${breakdownTitle} — ${formatRupee(data.total)}`}
            </Text>

            <Flex className="h-2.5 w-full overflow-hidden rounded-full">
                {data.segments.map((seg: BreakdownSegment) => (
                    <div
                        key={seg.label}
                        style={{ width: `${seg.pct}%` }}
                        className={toneBgClass(seg.tone)}
                    />
                ))}
            </Flex>

            <Flex gap={16} className="flex-wrap items-center">
                {data.segments.map((seg: BreakdownSegment) => (
                    <Flex key={seg.label} align="center" gap={8}>
                        <span className={`size-2 rounded-full ${toneBgClass(seg.tone)}`} />
                        <Text className="text-xs text-bodyText">
                            {`${seg.label} ${formatRupee(seg.amount)} (${seg.pct}%)`}
                        </Text>
                    </Flex>
                ))}
            </Flex>
        </Flex>
    </Flex>
);

export default CollectionSummary;
