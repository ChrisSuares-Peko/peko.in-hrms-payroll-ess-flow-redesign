import React from 'react';

import { Flex, Typography } from 'antd';

const { Title, Text } = Typography;

const Form16Header: React.FC = () => (
    <Flex vertical className="mb-4 md:w-3/4 xs:w-full">
        <Title level={5}>Form 16 - Certificate for Tax Deduction at Source (TDS)</Title>
        <Text>
            Certificate under Section 203 of the Income-tax Act, 1961 for tax deducted at source on
            salary paid to an employee under section 192 or pension/interest income of specified
            senior citizen under section 194P.
        </Text>
    </Flex>
);

export default Form16Header;
