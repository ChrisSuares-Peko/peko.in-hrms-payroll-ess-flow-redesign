import {
    BankFilled,
    ClockCircleFilled,
    ContactsFilled,
    CreditCardFilled,
    DollarCircleFilled,
    MoneyCollectFilled,
} from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import { Typography } from 'antd';

import { StatItem, StatTone } from '../../utils/types';

const { Text } = Typography;

const ICONS: Record<StatItem['icon'], React.ComponentType<AntdIconProps>> = {
    card: CreditCardFilled,
    spend: DollarCircleFilled,
    reimbursement: MoneyCollectFilled,
    clock: ClockCircleFilled,
    members: ContactsFilled,
    bank: BankFilled,
};

/** Semantic tone → background hex. */
const TONE_BG: Record<StatTone, string> = {
    lilac: '#F6EBF4',
    mint: '#EBF6F1',
    rose: '#F6ECEB',
    lavender: '#ECF0FC',
    cream: '#FCF4EC',
};

/** A single KPI tile: pastel surface, dark icon chip with white glyph, label, value, caption. */
const StatCard = ({ stat }: { stat: StatItem }) => {
    const Icon = ICONS[stat.icon];
    return (
        <div
            className="flex flex-col gap-2.5 rounded-2xl px-5 py-4 xl:py-5"
            style={{ backgroundColor: TONE_BG[stat.tone] }}
        >
            <span className="flex size-9 items-center justify-center rounded-full bg-white text-base text-textHeadings">
                {stat.svgIcon ? (
                    <img src={stat.svgIcon} alt="" className="h-5 w-5 object-contain" />
                ) : (
                    <Icon />
                )}
            </span>
            <div className="flex flex-col gap-1">
                <Text className="text-sm leading-snug text-textBody">{stat.label}</Text>
                <Text className="text-xl font-semibold leading-tight text-textHeadings xl:text-2xl">
                    {stat.value}
                </Text>
                <Text className="text-xs text-textGreyLight">{stat.caption}</Text>
            </div>
        </div>
    );
};

export default StatCard;
