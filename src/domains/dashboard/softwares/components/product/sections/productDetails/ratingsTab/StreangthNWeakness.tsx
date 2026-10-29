import { CheckOutlined, ExclamationOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

const { Text } = Typography;

type Props = {
    title: 'strength' | 'weakness';
};

const StrengthNWeakness = ({ title }: Props) => {
    const { product } = useProductContext();

    const list = title === 'strength' ? product?.reviews_strengths : product?.reviews_weakness;

    if (!list || list.length === 0) return null;

    return (
        <Flex vertical className="w-full gap-3">
            <Text className="mt-7 font-semibold text-xl text-[#0A0A0A]">
                {title === 'strength' ? 'Strengths' : 'Weaknesses'}
            </Text>

            <Flex vertical className="gap-3">
                {list.map((item, index) => (
                    <Flex
                        key={index}
                        className={`justify-start items-start gap-2 ${title === 'strength' ? 'bg-[#F0FDF4] border border-[#B9F8CF]' : 'bg-[#FFF7ED] border border-[#FFD6A7]'} rounded-lg p-3`}
                    >
                        {title === 'strength' ? (
                            <CheckOutlined className="text-[#12B76A]" />
                        ) : (
                            <ExclamationOutlined className="text-[#F54900]" />
                        )}
                        <Text>{item}</Text>
                    </Flex>
                ))}
            </Flex>
        </Flex>
    );
};

export default StrengthNWeakness;
