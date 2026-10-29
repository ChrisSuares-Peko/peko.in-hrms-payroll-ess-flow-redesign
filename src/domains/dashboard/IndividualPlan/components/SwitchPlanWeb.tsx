import { Flex, Tag, Typography } from 'antd';

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

const SwitchPlanWeb = ({ price, discount, selectedType, handleChange }: Props) => {
    const { discountPercentage: monthlyDiscount } = calculateDiscount(
        price?.[PlanType.Monthly] ?? 0,
        discount?.[PlanType.Monthly] ?? 0
    );
    const { discountPercentage: annualDiscount } = calculateDiscount(
        price?.[PlanType.Annually] ?? 0,
        discount?.[PlanType.Annually] ?? 0
    );

    const optionStyle = {
        fontSize: '0.75rem',
        whiteSpace: 'nowrap',
        minWidth: '170px',
        padding: '6px 1.2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '999px',
        overflow: 'hidden',
    };

    const selectedStyle = {
        ...optionStyle,
        border: '2px solid #e0e0e0',
    };

    const containerStyle = {
        borderRadius: '999px',
        border: '1px solid #e0e0e0',
        padding: '4px',
        display: 'inline-flex',
        gap: '12px',
        overflow: 'hidden',
        maxWidth: '100%',
    };

    return (
        <Flex className="w-full " align="center" justify="center">
            <div style={containerStyle}>
                <Flex
                    onClick={() => handleChange(PlanType.Monthly)}
                    style={selectedType === PlanType.Monthly ? selectedStyle : optionStyle}
                    className="cursor-pointer"
                >
                    <Typography.Text
                        className="text-[.75rem] font-medium text-center"
                        style={{ display: 'inline-flex', alignItems: 'center' }}
                    >
                        Pay ₹ {price?.[PlanType.Monthly]} Monthly{' '}
                        {monthlyDiscount && monthlyDiscount > 0 ? (
                            <Tag
                                bordered={false}
                                className="mx-1 text-green-700 rounded-sm bg-green-50"
                                style={{ fontSize: '0.7rem', padding: '2px 4px' }}
                            >
                                Up to {formatNumberWithLocalString(monthlyDiscount, 0, 0)}% off
                            </Tag>
                        ) : (
                            ''
                        )}
                    </Typography.Text>
                </Flex>

                <Flex
                    onClick={() => handleChange(PlanType.Annually)}
                    style={selectedType === PlanType.Annually ? selectedStyle : optionStyle}
                    className="cursor-pointer"
                >
                    <Typography.Text
                        className="text-[.75rem] font-medium text-center"
                        style={{ display: 'inline-flex', alignItems: 'center' }}
                    >
                        Pay ₹ {price?.[PlanType.Annually]} Annually{' '}
                        {annualDiscount && annualDiscount > 0 ? (
                            <Tag
                                bordered={false}
                                className="mx-1 text-green-700 rounded-sm bg-green-50"
                                style={{
                                    fontSize: '0.7rem',
                                    padding: '2px 4px',
                                    visibility: annualDiscount > 0 ? 'visible' : 'hidden',
                                }}
                            >
                                Up to {formatNumberWithLocalString(annualDiscount, 0, 0)}% off
                            </Tag>
                        ) : (
                            ''
                        )}
                    </Typography.Text>
                </Flex>
            </div>
        </Flex>
    );
};

export default SwitchPlanWeb;
