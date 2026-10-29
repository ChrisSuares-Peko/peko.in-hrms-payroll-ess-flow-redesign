import { Col, Row, Card, Skeleton, Divider } from 'antd';

import { useSubscriptionContext } from '@src/domains/dashboard/softwares/contexts/SubscriptionPageContext';

import FeaturesSection from './FeaturesSection';
import PriceSectionRFPCard from './PriceSectionRFPCard';

const PriceSectionRFQ = () => {
    const { product, isLoading } = useSubscriptionContext();

    if (isLoading) return <Skeleton />;
    if (!product) return null;
    const { pricing = [] } = product;
    return (
        <Row gutter={[24, 24]} className="w-full" justify="center">
            {pricing.map((plan, index) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={index}>
                    <Card className="rounded-2xl shadow-[0px_1.78px_2px_0px_#19213D1A] overflow-hidden bottom-1 hover:scale-105 transition-all">
                        <PriceSectionRFPCard
                            planName={plan.plan}
                            key={index}
                            weburl={product.weburl}
                            period={plan.period}
                            amountInConvertedCurrency={plan.amountInConvertedCurrency}
                            isPlanFree={plan.isPlanFree}
                        />
                        <Divider className="my-6" />
                        <FeaturesSection plan={plan} />
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default PriceSectionRFQ;
