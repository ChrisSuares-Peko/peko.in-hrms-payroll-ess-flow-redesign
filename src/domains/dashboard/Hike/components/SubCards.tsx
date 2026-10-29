import React from 'react';

import { Flex, Typography } from 'antd';

const { Text } = Typography;

const SubCards = ({ salaryValidation, salaryAmt }: any) => {
    salaryValidation = salaryValidation === 'GREATER_THAN' ? 'greater than' : 'less than';
    return (
        <Flex
            className="px-3 py-4 my-2 xl:my-4 xl:px-4 sm:px-10 rounded-2xl bg-iconBgRed min-h-20 sm:min-h-24"
            align="center"
            justify="center"
        >
            <Flex vertical justify="center" align="center">
                <Text className="text-base text-center xl:text-lg md:text-base line-clamp-3">
                    For the employees with salary {salaryValidation} ₹ {salaryAmt}
                </Text>
            </Flex>
        </Flex>
    );
};

export default SubCards;
