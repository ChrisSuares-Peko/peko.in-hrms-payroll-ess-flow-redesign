import { Flex, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { GstStat } from '../../utils/gstSummaryData';

const { Text } = Typography;

// Card background per summary stat (taxable turnover, output GST, ITC, net payable).
const CARD_COLORS = ['#FDF6F0', '#ECF0FC', '#F6EBEF', '#EBF6F1', '#F3F1FF'];

interface GstSummaryCardsProps {
    stats: GstStat[];
}

const GstSummaryCards = ({ stats }: GstSummaryCardsProps) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat: GstStat, index) => (
            <Flex
                key={stat.key}
                vertical
                gap={8}
                className="min-w-0 rounded-[22px] px-5 py-5 md:px-6 md:py-6"
                style={{ backgroundColor: CARD_COLORS[index % CARD_COLORS.length] }}
            >
                <Text className="break-words text-sm font-medium uppercase tracking-wide text-slate-400">
                    {stat.label}
                </Text>
                <Text
                    className={`break-words text-xl font-semibold ${
                        stat.highlight ? 'text-warning' : 'text-ink'
                    }`}
                >
                    ₹{formatNumberWithLocalString(stat.value)}
                </Text>
            </Flex>
        ))}
    </div>
);

export default GstSummaryCards;
