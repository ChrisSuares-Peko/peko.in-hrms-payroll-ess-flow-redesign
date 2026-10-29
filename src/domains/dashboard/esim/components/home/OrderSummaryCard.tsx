import { useState } from 'react';

import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Flex, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

const { Text, Title } = Typography;

interface OrderSummaryProps {
    countries?: string[];
    quantities?: Record<string, number>;
    selectedPlans?: Record<string, any>;
    onBuyNow?: () => void;
    disabled?: boolean;
    loading?: boolean;
}

const OrderSummaryCard = ({
    countries = [],
    quantities = {},
    selectedPlans = {},
    onBuyNow,
    disabled,
    loading,
}: OrderSummaryProps) => {
    const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

    const primaryCountry = countries[0];
    const primaryPlan = primaryCountry ? selectedPlans[primaryCountry] : null;
    const emptyValue = 'N/A';
    const isMulti = countries.length > 1;
    const destinationText = countries.length > 0 ? countries[0] : emptyValue;
    const dataText = primaryPlan?.dataGB === 0 ? 'Unlimited' : `${primaryPlan?.dataGB} GB`;
    const planText = primaryPlan ? dataText : emptyValue;
    const validityText = primaryPlan ? `${primaryPlan.validityDays} Days` : emptyValue;
    const totalQuantity = countries.reduce((sum, country) => sum + (quantities[country] ?? 1), 0);

    const hasNetworkData = countries.some(country => selectedPlans[country]?.networks != null);
    const networkSpeeds = Array.from(
        new Set(
            countries.flatMap(country => {
                const plan = selectedPlans[country];
                return parseNetworks(plan?.networks).flatMap(
                    (network: any) => network.supportedRats || []
                );
            })
        )
    );

    const grandTotal = countries.reduce((sum, country) => {
        const plan = selectedPlans[country];
        const qty = quantities[country] ?? 1;

        if (!plan?.price) return sum;
        return sum + plan.price * qty;
    }, 0);
    const currency = primaryPlan?.currency || '₹';

    return (
        <Card className="esim-order-summary-card rounded-[22px]">
            <div style={{ marginBottom: 20 }}>
                <Title level={4} className="!mb-0 !text-[18px] !font-semibold">
                    Order Summary
                </Title>
            </div>

            {isMulti ? (
                <Flex vertical gap={14}>
                    <SummaryRow
                        label="Destinations"
                        value={`${countries.length} countries`}
                    />
                    <Flex vertical gap={8}>
                        {countries.map(country => {
                            const plan = selectedPlans[country];
                            const qty = quantities[country] ?? 1;
                            const countryTotal = plan?.price ? plan.price * qty : null;
                            const countryCurrency = plan?.currency || currency;
                            const isExpanded = expandedCountry === country;
                            const planDataText = plan?.dataGB === 0 ? 'Unlimited Plan' : `${plan?.dataGB} GB`;
                            const planLabel = plan ? planDataText : emptyValue;
                            const countryValidity = plan ? `${plan.validityDays} Days` : emptyValue;
                            const countryNetworks = parseNetworks(plan?.networks);
                            const countryNetworkSpeeds = Array.from(
                                new Set(countryNetworks.flatMap((n: any) => n.supportedRats || []))
                            );

                            return (
                                <div
                                    key={country}
                                    style={{
                                        background: '#f8fafc',
                                        border: '0.4px solid #cbd5e1',
                                        borderRadius: 12,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Flex
                                        justify="space-between"
                                        align="center"
                                        onClick={() =>
                                            setExpandedCountry(isExpanded ? null : country)
                                        }
                                        style={{ height: 48, padding: '0 12px', cursor: 'pointer' }}
                                    >
                                        <Text className="text-[14px] text-[#171717]">
                                            {country}
                                        </Text>
                                        <Flex align="center" gap={6}>
                                            <Text className="text-[14px] text-[#171717]">
                                                {countryTotal !== null
                                                    ? `${countryCurrency} ${formatNumberWithLocalString(countryTotal)}`
                                                    : emptyValue}
                                            </Text>
                                            {isExpanded ? (
                                                <UpOutlined
                                                    style={{ fontSize: 11, color: '#9ca3af' }}
                                                />
                                            ) : (
                                                <DownOutlined
                                                    style={{ fontSize: 11, color: '#9ca3af' }}
                                                />
                                            )}
                                        </Flex>
                                    </Flex>

                                    {isExpanded && (
                                        <Flex
                                            vertical
                                            gap={10}
                                            style={{
                                                padding: '10px 12px 12px',
                                                borderTop: '0.4px solid #cbd5e1',
                                            }}
                                        >
                                            <SummaryRow label="Plan" value={planLabel} />
                                            <SummaryRow label="Validity" value={countryValidity} />
                                            {plan?.networks != null && (
                                                <SummaryRow
                                                    label="Network Speed"
                                                    value={
                                                        countryNetworkSpeeds.length > 0
                                                            ? countryNetworkSpeeds.join(', ')
                                                            : emptyValue
                                                    }
                                                />
                                            )}
                                            <SummaryRow label="Quantity" value={String(qty)} />
                                        </Flex>
                                    )}
                                </div>
                            );
                        })}
                    </Flex>
                </Flex>
            ) : (
                <Flex vertical gap={14}>
                    <SummaryRow label="Destination" value={destinationText} />
                    <SummaryRow label="Plan" value={planText} />
                    <SummaryRow label="Validity" value={validityText} />
                    {hasNetworkData && (
                        <SummaryRow
                            label="Network Speed"
                            value={networkSpeeds.length > 0 ? networkSpeeds.join(', ') : emptyValue}
                        />
                    )}
                    <SummaryRow
                        label="Quantity"
                        value={totalQuantity > 0 ? String(totalQuantity) : emptyValue}
                    />
                </Flex>
            )}

            <Divider className="!my-5" />

            <Flex justify="space-between" align="center" className="mb-5">
                <Text className="text-[16px] font-medium text-[#171717]">Total</Text>
                <Title level={3} className="!mb-0 !text-[18px] !font-medium text-[#171717]">
                    {countries.length > 0
                        ? `${currency} ${formatNumberWithLocalString(grandTotal)}`
                        : emptyValue}
                </Title>
            </Flex>

            <Button
                type="primary"
                danger
                block
                size="large"
                disabled={disabled}
                loading={loading}
                onClick={onBuyNow}
                className="esim-buy-btn"
            >
                Buy Now
            </Button>
        </Card>
    );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
    <Flex justify="space-between" align="start" gap={12}>
        <Text type="secondary" className="text-[14px]">
            {label}
        </Text>
        <Text className="max-w-[180px] text-right text-[14px] text-[#171717]">{value}</Text>
    </Flex>
);

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

export default OrderSummaryCard;
