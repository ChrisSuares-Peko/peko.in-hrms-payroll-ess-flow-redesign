import { Flex, Typography } from 'antd';

import { CfStat } from '../../utils/cashFlowData';

const { Text } = Typography;

// Card background per summary stat (operating, investing, financing, net, closing).
const CARD_COLORS = ['#FDF6F0', '#ECF0FC', '#F6EBEF', '#EBF6F1', '#F3F1FF'];

interface CashFlowSummaryCardsProps {
    stats: CfStat[];
}

const CashFlowSummaryCards = ({ stats }: CashFlowSummaryCardsProps) => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat: CfStat, index) => (
            <Flex
                key={stat.key}
                vertical
                gap={2}
                className="min-w-0 rounded-2xl px-5 py-4"
                style={{ backgroundColor: CARD_COLORS[index % CARD_COLORS.length] }}
            >
                <Text className="text-xs font-medium tracking-wide text-slate-400 break-words">
                    {stat.label}
                </Text>
                <Text className="text-lg font-semibold text-ink break-words">{stat.value}</Text>
                <Text
                    className={`whitespace-nowrap text-xs font-medium ${
                        stat.up ? 'text-success' : 'text-danger'
                    }`}
                >
                    {stat.up ? '▲' : '▼'} {stat.delta}
                </Text>
            </Flex>
        ))}
    </div>
);

export default CashFlowSummaryCards;
