import { Col, Flex, Typography } from 'antd';

import '../../assets/style.css';

import { PlanType } from '../../types';

const { Text } = Typography;

interface SwitchPlanProps {
    selectedType: PlanType;
    handleChange: (tab: PlanType) => void;
}

const SwitchPlan: React.FC<SwitchPlanProps> = ({ selectedType, handleChange }: SwitchPlanProps) => (
    <Col className="m-0 mt-3 border rounded-full sm:block w-fit">
        <Flex
            justify="space-between"
            align="center"
            className="h-full xs:flex-col sm:mx-0 sm:flex-row xs:gap-4 sm:gap-4"
        >
            <Flex className="p-2" gap={16}>
                <Flex
                    className={`flex xs:flex-col md:flex-row cursor-pointer justify-between items-center px-4 sm:px-6 p-2 gap-2 rounded-full bg-white  ${selectedType === PlanType.Monthly ? 'border border-gray-300 shadow-md' : ''}`}
                    onClick={() => handleChange(PlanType.Monthly)}
                >
                    <Text className="text-sm font-medium text-center">
                        Monthly <br className="sm:hidden" />
                    </Text>
                </Flex>
                <Flex
                    className={`flex xs:flex-col md:flex-row cursor-pointer justify-between items-center px-4 sm:px-6 p-2 gap-2 rounded-full bg-white  ${selectedType === PlanType.Annually ? 'border border-gray-300 shadow-md' : ''}`}
                    onClick={() => handleChange(PlanType.Annually)}
                >
                    <Text className={`text-sm font-medium text-center `}>
                        Annually <br className="sm:hidden" />
                    </Text>
                </Flex>
            </Flex>
        </Flex>
    </Col>
);

export default SwitchPlan;
