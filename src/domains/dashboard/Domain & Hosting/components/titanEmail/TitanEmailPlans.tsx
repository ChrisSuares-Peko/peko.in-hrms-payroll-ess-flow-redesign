import type { RefObject } from 'react';

import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Flex, Skeleton, Typography } from 'antd';

import type { HostingPlan } from '../../hooks/useHostingPlans';

const { Text, Title } = Typography;

const ROW_H = 'h-[40px]';
const SECTION_H = 'h-[50px]';

type ComparisonRow =
    | { type: 'section'; label: string; sectionKey: string }
    | { type: 'feature'; label: string; sectionKey: string };

interface VendorFeatureItem {
    description: string;
    value: boolean | string | number;
}

interface VendorFeatureSection {
    description: string;
    features?: VendorFeatureItem[];
}

const buildComparisonRows = (plan: HostingPlan): ComparisonRow[] => {
    const sections = plan.vendorDetails?.features as Record<string, VendorFeatureSection> | undefined;
    if (!sections) return [];
    return Object.entries(sections).flatMap(([sectionKey, section]) => [
        { type: 'section' as const, label: section.description, sectionKey },
        ...(section.features ?? []).map(f => ({
            type: 'feature' as const,
            label: f.description,
            sectionKey,
        })),
    ]);
};

const getFeatureValue = (plan: HostingPlan, sectionKey: string, featureLabel: string) => {
    const sections = plan.vendorDetails?.features as Record<string, VendorFeatureSection> | undefined;
    const feature = sections?.[sectionKey]?.features?.find(f => f.description === featureLabel);
    return feature?.value ?? null;
};

const renderValue = (value: boolean | string | number | null) => {
    if (value === true)
        return (
            <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#52C41A]">
                <CheckOutlined className="text-[10px] text-white" />
            </span>
        );
    if (value === false)
        return (
            <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#F5222D]">
                <CloseOutlined className="text-[10px] text-white" />
            </span>
        );
    if (value !== null && value !== undefined)
        return <Text className="text-[13px] font-semibold text-[#6f6c8f]">{value}</Text>;
    return null;
};

interface Props {
    plansRef: RefObject<HTMLDivElement>;
    plans: HostingPlan[];
    isLoading: boolean;
    onAddToCart: (productId: string, planId: string, planName: string) => Promise<void>;
}

const TitanEmailPlans = ({ plansRef, plans, isLoading, onAddToCart }: Props) => {
    const comparisonRows = plans.length ? buildComparisonRows(plans[0]) : [];

    return (
        <div ref={plansRef}>
            {isLoading ? (
                <Flex gap={24}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex-1">
                            <Skeleton active />
                        </div>
                    ))}
                </Flex>
            ) : (
                <div className="-mr-4 overflow-x-auto pb-2 lg:-mr-6">
                    <Flex gap={18} className="pr-4 lg:pr-6" style={{ minWidth: 'max-content' }}>
                        {/* Left label column — frozen while plans scroll horizontally */}
                        <Flex
                            vertical
                            className="sticky left-0 z-20 w-[200px] flex-shrink-0 bg-white pr-2 shadow-[8px_0_12px_-6px_rgba(25,33,61,0.08)] lg:w-[360px]"
                        >
                            <Flex align="flex-start" className="pt-4" style={{ height: '370px' }}>
                                <Text className="text-[18px] font-semibold text-gray-700 lg:text-[22px]">Plans</Text>
                            </Flex>
                            {comparisonRows.map((row, i) =>
                                row.type === 'section' ? (
                                    <Flex
                                        key={i}
                                        align="center"
                                        className={`${SECTION_H} text-[13px] font-medium text-[#545270] lg:text-[14px]`}
                                    >
                                        {row.label}
                                    </Flex>
                                ) : (
                                    <Flex
                                        key={i}
                                        align="center"
                                        className={`${ROW_H} pr-4 text-[12px] font-medium leading-5 text-[#6F6C8F] lg:text-[13px]`}
                                    >
                                        {row.label}
                                    </Flex>
                                )
                            )}
                        </Flex>

                        {/* Plan columns */}
                        {plans.map(plan => (
                            <Flex
                                key={plan.id}
                                vertical
                                className="w-[180px] flex-shrink-0 overflow-hidden rounded-[28px] shadow-[0px_2px_13px_0px_rgba(25,33,61,0.1)] lg:w-[290px]"
                            >
                                <Flex
                                    vertical
                                    gap={22}
                                    className="rounded-tl-[28px] rounded-tr-[28px] bg-white px-[30px] pb-[30px] pt-[40px]"
                                >
                                    <Title level={4} className="!mb-0 !mt-0 !text-[22px] !font-semibold !text-[#212121] lg:!text-[32px]">
                                        {plan.planName}
                                    </Title>
                                    <Text className="block text-[12px] text-[#6f6c8f] lg:text-[15px]">
                                        {plan.vendorDetails?.description ?? ''}
                                    </Text>
                                </Flex>

                                <Flex
                                    vertical
                                    gap={10}
                                    className="border border-[#F1F2F9] bg-white px-5 py-6 lg:px-7"
                                >
                                    <Flex align="baseline" gap={4}>
                                        <Text className="text-[28px] font-semibold text-black lg:text-[46px]">
                                            {plan.price != null ? `₹${plan.price}` : '-'}
                                        </Text>
                                        <Text className="text-[12px] text-[#212121] lg:text-[16px]">/acc/mo</Text>
                                    </Flex>
                                    {plan.pricingDetails?.renew?.['1'] != null && (
                                        <Text className="text-[12px] text-[#909090] lg:text-[16px]">
                                            <span className="font-medium text-[#575757]">Renews at {plan.pricingDetails.renew['1']}</span>
                                            /acc/mo
                                        </Text>
                                    )}
                                    <Button
                                        block
                                        className="h-[44px] rounded-[10px] text-[13px] font-semibold bg-lightRed border-lightRed text-white"
                                        onClick={() => onAddToCart(plan.productId, plan.planId, plan.planName)}
                                    >
                                        Buy now
                                    </Button>
                                </Flex>

                                <Flex
                                    vertical
                                    className="rounded-bl-[28px] rounded-br-[28px] border border-[#F1F2F9] bg-white px-5 pb-8 pt-0 lg:px-7"
                                >
                                    {comparisonRows.map((row, i) =>
                                        row.type === 'section' ? (
                                            <div key={i} className={SECTION_H} />
                                        ) : (
                                            <Flex key={i} align="center" justify="center" className={ROW_H}>
                                                {renderValue(getFeatureValue(plan, row.sectionKey, row.label))}
                                            </Flex>
                                        )
                                    )}
                                </Flex>
                            </Flex>
                        ))}
                    </Flex>
                </div>
            )}
        </div>
    );
};

export default TitanEmailPlans;
