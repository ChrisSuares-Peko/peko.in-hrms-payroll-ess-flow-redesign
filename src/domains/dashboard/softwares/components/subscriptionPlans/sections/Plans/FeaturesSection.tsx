import { CheckCircleFilled } from '@ant-design/icons';
import { Typography, Flex, Empty } from 'antd';

const { Text } = Typography;

const FeaturesSection = ({ plan }: any) => (
    <Flex vertical className="py-1 gap-4">
        <Text className="font-medium text-lg text-navTextColor">Features:</Text>

        {plan.description && plan.description.length > 0 ? (
            <div
                style={{ scrollbarWidth: 'none' }}
                className="[&::-webkit-scrollbar]:hidden h-48 overflow-y-auto "
            >
                <Flex vertical gap={8}>
                    {plan.description.map((feature: string, index: number) => (
                        <Flex key={index} className="justify-start items-center gap-2">
                            <CheckCircleFilled className="text-textLime text-base" />
                            <Text className="font-regular text-sm text-[#6F6C8F]">{feature}</Text>
                        </Flex>
                    ))}
                </Flex>
            </div>
        ) : (
            <div className="flex items-center justify-center h-48">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No features listed" />
            </div>
        )}
    </Flex>
);

export default FeaturesSection;
