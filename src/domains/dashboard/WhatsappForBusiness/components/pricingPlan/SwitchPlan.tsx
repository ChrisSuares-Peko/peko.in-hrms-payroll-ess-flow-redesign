import { Col, Flex, Tag, Typography } from 'antd';

// import '../assets/styles.css';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { PackagePrices, PlanType } from '../../types/index';

const { Text } = Typography;

interface SwitchPlanProps {
    selectedType: PlanType;
    handleChange: (tab: PlanType) => void;
    discount: PackagePrices;
}

const SwitchPlan: React.FC<SwitchPlanProps> = ({
    selectedType,
    handleChange,
    discount,
}: SwitchPlanProps) => {
    const annualDiscount = discount?.[PlanType.Annually] ?? 0;
    const monthlyDiscount = discount?.[PlanType.Monthly] ?? 0;
    return (
        <Col className="m-0 mt-3 border rounded-full w-fit">
            <Flex
                justify="space-between"
                align="center"
                className="h-full xs:flex-col sm:mx-0 sm:flex-row xs:gap-2 sm:gap-4"
            >
                <Flex className="p-2" gap={16}>
                    <Flex
                        className={`flex xs:flex-col md:flex-row cursor-pointer justify-between items-center px-3 sm:px-6 p-2 gap-2 rounded-full bg-white  ${selectedType === PlanType.Monthly ? 'border border-gray-300 shadow-md' : ''}`}
                        onClick={() => handleChange(PlanType.Monthly)}
                    >
                        <Text className="text-sm font-medium text-center">
                            Billed <br className="sm:hidden" /> Monthly{' '}
                            {monthlyDiscount && monthlyDiscount > 0 ? (
                                <Tag
                                    bordered={false}
                                    className="mx-1 text-xs text-green-700 rounded-sm bg-green-50"
                                >
                                    Upto {formatNumberWithLocalString(monthlyDiscount, 0, 2)}% off
                                </Tag>
                            ) : (
                                ''
                            )}
                        </Text>
                    </Flex>
                    <Flex
                        className={`text-xs flex xs:flex-col md:flex-row cursor-pointer justify-between items-center px-3 sm:px-6 p-2 gap-2 rounded-full bg-white  ${selectedType === PlanType.Annually ? 'border border-gray-300 shadow-md' : ''}`}
                        onClick={() => handleChange(PlanType.Annually)}
                    >
                        <Text className={`text-sm font-medium text-center `}>
                            Billed <br className="sm:hidden" />
                            Annually{' '}
                            {annualDiscount && annualDiscount > 0 ? (
                                <Tag
                                    bordered={false}
                                    className="mx-1 text-xs text-green-700 rounded-sm bg-green-50"
                                >
                                    Upto {formatNumberWithLocalString(annualDiscount, 0, 2)}% off
                                </Tag>
                            ) : (
                                ''
                            )}
                        </Text>
                    </Flex>
                </Flex>
            </Flex>
        </Col>
    );
};

export default SwitchPlan;
