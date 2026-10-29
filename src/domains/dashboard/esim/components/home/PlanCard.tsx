import { CheckCircleFilled } from '@ant-design/icons';
import { Card, Typography, Tag, Space, Flex, Divider, Button } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

const { Title, Text } = Typography;
interface PlanCardProps {
    plan: any;
    selected: boolean;
    onSelect: (plan: any) => void;
}
export const PlanCard = ({ plan, selected, onSelect }: PlanCardProps) => {
    const pricePerGB =
        Number(plan.dataGB) === 0
            ? null
            : formatNumberWithLocalString(plan.price / plan.dataGB);
    const networks = parseNetworks(plan.networks);
    const networkSpeeds = Array.from(
        new Set(networks?.flatMap((net: any) => net.supportedRats || []))
    );
    const currency = plan.currency || '₹';
    const formatData = (dataGB: number | string) => {
        const gb = Number(dataGB);
        if (gb === 0) return 'Unlimited';
        const dataMB = gb * 1024;
        if (dataMB <= 100) return `${Math.round(dataMB)} MB`;
        return `${gb} GB`;
    };
    return (
        <Card
            className={`relative rounded-[18px] transition esim-plan-card ${
                selected ? 'esim-plan-card-selected' : ''
            }`}
        >
            {plan.isPopular && (
                <Tag
                    className="absolute -top-3 left-6 rounded-full px-3 py-[2px] text-[11px] font-medium"
                    style={{ backgroundColor: '#FF4F4F', color: '#FFFFFF', border: 'none' }}
                >
                    Most Popular
                </Tag>
            )}

            <Flex justify="space-between" align="start">
                <Space direction="vertical" size={0}>
                    <Title level={3} className="!mb-0 !text-[18px] !font-semibold">
                        {formatData(plan.dataGB)}{' '}
                    </Title>
                    <Text type="secondary" className="text-[13px]">
                        Total Data
                    </Text>
                </Space>

                {selected && <CheckCircleFilled style={{ color: '#FF4F4F', fontSize: 20 }} />}
            </Flex>

            <Space direction="vertical" size="middle" className="mt-4 w-full">
                <Flex justify="space-between">
                    <Text>Validity</Text>
                    <Text strong>{plan.validityDays} Days</Text>
                </Flex>

                {/* <Flex justify="space-between" align="center">
                    <Text>Network Provider</Text>

                    <Flex gap={6} wrap="wrap" justify="end">
                        {networks.map((net: any) => (
                            <Tag
                                key={net.name}
                                style={{
                                    backgroundColor: '#FF4F4F',
                                    color: '#FFFFFF',
                                    border: 'none',
                                }}
                            >
                                {net.name}
                            </Tag>
                        ))}
                    </Flex>
                </Flex> */}
                {plan.networks != null && (
                    <Flex justify="space-between" align="center">
                        <Text>Network Speed</Text>

                        <Flex gap={6} wrap="wrap" justify="end">
                            {networkSpeeds.length > 0 ? (
                                networkSpeeds.map((speed: any) => (
                                    <Tag
                                        key={speed}
                                        className="rounded-md px-2 py-[1px] text-[11px] font-medium"
                                        style={{
                                            backgroundColor: '#FF4F4F',
                                            color: '#FFFFFF',
                                            border: 'none',
                                        }}
                                    >
                                        {speed || 'N/A'}
                                    </Tag>
                                ))
                            ) : (
                                <Text type="secondary">N/A</Text>
                            )}
                        </Flex>
                    </Flex>
                )}
            </Space>
            <Divider />
            <Flex justify="space-between" align="end" className="mt-2 w-full">
                {pricePerGB !== null ? (
                    <Flex vertical gap={2}>
                        <Text type="secondary" className="text-[12px] leading-[1.1]">
                            Price/GB
                        </Text>
                        <Text className="text-[14px] font-medium leading-[1.1] text-[#222222]">
                            {currency} {pricePerGB}
                        </Text>
                    </Flex>
                ) : (
                    <div />
                )}

                <Flex vertical gap={0} align="end" className="text-right">
                    <Title level={3} className="!mb-0 !leading-none" style={{ color: '#FF4F4F' }}>
                        {currency} {formatNumberWithLocalString(parseFloat(plan.price))}
                    </Title>
                    <Text type="secondary" className="text-[12px] leading-[1.1]">
                        Total Price
                    </Text>
                </Flex>
            </Flex>

            <Button
                block
                className="mt-4"
                type={selected ? 'primary' : 'default'}
                icon={selected ? <CheckCircleFilled /> : null}
                style={
                    selected
                        ? { backgroundColor: '#FF4F4F', borderColor: '#FF4F4F' }
                        : { borderColor: '#FF4F4F', color: '#FF4F4F' }
                }
                onClick={() => onSelect(plan)}
            >
                {selected ? 'Selected' : 'Select Plan'}
            </Button>
        </Card>
    );
};

const parseNetworks = (networks?: string | any[]): any[] => {
    if (Array.isArray(networks)) return networks;
    if (typeof networks === 'string') {
        try {
            const parsed = JSON.parse(networks);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
};
