import React from 'react';

import { Col, Flex, Typography } from 'antd';

const { Text } = Typography;

interface SwitchPlanProps {
    handleChange: (type: any) => void;
    selectedType: any;
}

const SwitchPlan: React.FC<SwitchPlanProps> = ({ handleChange, selectedType }) => (
    <Col className="mb-3 mt-3 border rounded-full sm:block w-fit">
        <Flex
            justify="space-between"
            align="center"
            className="h-full xs:flex-col sm:mx-0 sm:flex-row xs:gap-4 sm:gap-4"
        >
            <Flex className="p-2" gap={16}>
                <Flex
                    onClick={() => handleChange('Monthly')}
                    className={`flex xs:flex-col md:flex-row cursor-pointer justify-between items-center px-3 sm:px-6 p-2 gap-2 rounded-full bg-white  ${selectedType === 'Monthly' ? 'border border-gray-300 shadow-md' : ''}`}
                >
                    <Text className="text-sm font-medium text-center">Monthly</Text>
                </Flex>
                <Flex
                    className={`flex xs:flex-col md:flex-row cursor-pointer justify-between items-center px-3 sm:px-6 p-2 gap-2 rounded-full bg-white 
               ${selectedType === 'Yearly' ? 'border border-gray-300 shadow-md' : ''}`}
                    onClick={() => handleChange('Yearly')}
                >
                    <Text className="text-sm font-medium text-center">Yearly</Text>
                </Flex>
            </Flex>
        </Flex>
    </Col>
);

export default React.memo(SwitchPlan);
