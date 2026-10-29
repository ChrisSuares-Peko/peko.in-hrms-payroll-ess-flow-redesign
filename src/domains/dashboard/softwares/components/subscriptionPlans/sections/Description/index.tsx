import { Flex, Skeleton, Typography } from 'antd';

import { useSubscriptionContext } from '@src/domains/dashboard/softwares/contexts/SubscriptionPageContext';

const { Text } = Typography;

const Description = () => {
    const { product, isLoading } = useSubscriptionContext();
    if (isLoading) return <Skeleton />;
    if (!product) return null;
    return (
        <Flex vertical className="items-center gap-5 text-center w-[85%]">
            <Text className="text-2xl text-center sm:text-4xl font-medium text-navTextColor">
                Select the plan that works for you
            </Text>
            <Text className=" text-center font-regular text-sm sm:text-base text-[#425466] sm:leading-7">
                {product.pricing_overview}
            </Text>
        </Flex>
    );
};

export default Description;
