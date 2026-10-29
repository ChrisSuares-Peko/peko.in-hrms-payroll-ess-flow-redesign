import { Col, Flex, Tag, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { PlanType } from '../../plans/types/index';
import { calculateDiscount } from '../../plans/utils/index';
import { Discount, PackagePrice } from '../types/index';

type Props = {
    price?: PackagePrice;
    discount?: Discount;
    selectedType: PlanType;
    handleChange: (tab: PlanType) => void;
};

const SwitchPlan = ({ price, discount, selectedType, handleChange }: Props) => {
    const { discountPercentage: monthlyDiscount } = calculateDiscount(
        price?.[PlanType.Monthly] ?? 0,
        discount?.[PlanType.Monthly] ?? 0
    );
    const { discountPercentage: annualDiscount } = calculateDiscount(
        price?.[PlanType.Annually] ?? 0,
        discount?.[PlanType.Annually] ?? 0
    );
    return (
        <Col className="m-0 mt-3 border rounded-full">
            <Flex
                justify="center"
                align="center"
                className="flex-wrap h-full xs:flex-col sm:mx-0 sm:flex-row xs:gap-2 sm:gap-4"
            >
                <Flex className="p-2" gap={16}>
                    <Flex
                        className={`flex xs:flex-col md:flex-row cursor-pointer justify-between items-center px-3 sm:px-6 p-2 gap-2 rounded-full bg-white 
                        ${selectedType === PlanType.Monthly ? 'border border-gray-300 shadow-md' : ''}`}
                        onClick={() => handleChange(PlanType.Monthly)}
                    >
                        <Typography.Text className="text-sm font-medium text-center">
                            ₹ {price?.[PlanType.Monthly]} Monthly{' '}
                            {monthlyDiscount && monthlyDiscount > 0 ? (
                                <Tag
                                    bordered={false}
                                    className="mx-1 text-green-700 rounded-sm bg-green-50"
                                >
                                    Upto {formatNumberWithLocalString(monthlyDiscount, 0, 0)}% off
                                </Tag>
                            ) : (
                                ''
                            )}
                        </Typography.Text>
                    </Flex>
                    <Flex
                        className={`flex xs:flex-col md:flex-row cursor-pointer justify-between items-center px-3 sm:px-6 p-2 gap-2 rounded-full bg-white 
                        ${selectedType === PlanType.Annually ? 'border border-gray-300 shadow-md' : ''}`}
                        onClick={() => handleChange(PlanType.Annually)}
                    >
                        <Typography.Text className="text-sm font-medium text-center">
                            ₹ {price?.[PlanType.Annually]} Annually{' '}
                            {annualDiscount && annualDiscount > 0 ? (
                                <Tag
                                    bordered={false}
                                    className="mx-1 text-green-700 rounded-sm bg-green-50"
                                >
                                    Upto {formatNumberWithLocalString(annualDiscount, 0, 0)}% off
                                </Tag>
                            ) : (
                                ''
                            )}
                        </Typography.Text>
                    </Flex>
                </Flex>
            </Flex>
        </Col>
    );
};

export default SwitchPlan;
