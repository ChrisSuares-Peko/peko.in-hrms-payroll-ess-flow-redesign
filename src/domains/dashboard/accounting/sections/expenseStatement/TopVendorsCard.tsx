import { Flex, Typography } from 'antd';

import { topVendorsTitle, VendorSpend } from '../../utils/expenseStatementData';
import ReportCardState from '../profitLoss/ReportCardState';
import SectionCard from '../profitLoss/SectionCard';

const { Text } = Typography;

interface TopVendorsCardProps {
    vendors: VendorSpend[];
    title?: string;
    loading?: boolean;
}

const TopVendorsCard = ({ vendors, title = topVendorsTitle, loading }: TopVendorsCardProps) => {
    if (loading || vendors.length === 0) {
        return (
            <SectionCard title={title}>
                <ReportCardState loading={loading} />
            </SectionCard>
        );
    }

    return (
        <SectionCard title={title}>
            <Flex vertical gap={16} className="w-full">
                {vendors.map((vendor: VendorSpend) => (
                    <Flex key={vendor.vendor} vertical gap={8} className="w-full">
                        <Flex justify="space-between" gap={8} className="w-full">
                            <Text className="min-w-0 truncate text-sm text-bodyText">
                                {vendor.vendor}
                            </Text>
                            <Text className="shrink-0 text-sm font-medium text-ink">
                                {vendor.display}
                            </Text>
                        </Flex>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full"
                                style={{ width: `${vendor.pct}%`, backgroundColor: vendor.color }}
                            />
                        </div>
                    </Flex>
                ))}
            </Flex>
        </SectionCard>
    );
};

export default TopVendorsCard;
