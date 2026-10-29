import { useState } from 'react';

import { CheckCircleFilled } from '@ant-design/icons';
import { Button, Card, Divider, Flex, Select, Tag, Typography } from 'antd';

import { PlanFeature } from '../hooks/useHostingPlans';

const { Text } = Typography;

const tenureLabel = (months: number): string => {
    if (months < 12) return `${months} Month${months > 1 ? 's' : ''}`;
    if (months === 12) return '1 Year';
    return `${months / 12} Years`;
};

interface SharedHostingPlanCardProps {
    name: string;
    description?: string;
    features: PlanFeature[];
    pricingAdd: Record<string, number>;
    pricingRenew?: Record<string, number>;
    isPopular?: boolean;
    discount?: number;
    onPurchase: (billingCycle: number) => void;
}

const SharedHostingPlanCard = ({
    name,
    description,
    features,
    pricingAdd,
    pricingRenew,
    isPopular = false,
    discount,
    onPurchase,
}: SharedHostingPlanCardProps) => {
    const tenureKeys = Object.keys(pricingAdd)
        .map(Number)
        .sort((a, b) => b - a);
    const [selectedTenure, setSelectedTenure] = useState<number>(tenureKeys[0] ?? 12);
    const hasMultipleTenures = tenureKeys.length > 1;

    const currentPrice = pricingAdd[String(selectedTenure)];
    const pricePerMonth = currentPrice != null ? currentPrice.toFixed(2) : '0.00';

    // Get renewal price for selected tenure
    const renewalPrice = pricingRenew ? pricingRenew[String(selectedTenure)] : null;
    const renewalPerMonth = renewalPrice != null ? renewalPrice.toFixed(2) : null;

    const tenureOptions = tenureKeys.map(months => ({
        value: months,
        label: `${tenureLabel(months)} @ ₹${pricingAdd[String(months)].toFixed(2)}`,
    }));

    return (
        <div className="relative h-full pt-8">
            {isPopular && (
                <div className="absolute top-1 left-0 right-0 flex justify-center z-10">
                    <Tag
                        className="uppercase m-0 border-0 bg-savingsTagLightBg text-savingsTagLightText"
                        style={{
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: 600,
                            fontSize: '12px',
                            lineHeight: '22.27px',
                            letterSpacing: '0.9px',
                            padding: '4px 16px',
                            borderRadius: '20px 20px 0 0',
                        }}
                    >
                        Most Popular
                    </Tag>
                </div>
            )}
            <Card
                className="rounded-3xl h-full transition-all border border-[#E8ECF3] shadow-[0px_2px_13px_0px_rgba(25,33,61,0.10)]"
                styles={{ body: { padding: '24px 24px 20px 24px' } }}
            >
                {/* Now with SSD Badge + Plan Name + Description — min-h keeps divider aligned across cards with/without description */}
                <div className="min-h-[90px]">
                    <Text className="text-xs font-semibold text-brandPrimary block mb-2">
                        Now with SSD
                    </Text>
                    <Text className="block text-left font-bold text-2xl text-gray-900 mb-2">
                        {name}
                    </Text>
                    {description && (
                        <Text className="block text-left text-gray-500 text-sm mt-2">
                            {description}
                        </Text>
                    )}
                </div>

                <Divider className="my-4" />

                {/* Tenure Section */}
                <div className="mb-5">
                    <Text className="text-brandPrimary text-sm font-semibold block mb-2 mt-4">
                        {tenureLabel(selectedTenure)} @
                    </Text>
                    <div className="border border-gray-300 rounded px-3 py-2 bg-white">
                        <Select
                            value={selectedTenure}
                            options={tenureOptions}
                            onChange={val => setSelectedTenure(val)}
                            variant="borderless"
                            style={{ width: '100%', cursor: hasMultipleTenures ? 'pointer' : 'default' }}
                            className="text-sm"
                            suffixIcon={hasMultipleTenures ? undefined : null}
                            open={hasMultipleTenures ? undefined : false}
                        />
                    </div>
                </div>

                {/* Price and Discount Row */}
                <div className="flex items-center justify-between mb-6">
                    <Flex align="baseline" gap={1}>
                        <Text className="text-4xl font-bold text-gray-900">₹{pricePerMonth}</Text>
                        <Text className="text-gray-600 text-sm">/mo</Text>
                    </Flex>
                    {discount != null && discount > 0 && (
                        <div
                            className="bg-savingsTagGreen text-white font-bold whitespace-nowrap -mr-6"
                            style={{
                                fontSize: '14px',
                                padding: '8px 20px 8px 26px',
                                clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 16px 50%)',
                            }}
                        >
                            Save {discount}%
                        </div>
                    )}
                </div>

                {/* Renewal Price */}
                <Text
                    className="text-gray-500 text-sm block mb-6"
                    style={{ visibility: renewalPerMonth ? 'visible' : 'hidden' }}
                >
                    Renews @ ₹{renewalPerMonth ?? '0.00'}/mo
                </Text>

                {/* Buy Now Button */}
                <Button
                    block
                    className="font-semibold rounded-lg h-10 mt-6 bg-lightRed border-lightRed text-white"
                    onClick={() => onPurchase(selectedTenure)}
                >
                    Buy now
                </Button>

                <Divider className="my-4" />

                {/* Features Label and List */}
                <Text className="text-gray-900 font-semibold text-sm block mb-4">Features:</Text>
                <div className="flex flex-col gap-2.5 my-4">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                            <CheckCircleFilled className="text-green-500 text-sm flex-shrink-0 mt-0.5" />
                            <Text className="text-gray-700 text-sm">{feature.value}</Text>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default SharedHostingPlanCard;
