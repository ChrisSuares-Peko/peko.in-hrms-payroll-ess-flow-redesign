import { CheckOutlined } from '@ant-design/icons';
import { Flex, Skeleton, Typography } from 'antd';

import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

const { Text } = Typography;

type Props = {
    indicator: 'feature' | 'other feature';
};

const FeatureItems = ({ indicator }: Props) => {
    const { product, isLoading } = useProductContext();
    if (isLoading) return <Skeleton />;
    if (!product) return null;
    const list = indicator === 'feature' ? product.features : product.other_features;

    return (
        <Flex className="gap-3 flex-col flex-wrap lg:max-h-96 overflow-hidden">
            {list?.map((item: any, index: number) => (
                <Flex key={index} className="justify-start items-center gap-2">
                    <Flex className="p-2 bg-[#ECFDF3] rounded-full justify-center items-center">
                        <CheckOutlined className="text-[#12B76A]" />
                    </Flex>

                    <Text className="text-base font-normal text-[#425466]">
                        {indicator === 'feature' ? item.name : item}
                    </Text>
                </Flex>
            ))}
        </Flex>
    );
};

export default FeatureItems;
