import { Col, Flex, Row, Skeleton, Typography } from 'antd';

import { HostingPlan } from '../../hooks/useHostingPlans';
import SharedHostingPlanCard from '../SharedHostingPlanCard';

interface PlansSectionProps {
    filteredPlans: HostingPlan[];
    isLoading: boolean;
    planDescriptions: Record<string, string>;
    onPurchase: (
        productId: string,
        planId: string,
        planName: string,
        billingCycle: number
    ) => void | Promise<void>;
    plansRef: React.RefObject<HTMLDivElement>;
}
const { Text } = Typography;

export const PlansSection = ({
    filteredPlans,
    isLoading,
    planDescriptions,
    onPurchase,
    plansRef,
}: PlansSectionProps) => (
    <div ref={plansRef} className="px-4 sm:px-6 py-8 sm:py-10 max-w-7xl mx-auto">
        <Row gutter={[24, 24]} justify="center" className="mb-4 sm:mb-6">
            {isLoading && (
                <>
                    {[1, 2, 3].map(i => (
                        <Col xs={24} sm={12} lg={8} key={i}>
                            <Skeleton active />
                        </Col>
                    ))}
                </>
            )}
            {!isLoading && filteredPlans.length > 0 && (
                <>
                    {filteredPlans.map(plan => (
                        <Col xs={24} sm={12} lg={8} key={plan.id}>
                            <SharedHostingPlanCard
                                name={plan.planName}
                                description={planDescriptions[plan.planName]}
                                features={[
                                    ...(plan.vendorDetails.no_of_domains
                                        ? [
                                              {
                                                  label: 'Hosted Domains',
                                                  value: `${plan.vendorDetails.no_of_domains} Domain${plan.vendorDetails.no_of_domains !== '1' ? 's' : ''}`,
                                              },
                                          ]
                                        : []),
                                    ...plan.features,
                                ]}
                                pricingAdd={plan.pricingDetails?.add ?? {}}
                                pricingRenew={plan.pricingDetails?.renew}
                                isPopular={plan.planName === 'Business'}
                                discount={plan.vendorDetails?.discount?.value}
                                onPurchase={(billingCycle: number) =>
                                    onPurchase(
                                        plan.productId,
                                        plan.planId,
                                        plan.planName,
                                        billingCycle
                                    )
                                }
                            />
                        </Col>
                    ))}
                </>
            )}
            {!isLoading && filteredPlans.length === 0 && (
                <Col span={24}>
                    <Flex justify="center" className="py-12">
                        <Text className="text-gray-400">
                            No plans available for the selected filters.
                        </Text>
                    </Flex>
                </Col>
            )}
        </Row>
    </div>
);
