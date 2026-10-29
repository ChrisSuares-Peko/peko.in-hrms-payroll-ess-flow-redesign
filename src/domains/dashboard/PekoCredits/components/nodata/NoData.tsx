import React from 'react';

import { Flex, Typography } from 'antd';

interface NoDataProps {
    message?: string;
}

const NoData: React.FC<NoDataProps> = ({ message = 'No data available.' }) => (
    <Flex justify="center" align="center" style={{ height: '100px' }}>
        <Typography.Text className="text-lg font-medium text-center">{message}</Typography.Text>
    </Flex>
);

export default NoData;
