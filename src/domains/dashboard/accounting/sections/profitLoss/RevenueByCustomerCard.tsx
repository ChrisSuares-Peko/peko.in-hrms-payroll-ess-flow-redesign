import { Flex, Progress, Typography } from 'antd';

import SectionCard from './SectionCard';
import { CustomerRevenue, revenueByCustomer } from '../../utils/profitLossData';

const { Text } = Typography;

interface RevenueByCustomerCardProps {
    customers: CustomerRevenue[];
}

const RevenueByCustomerCard = ({ customers }: RevenueByCustomerCardProps) => (
    <SectionCard title={revenueByCustomer.title}>
        <Flex vertical gap={14}>
            {customers.map((c: CustomerRevenue) => (
                <Flex key={c.name} vertical gap={6}>
                    <Flex align="center" justify="space-between" gap={12}>
                        <Text className="truncate text-sm text-bodyText">{c.name}</Text>
                        <Flex align="baseline" gap={8} className="shrink-0">
                            <Text className="text-xs text-slate-400">{c.pct}%</Text>
                            <Text className="text-sm font-medium text-ink">{c.display}</Text>
                        </Flex>
                    </Flex>
                    <Progress
                        percent={c.pct}
                        showInfo={false}
                        strokeColor="#FF4F4F"
                        trailColor="#F1F5F9"
                        size={['100%', 6]}
                    />
                </Flex>
            ))}
        </Flex>
    </SectionCard>
);

export default RevenueByCustomerCard;
