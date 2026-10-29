import { useMemo, useState } from 'react';

import { Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { accessKeys } from '@utils/accessKeys';

import CardSkeleton from '../../plans/components/CardSkeleton';
import { PlanType } from '../../plans/types';
import PlanCard from '../components/PlanCard';
import SwitchPlan from '../components/SwitchPlan';
import { useGetPosSubscription } from '../hooks/useGetPosSubscription';
import useIsPurchased from '../hooks/useIsPurchased';
import usePayment from '../hooks/usePayment';

const hasPrice = (value?: string) => Number.parseFloat(`${value ?? 0}`) > 0;

const PlansPage = () => {
    const { packages, isLoading } = useGetPosSubscription({ accessKey: accessKeys.pekoPos });
    const { data: subscription } = useIsPurchased();
    const { handleSubmission, isLoading: isPaying } = usePayment();
    const [selectedType, setSelectedType] = useState<PlanType>(PlanType.Monthly);

    // Only offer the billing toggle when the seeded packages actually carry both
    // prices — several POS tiers are annual-only.
    const showToggle = useMemo(
        () =>
            packages.some(item => hasPrice(item.packagePrices?.monthly)) &&
            packages.some(item => hasPrice(item.packagePrices?.annually)),
        [packages]
    );

    const onlyMonthly = packages.some(item => hasPrice(item.packagePrices?.monthly));
    const soleType = onlyMonthly ? PlanType.Monthly : PlanType.Annually;
    const effectiveType = showToggle ? selectedType : soleType;

    return (
        <Content>
            <Content className="xl:px-[8%]">
                <Flex align="center" className="px-4 pt-10 pb-8 text-center" gap={8} vertical>
                    <Typography.Title
                        level={2}
                        className="!mb-0 !text-gray-900 !font-semibold max-w-[650px]"
                    >
                        Choose a Peko POS plan and start serving smarter
                    </Typography.Title>
                    <Typography.Text className="text-lg text-gray-500 max-w-[560px]">
                        One-time payment. Your restaurant is set up automatically after checkout.
                    </Typography.Text>
                </Flex>

                {showToggle && (
                    <SwitchPlan handleChange={setSelectedType} selectedType={selectedType} />
                )}

                <Row justify="center" gutter={[20, 20]} className="mt-10">
                    {isLoading && <CardSkeleton loading={isLoading} itemCount={3} />}
                    {!isLoading &&
                        packages.map((item, index) => {
                            const price =
                                effectiveType === PlanType.Monthly
                                    ? item.packagePrices.monthly
                                    : item.packagePrices.annually;
                            const isCurrentPlan =
                                subscription.isPurchased &&
                                subscription.packageName === item.packageName &&
                                subscription.billingType?.toLowerCase() ===
                                    effectiveType.toLowerCase();

                            return (
                                <PlanCard
                                    key={item.id}
                                    planName={item.packageName}
                                    price={`${price}`}
                                    discount={
                                        effectiveType === PlanType.Monthly
                                            ? Number(item.discount?.monthly ?? 0)
                                            : Number(item.discount?.annually ?? 0)
                                    }
                                    isPopular={packages.length === 3 && index === 1}
                                    feature={(item.description ?? '').split('\n').filter(Boolean)}
                                    selectedType={effectiveType}
                                    ctaLabel={isCurrentPlan ? 'Current plan' : 'Subscribe'}
                                    ctaDisabled={isCurrentPlan}
                                    ctaLoading={isPaying}
                                    onSelect={() =>
                                        handleSubmission(
                                            item.packageName,
                                            effectiveType,
                                            item.id,
                                            price,
                                            effectiveType === PlanType.Monthly
                                                ? (item.discount?.monthly ?? 0)
                                                : (item.discount?.annually ?? 0)
                                        )
                                    }
                                />
                            );
                        })}
                </Row>
            </Content>
        </Content>
    );
};

export default PlansPage;
