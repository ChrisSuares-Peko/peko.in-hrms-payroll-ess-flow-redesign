import { CheckOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Typography } from 'antd';

import { PlanType } from '../../plans/types';

type Props = {
    feature: string[];
    planName: string;
    price: string;
    discount?: number;
    isPopular?: boolean;
    ctaLabel?: string;
    ctaLoading?: boolean;
    ctaDisabled?: boolean;
    selectedType: PlanType;
    onSelect: () => void;
};

const PlanCard = ({
    feature,
    planName,
    price,
    discount = 0,
    isPopular,
    ctaLabel = 'Subscribe',
    ctaLoading,
    ctaDisabled,
    selectedType,
    onSelect,
}: Props) => (
    <Col xs={24} sm={12} md={12} lg={10} xl={8} xxl={7} className="pt-3">
        <Flex className="h-full flex-col justify-between rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.1)] transition duration-150 transform hover:scale-105">
            {isPopular && (
                <Flex justify="center" className="w-full bg-red-50 rounded-t-2xl">
                    <Typography.Text className="text-lightRed text-base font-medium py-2">
                        Most Popular
                    </Typography.Text>
                </Flex>
            )}
            <Flex className="h-full w-full p-5" gap={10} vertical>
                <Typography.Text className="md:text-xl text-red-500 text-lg font-medium">
                    {planName}
                </Typography.Text>

                <Flex align="end" justify="space-between">
                    <Flex vertical>
                        <Typography.Text
                            delete
                            aria-hidden={discount <= 0}
                            className={`text-gray-400 text-sm ${discount > 0 ? '' : 'invisible'}`}
                        >
                            ₹ {(parseFloat(price) + (discount > 0 ? discount : 0)).toFixed(2)}
                        </Typography.Text>
                        <Typography.Text className="xxl:text-3xl sm:text-xl md:text-3xl lg:text-2xl text-3xl font-medium sm:font-semibold md:font-medium mt-2">
                            ₹ {price}
                        </Typography.Text>
                    </Flex>
                    <Typography.Text className="text-sm font-normal pb-1">
                        /{selectedType}
                    </Typography.Text>
                </Flex>

                <Flex vertical justify="space-between" className="h-full">
                    <Flex vertical gap={8}>
                        {feature.map((item, index) => (
                            <Flex key={index} align="start" gap={4}>
                                <CheckOutlined className="text-green-500 mt-1" />
                                <Typography.Paragraph
                                    className="text-xs font-normal leading-5 overflow-hidden text-ellipsis"
                                    style={{ whiteSpace: 'pre-wrap' }}
                                >
                                    {item}
                                </Typography.Paragraph>
                            </Flex>
                        ))}
                    </Flex>

                    <Flex>
                        <Button
                            className="mt-4 w-full bg-white text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                            type="default"
                            loading={ctaLoading}
                            disabled={ctaDisabled}
                            onClick={onSelect}
                        >
                            {ctaLabel}
                        </Button>
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    </Col>
);

export default PlanCard;
