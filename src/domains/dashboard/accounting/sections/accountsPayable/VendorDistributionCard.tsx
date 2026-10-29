import { Flex, Typography } from 'antd';

import {
    distributionLegend,
    distributionTitle,
    DistributionBar,
    DistributionLegendItem,
    DistributionTone,
} from '../../utils/accountsPayableData';
import SectionCard from '../profitLoss/SectionCard';

const { Text } = Typography;

interface VendorDistributionCardProps {
    bars: DistributionBar[];
}

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

const VendorDistributionCard = ({ bars }: VendorDistributionCardProps) => (
    <SectionCard title={distributionTitle}>
        <Flex vertical gap={20} className="w-full">
            {bars.map((bar: DistributionBar) => (
                <Flex key={bar.vendor} vertical gap={8} className="w-full">
                    <Flex justify="space-between" gap={8} className="w-full">
                        <Text className="min-w-0 truncate text-sm text-bodyText">{bar.vendor}</Text>
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

export default VendorDistributionCard;
