import React from 'react';

import { AppstoreOutlined, MinusOutlined } from '@ant-design/icons';
import { Button, Flex, Skeleton, Tooltip, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import tickIcon from '../assets/icons/tick.svg';
import { PlanType, ServicePackage, WhatsAppPlan } from '../types';
import { calculateDiscount, getWhatsAppPlanDescription, PLAN_DETAILS_SESSION_KEY, PlanServiceDefinition, planServicesMap } from '../utils';

interface Props {
    plans: ServicePackage[];
    currentPlanDetails: {
        currentPackageId: number;
        currentPlanPriorityLevel: number;
    };
    selectedType: PlanType;
    onTypeChange: (type: PlanType) => void;
    isLoading?: boolean;
    whatsappPlans?: WhatsAppPlan[];
}

const PlanComparisonTable: React.FC<Props> = ({
    plans,
    currentPlanDetails,
    selectedType,
    onTypeChange,
    isLoading,
    whatsappPlans = [],
}) => {
    const navigate = useNavigate();

    const sortedPlans = [...plans].sort((a, b) => a.priorityLevel - b.priorityLevel);

    const getPlanActionType = (plan: ServicePackage): 'CURRENT' | 'UPGRADE' | 'DOWNGRADE' => {
        if (plan.id === currentPlanDetails.currentPackageId) return 'CURRENT';
        if (plan.priorityLevel > currentPlanDetails.currentPlanPriorityLevel) return 'UPGRADE';
        return 'DOWNGRADE';
    };

    const handleChoosePlan = (plan: ServicePackage) => {
        sessionStorage.setItem(
            PLAN_DETAILS_SESSION_KEY,
            JSON.stringify({
                planId: plan.id,
                selectedType,
                isAddOns: false,
                url: window.location.href,
            })
        );
        navigate(paths.plans.reviewOrder);
    };

    if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />;

    const colCount = sortedPlans.length;

    return (
        <div className="w-full px-4 xl:px-16 xxl:px-32 pb-16">
            <Flex vertical align="center" gap={8} className="py-5 text-center">
                <span className="inline-block bg-white text-lightRed text-xs font-medium px-5 py-1.5 rounded-full border border-lightRed">
                    Pricing
                </span>

                <Typography.Title
                    level={2}
                    className="!mb-0 !font-bold !text-3xl sm:!text-4xl text-greyTitle"
                >
                    Everything your business needs, in one plan.
                </Typography.Title>

                <Typography.Text className="text-textGray text-base mt-1">
                    All plans include access to the Peko platform. No hidden fees.
                </Typography.Text>

                <span className="inline-block  text-xs px-5 py-1.5 mt-1">
                    Monthly billing &nbsp;·&nbsp; Cancel anytime
                </span>
            </Flex>

            <div className="overflow-x-auto">
                <div className="min-w-[760px] border border-gray-200 rounded-2xl overflow-hidden">
                    <table
                        className="w-full"
                        style={{ borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}
                    >
                        <colgroup>
                            <col style={{ width: '220px' }} />
                            {Array.from({ length: colCount }).map((_, i) => (
                                <col key={i} style={{ width: 'auto' }} />
                            ))}
                        </colgroup>
                        <thead>
                            <tr>
                                <th className="bg-white border-b border-gray-200 px-8 py-5 align-middle text-center">
                                    <div className="flex items-center justify-center gap-2.5">
                                        <AppstoreOutlined className="text-greyTitle text-xl" />
                                        <Typography.Text className="text-greyTitle text-base md:text-lg font-medium">
                                            Service
                                        </Typography.Text>
                                    </div>
                                </th>

                                {sortedPlans.map(plan => {
                                    const price =
                                        selectedType === PlanType.Monthly
                                            ? plan.packagePrices.monthly
                                            : plan.packagePrices.annually;
                                    const discount =
                                        selectedType === PlanType.Monthly
                                            ? plan.discount.monthly
                                            : plan.discount.annually;
                                    const { discountedAmount } = calculateDiscount(
                                        price,
                                        Number(discount)
                                    );
                                    const actionType = getPlanActionType(plan);
                                    const isFree = parseFloat(price) === 0;

                                    return (
                                        <th
                                            key={plan.id}
                                            className="p-5 text-center align-top font-normal border-b border-l border-gray-200 bg-white"
                                        >
                                            <div className="flex flex-col items-center min-h-[200px] gap-3">
                                                <span className="inline-block bg-red-50 text-lightRed text-sm font-medium px-4 py-1 rounded-full">
                                                    {plan.packageName}
                                                </span>

                                                <div className="flex items-baseline gap-1 justify-center">
                                                    <Typography.Text className="text-3xl font-bold text-greyTitle">
                                                        {isFree
                                                            ? '₹0'
                                                            : `₹${formatNumberWithLocalString(discountedAmount, 0)}`}
                                                    </Typography.Text>
                                                    <Typography.Text className="text-xs text-textGray">
                                                        /
                                                        {selectedType === PlanType.Monthly
                                                            ? 'month'
                                                            : 'year'}
                                                    </Typography.Text>
                                                </div>

                                                <div className="w-full text-xs text-textGray leading-5 text-center line-clamp-3">
                                                    {plan.description}
                                                </div>

                                                {actionType === 'CURRENT' && (
                                                    <Button disabled block className="mt-auto">
                                                        Current Plan
                                                    </Button>
                                                )}
                                                {actionType === 'UPGRADE' && (
                                                    <Button
                                                        type="primary"
                                                        danger
                                                        block
                                                        className="mt-auto"
                                                        disabled={isFree}
                                                        onClick={() => handleChoosePlan(plan)}
                                                    >
                                                        Choose This Plan
                                                    </Button>
                                                )}
                                                {actionType === 'DOWNGRADE' && (
                                                    <Tooltip
                                                        title={
                                                            isFree
                                                                ? 'Cancelling current plan defaults to Peko Free'
                                                                : 'Downgrade not available'
                                                        }
                                                    >
                                                        <span className="mt-auto block w-full">
                                                            <Button disabled block>
                                                                Choose This Plan
                                                            </Button>
                                                        </span>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>

                        <tbody>
                            {(() => {
                                const availableKeys = new Set(
                                    sortedPlans.flatMap(p => p.services.map(s => s.accessKey))
                                );

                                // Build rows, collapsing same-group entries into one
                                type RowEntry = {
                                    accessKey: string;
                                    definition: PlanServiceDefinition;
                                    groupKeys: string[];
                                    comingSoon: boolean;
                                };
                                const seenGroups = new Set<string>();
                                const rows: RowEntry[] = [];
                                Object.entries(planServicesMap)
                                    .sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999))
                                    .forEach(([key, definition]) => {
                                    if (definition.group) {
                                        if (seenGroups.has(definition.group)) return;
                                        seenGroups.add(definition.group);
                                        const availableGroupKeys = Object.entries(planServicesMap)
                                            .filter(([k, d]) => d.group === definition.group && availableKeys.has(k))
                                            .map(([k]) => k);
                                        const comingSoon = availableGroupKeys.length === 0;
                                        rows.push({ accessKey: key, definition, groupKeys: comingSoon ? [key] : availableGroupKeys, comingSoon });
                                    } else {
                                        const comingSoon = !availableKeys.has(key);
                                        rows.push({ accessKey: key, definition, groupKeys: [key], comingSoon });
                                    }
                                });

                                return rows.map(({ accessKey, definition, groupKeys, comingSoon }, rowIdx) => {
                                    const isLast = rowIdx === rows.length - 1;
                                    const rowBorderB = isLast ? '' : 'border-b border-gray-100';

                                    if (comingSoon) {
                                        return (
                                            <tr key={accessKey}>
                                                <td className={`${rowBorderB} bg-white px-5 py-4`}>
                                                    <Typography.Text className="text-sm font-medium text-greyTitle">
                                                        {definition.label}
                                                    </Typography.Text>
                                                </td>
                                                {sortedPlans.map(plan => (
                                                    <td
                                                        key={`${accessKey}-${plan.id}`}
                                                        className={`${rowBorderB} border-l border-gray-100 px-4 py-4 text-center bg-white`}
                                                    >
                                                        <span className="inline-block text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-full">
                                                            Coming Soon
                                                        </span>
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    }

                                    return (
                                        <tr key={accessKey}>
                                            <td className={`${rowBorderB} bg-white px-5 py-4`}>
                                                <Typography.Text className="text-sm font-medium text-greyTitle">
                                                    {definition.label}
                                                </Typography.Text>
                                            </td>

                                            {sortedPlans.map(plan => {
                                                const svc = groupKeys
                                                    .map(k => plan.services.find(s => s.accessKey === k))
                                                    .find(Boolean);
                                                const bothZero =
                                                    !svc ||
                                                    (svc.unitPrice === 0 && svc.baseLimit === 0 &&
                                                        !(definition.usesSurcharge && svc.surcharge));
                                                let formattedText: string | null =
                                                    svc && definition.format && !bothZero
                                                        ? definition.format(svc.unitPrice, svc.baseLimit, svc.surcharge, svc.surchargeType)
                                                        : null;

                                                // WhatsApp Basic/Pro pricing comes from the separate whatsappPlans
                                                // source — shared with the review-order card via getWhatsAppPlanDescription
                                                // so both screens stay in lockstep ("Basic included" only for Peko+).
                                                if (accessKey === accessKeys.whatsappBasic) {
                                                    const waText = getWhatsAppPlanDescription(
                                                        whatsappPlans,
                                                        selectedType === PlanType.Monthly ? 'monthly' : 'annually',
                                                        plan.packageName
                                                    );
                                                    if (waText) formattedText = waText;
                                                }

                                                let cellContent: React.ReactNode;
                                                if (formattedText) {
                                                    cellContent = (
                                                        <Typography.Text className="text-xs text-textGray leading-relaxed">
                                                            {formattedText}
                                                        </Typography.Text>
                                                    );
                                                } else if (!svc) {
                                                    cellContent = <MinusOutlined className="text-gray-300 text-sm" />;
                                                } else {
                                                    cellContent = <img src={tickIcon} alt="included" className="w-5 h-5 mx-auto" />;
                                                }

                                                return (
                                                    <td
                                                        key={`${accessKey}-${plan.id}`}
                                                        className={`${rowBorderB} border-l border-gray-100 px-4 py-4 text-center bg-white`}
                                                    >
                                                        {cellContent}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PlanComparisonTable;
