import { Flex, Progress, Typography } from 'antd';

import { CustomerRevenue, RevenueCategory } from '../../utils/revenueStatementData';
import ReportCardState from '../profitLoss/ReportCardState';
import SectionCard from '../profitLoss/SectionCard';

const { Text } = Typography;

interface TopCustomersData {
    title: string;
    customers: CustomerRevenue[];
    legend: RevenueCategory[];
}

interface TopCustomersCardProps {
    data: TopCustomersData;
    loading?: boolean;
}

const TopCustomersCard = ({ data, loading }: TopCustomersCardProps) => {
    if (loading || data.customers.length === 0) {
        return (
            <SectionCard title={data.title}>
                <ReportCardState loading={loading} />
            </SectionCard>
        );
    }

    return (
        <SectionCard title={data.title}>
            <Flex vertical gap={16} className="w-full">
                {data.customers.map((customer: CustomerRevenue) => (
                    <Flex key={customer.key} vertical gap={6}>
                        <Flex align="center" justify="space-between" gap={12}>
                            <Text className="truncate text-sm text-bodyText">{customer.name}</Text>
                            <Text className="shrink-0 text-sm font-medium text-ink">
                                {customer.display}
                            </Text>
                        </Flex>
                        <Progress
                            percent={customer.percent}
                            showInfo={false}
                            strokeColor={customer.color}
                            trailColor="#F1F5F9"
                            size={['100%', 6]}
                            className="!mb-0"
                        />
                    </Flex>
                ))}
            </Flex>

            {data.legend.length > 0 && (
                <Flex wrap="wrap" className="w-full gap-x-4 gap-y-2 border-t border-slate-100 pt-4">
                    {data.legend.map((category: RevenueCategory) => (
                        <Flex key={category.key} align="center" gap={6} className="min-w-0">
                            <span
                                className="size-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: category.color }}
                            />
                            <Text className="truncate text-xs text-muted">{category.label}</Text>
                        </Flex>
                    ))}
                </Flex>
            )}
        </SectionCard>
    );
};

export default TopCustomersCard;
