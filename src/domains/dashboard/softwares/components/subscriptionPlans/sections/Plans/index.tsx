import { Empty, Flex, Skeleton } from 'antd';

import { useSubscriptionContext } from '@src/domains/dashboard/softwares/contexts/SubscriptionPageContext';

import PriceSection from './PriceSection';
import PriceSectionRFQ from './PriceSectionRFQ';

const Plans = () => {
    const { product, isLoading } = useSubscriptionContext();

    if (isLoading) return <Skeleton />;
    if (!product) return null;

    const { pricing = [], hasPurchaseOptions } = product;
    
    if (!hasPurchaseOptions && pricing.length === 0) {
        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }
    return (
        <Flex vertical className="gap-6 w-full items-center">
            {hasPurchaseOptions ? <PriceSection /> : <PriceSectionRFQ />}
        </Flex>
    );
};

export default Plans;
