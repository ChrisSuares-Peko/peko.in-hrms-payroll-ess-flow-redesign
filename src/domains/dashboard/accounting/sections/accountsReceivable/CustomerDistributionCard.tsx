import { Flex, Typography } from 'antd';

import {
    distributionLegend,
    distributionTitle,
    DistributionBar,
    DistributionLegendItem,
    DistributionTone,
} from '../../utils/accountsReceivableData';
import SectionCard from '../profitLoss/SectionCard';

const { Text } = Typography;

const fillClass = (tone: DistributionTone): string => {
    switch (tone) {
        case 'danger':
            return 'bg-danger';
        case 'warning':
            return 'bg-warning';
        default:
            return 'bg-bodyText';
    }
};

interface CustomerDistributionCardProps {
    bars: DistributionBar[];
}

const CustomerDistributionCard = ({ bars }: CustomerDistributionCardProps) => (
    <SectionCard title={distributionTitle}>
        <Flex vertical gap={20} className="w-full">
            {bars.map((bar: DistributionBar) => (
                <Flex key={bar.customer} vertical gap={8} className="w-full">
                    <Flex justify="space-between" gap={8} className="w-full">
                        <Text className="min-w-0 truncate text-sm text-bodyText">
                            {bar.customer}
                        </Text>
                        <Text className="shrink-0 text-sm font-medium text-ink">{bar.display}</Text>
                    </Flex>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                            className={`h-full rounded-full ${fillClass(bar.tone)}`}
                            style={{ width: `${bar.pct}%` }}
                        />
                    </div>
                </Flex>
            ))}
        </Flex>

        <Flex gap={16} className="w-full flex-wrap items-center">
            {distributionLegend.map((item: DistributionLegendItem) => (
                <Flex key={item.label} align="center" gap={6}>
                    <span className={`size-2 rounded-full ${fillClass(item.tone)}`} />
                    <Text className="text-xs text-bodyText">{item.label}</Text>
                </Flex>
            ))}
        </Flex>
    </SectionCard>
);

export default CustomerDistributionCard;
