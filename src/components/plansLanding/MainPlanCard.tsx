import React from 'react';

import { Button, Flex, Typography } from 'antd';

import type { BillingCycle, PlanCardVM } from '@utils/plansLandingData';

interface Props {
    card: PlanCardVM;
    /** Selected billing cycle — picks the monthly vs annual price shown on the card. */
    billing: BillingCycle;
    loading: boolean;
    onChoose: (card: PlanCardVM) => void;
}

const MainPlanCard: React.FC<Props> = ({ card, billing, loading, onChoose }) => {
    const { isRecommended, isBestValue } = card;
    const isCurrentPackage = card.actionType === 'CURRENT';
    const isAnnual = billing === 'annually';
    // The card is truly "current" only when the shown cycle matches the user's active cycle. A free
    // plan has no cycle (currentBilling undefined) so it stays current on both toggles.
    const isCurrent =
        isCurrentPackage && (card.currentBilling ? billing === card.currentBilling : true);
    // A monthly subscriber viewing the Annual toggle can upgrade the same plan to annual billing
    // (a different cycle isn't a duplicate — the create-order flow allows it). Not offered once the
    // plan is cancelled.
    const canUpgradeToAnnual =
        isCurrentPackage &&
        isAnnual &&
        card.currentBilling === 'monthly' &&
        !card.isCurrentCancelled;
    const priceLabel = isAnnual ? card.annualPriceLabel : card.priceLabel;
    const pricePeriod = isAnnual ? card.annualPricePeriod : card.pricePeriod;
    const billingNote = isAnnual ? card.annualBillingNote : card.billingNote;
    // Centered "Most popular" badge only when this is the recommended upgrade AND not the
    // top ("Best Value") tier — the top tier shows its "Best Value" tag instead (see below).
    const showMostPopular = isRecommended && !isBestValue && !isCurrent;

    // Inline title-row tag: current plan → "Your plan" (red); else the top tier → "Best Value" (green).
    let titleTag: React.ReactNode = null;
    if (isCurrent) {
        titleTag = (
            <span className="shrink-0 rounded-full bg-bgLightRed px-3 py-1 text-xs font-medium text-lightRed">
                Your plan
            </span>
        );
    } else if (isBestValue) {
        titleTag = (
            <span className="shrink-0 rounded-full bg-[#ecfdf5] px-3 py-1 text-xs font-medium text-[#43b75d]">
                Best Value
            </span>
        );
    }

    return (
        <div className="relative h-full pt-3">
            {showMostPopular && (
                <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-full border border-lightRed bg-white px-4 py-1 text-xs font-medium text-lightRed sm:text-sm">
                    Most popular
                </span>
            )}

            <Flex
                vertical
                className={`h-full gap-5 rounded-2xl border p-6 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] motion-reduce:transform-none motion-reduce:transition-none xl:p-8 ${
                    isRecommended
                        ? 'border-lightRed bg-gradient-to-b from-seashell to-white'
                        : 'border-borderGray bg-white'
                }`}
            >
                <Flex vertical gap={8} className="flex-grow">
                    <Flex align="flex-start" justify="space-between" gap={8}>
                        <Typography.Text className="text-lg font-semibold text-textHeadings sm:text-xl">
                            {card.name}
                        </Typography.Text>
                        {titleTag}
                    </Flex>

                    <Typography.Text className="text-sm text-textGray">
                        {card.tagline}
                    </Typography.Text>

                    <Flex align="baseline" gap={6} className="pt-1">
                        <Typography.Text className="text-3xl font-bold text-textHeadings sm:text-4xl">
                            {priceLabel}
                        </Typography.Text>
                        {pricePeriod && (
                            <Typography.Text className="text-sm text-textGray">
                                {pricePeriod}
                            </Typography.Text>
                        )}
                    </Flex>

                    <Typography.Text className="text-sm text-textGray">
                        {billingNote}
                    </Typography.Text>
                </Flex>

                {/* Disabled "Current Plan" only when the shown cycle is truly current — a monthly
                    subscriber on the Annual toggle gets an active "Upgrade to Annual" instead (28264). */}
                {isCurrent || (isCurrentPackage && !canUpgradeToAnnual) ? (
                    <Button block disabled className="!h-11 !rounded-lg !font-medium">
                        Current Plan
                    </Button>
                ) : (
                    <Button
                        block
                        danger
                        type={card.actionType === 'UPGRADE' ? 'primary' : 'default'}
                        loading={card.actionType === 'UPGRADE' && loading}
                        onClick={() => onChoose(card)}
                        className="!h-11 !rounded-lg !font-medium"
                    >
                        {canUpgradeToAnnual ? 'Upgrade to Annual' : 'Choose This Plan'}
                    </Button>
                )}
            </Flex>
        </div>
    );
};

export default MainPlanCard;
