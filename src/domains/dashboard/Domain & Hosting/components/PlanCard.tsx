import { CheckOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Select, Tag, Typography } from 'antd';

import { type PlanFeature } from '../hooks/useHostingPlans';

const { Title, Text } = Typography;

type DurationOption = {
    label: string;
    value: number;
};

const PlanCard = ({
    name,
    price,
    duration,
    priceNote,
    features = [],
    tagText,
    onPurchase,
    durationOptions,
    selectedDuration,
    onDurationChange,
}: {
    name: string;
    price: string;
    duration: string;
    priceNote?: string;
    features: PlanFeature[];
    tagText?: string;
    onPurchase: () => void;
    durationOptions?: DurationOption[];
    selectedDuration?: number;
    onDurationChange?: (value: number) => void;
}) => (
    <Card
        hoverable
        className="h-full rounded-3xl border border-[#E8ECF3] shadow-sm"
        styles={{ body: { padding: '28px', display: 'flex', flexDirection: 'column', height: '100%' } }}
    >
        {tagText && (
            <Tag color="green" className="mb-4 w-fit">
                {tagText}
            </Tag>
        )}

        <Title level={5} className="!mb-2">
            {name}
        </Title>

        <div className="mb-6">
            <Title level={4} className="!mb-1 leading-none">
                ₹ {price} <span className="text-base font-normal text-gray-500">/ {duration}</span>
            </Title>
            {priceNote ? <Text className="block text-sm text-gray-400">{priceNote}</Text> : null}
        </div>

        {durationOptions && durationOptions.length > 0 ? (
            <div className="mb-6 rounded-2xl border border-[#EEF1F6] bg-[#FAFBFD] p-4">
                <Text className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                    Billing Option
                </Text>
                <Select
                    value={selectedDuration}
                    options={durationOptions}
                    className="w-full"
                    size="large"
                    onChange={onDurationChange}
                />
            </div>
        ) : null}

        <Flex vertical gap={12} className="mb-8 border-t border-[#F0F2F6] pt-6">
            {features.map((feature, index) => (
                <Flex key={index} align="start" gap={10}>
                    <CheckOutlined className="mt-1 text-green-500" />
                    <Text className="text-sm leading-6 text-gray-600">
                        {feature.value ? `${feature.label}: ${feature.value}` : feature.label}
                    </Text>
                </Flex>
            ))}
        </Flex>

        <Button
            block
            size="large"
            className="mt-auto h-11 rounded-xl border-brandPrimary text-brandPrimary hover:bg-brandPrimary hover:text-white"
            onClick={onPurchase}
        >
            Purchase
        </Button>
    </Card>
);

export default PlanCard;
