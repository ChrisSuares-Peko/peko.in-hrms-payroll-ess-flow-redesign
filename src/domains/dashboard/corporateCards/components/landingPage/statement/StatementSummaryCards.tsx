import { Skeleton, Typography } from 'antd';

import moneySend from '../../../assets/icons/money-send.svg';
import moneyTick from '../../../assets/icons/money-tick.svg';
import moneyIn from '../../../assets/icons/moneyIn.svg';
import moneys from '../../../assets/icons/moneys.svg';
import { StatementSummary } from '../../../utils/types';

const { Text } = Typography;

const ICONS: Record<StatementSummary['icon'], string> = {
    wallet: moneys,
    in: moneyIn,
    out: moneySend,
    check: moneyTick,
};

const BG_COLORS: Record<StatementSummary['icon'], string> = {
    wallet: '#F6EBF4',
    in: '#F6ECEB',
    out: '#EBF6F1',
    check: '#ECF0FC',
};

interface StatementSummaryCardsProps {
    items: StatementSummary[];
    loading?: boolean;
}

/** The four KPI tiles atop the Account Statement: opening, money in, money out, closing balance. */
const StatementSummaryCards = ({ items, loading }: StatementSummaryCardsProps) => {
    if (loading && items.length === 0) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-bgLightGray px-5 py-4 xl:py-5">
                        <Skeleton active paragraph={{ rows: 2 }} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
            {items.map(item => (
                <div
                    key={item.key}
                    className="flex flex-col gap-2.5 rounded-2xl px-5 py-4 xl:py-5"
                    style={{ backgroundColor: BG_COLORS[item.icon] }}
                >
                    <span className="flex size-9 items-center justify-center rounded-full bg-white">
                        <img src={ICONS[item.icon]} alt="" className="h-5 w-5" />
                    </span>
                    <Text className="text-sm leading-snug text-textBody">{item.label}</Text>
                    <Text className="text-xl font-semibold leading-tight text-textHeadings xl:text-2xl">
                        {item.value}
                    </Text>
                    <Text className="text-xs text-textGreyLight">{item.caption}</Text>
                </div>
            ))}
        </div>
    );
};

export default StatementSummaryCards;
