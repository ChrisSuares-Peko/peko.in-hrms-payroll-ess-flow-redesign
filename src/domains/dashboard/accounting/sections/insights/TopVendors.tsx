import { Avatar, Flex, Typography } from 'antd';

import InsightSection from './InsightSection';
import { Vendor } from '../../utils/insightsData';

const { Text } = Typography;

interface TopVendorsProps {
    data: { title: string; items: Vendor[] };
}

const TopVendors = ({ data }: TopVendorsProps) => (
    <InsightSection title={data.title}>
        <Flex vertical gap={14}>
            {data.items.map(vendor => (
                <Flex key={vendor.id} align="center" gap={12}>
                    <Avatar size={28} className="shrink-0 !bg-surfaceGray !text-bodyText">
                        {vendor.name.charAt(0)}
                    </Avatar>
                    <Text className="min-w-0 truncate text-sm text-bodyText">{vendor.name}</Text>
                    <span className="h-1.5 min-w-4 flex-1 rounded-full bg-borderStrong" />
                    <Text className="shrink-0 text-sm font-semibold text-ink">{vendor.value}</Text>
                </Flex>
            ))}
        </Flex>
    </InsightSection>
);

export default TopVendors;
