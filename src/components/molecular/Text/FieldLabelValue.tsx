import React from 'react';

import { CheckCircleFilled } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

interface FieldLabelValueProps {
    label: string;
    value: string | undefined | null;
    verified?: boolean;
}

const { Text } = Typography;

const FieldLabelValue: React.FC<FieldLabelValueProps> = ({ label, value, verified }) => (
    <Flex vertical gap={5}>
        <Text className="text-titleText font-normal text-sm">{label}</Text>
        <Flex gap={10} align="center">
            <Text className="text-valueText font-normal text-custom h-11">{value || 'N/A'}</Text>
            {verified && (
                <CheckCircleFilled
                    style={{ color: '#21AD64', fontSize: '16px', marginBottom: 20 }}
                />
            )}
        </Flex>
    </Flex>
);

export default FieldLabelValue;
