// import { useState } from 'react';

import { Col, Row, Card, Flex, Skeleton } from 'antd';

import { useSubscriptionContext } from '@src/domains/dashboard/softwares/contexts/SubscriptionPageContext';

import PriceSectionCard from './PriceSectionCard';

// type BillingCycle = 'monthly' | 'yearly';

const PriceSection = () => {
    const { product, isLoading } = useSubscriptionContext();
    // const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
    if (isLoading) return <Skeleton />;
    if (!product) return null;
    const { purchaseOptions = [] } = product;

    return (
        <Flex vertical className="gap-6 w-full items-center">
            {/* <Segmented
                options={[
                    { label: 'Monthly', value: 'monthly' },
                    { label: 'Yearly', value: 'yearly' },
                ]}
                value={billingCycle}
                onChange={val => setBillingCycle(val as BillingCycle)}
            /> */}
            <Row gutter={[24, 24]} className="w-full" justify="center">
                {purchaseOptions.map((purchaseOption, index) => {
                    const { pricingOption } = purchaseOption.sku;
                    if (!pricingOption) return null;
                    return (
                        <Col xs={24} sm={12} lg={10} xl={8} key={index}>
                            <Card className="relative rounded-2xl shadow-[0px_1.78px_2px_0px_#19213D1A] overflow-hidden bottom-1 hover:scale-105 transition-all">
                                <PriceSectionCard
                                    purchaseOption={purchaseOption}
                                    productName={product.product_name}
                                    pricingOption={pricingOption}
                                    weburl={product.weburl}
                                    company={product.company}
                                />
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        </Flex>
    );
};

export default PriceSection;
