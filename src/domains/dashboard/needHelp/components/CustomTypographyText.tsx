import React from 'react';

import { Flex, Typography } from 'antd';

type Props = {};

const CustomTypographyText = (props: Props) => {
    const { Text } = Typography;
    return (
        <Flex justify="space-between" align="center">
            <Text className="text-lg font-semibold text-textDarkGray" />
        </Flex>
    );
};

export default CustomTypographyText;
