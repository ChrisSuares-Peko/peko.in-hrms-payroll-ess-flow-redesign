import React from 'react';

import { Flex, Typography } from 'antd';

interface KeyValueDisplayProps {
    label: string;
    value: string | React.ReactNode;
}

const KeyValueDisplay: React.FC<KeyValueDisplayProps> = ({ label, value }) => (
    <Flex justify="space-between" className="mt-5">
        <Typography.Text className="text-base">{label}</Typography.Text>
        <Typography.Text className="text-base">{value}</Typography.Text>
    </Flex>
);

export default KeyValueDisplay;
