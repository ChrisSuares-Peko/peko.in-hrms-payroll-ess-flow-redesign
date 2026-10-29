import React from 'react';

import { Flex, Typography } from 'antd';

interface StepHeaderProps {
    index: number;
    title: string;
    subtitle?: string;
    required?: boolean;
}

const StepHeader: React.FC<StepHeaderProps> = ({ index, title, subtitle, required }) => (
    <Flex align="flex-start" gap={16}>
        <Flex
            justify="center"
            align="center"
            style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#FFF0F0',
                color: '#FF4F4F',
                fontWeight: 600,
                fontSize: 14,
                flexShrink: 0,
            }}
        >
            {index}
        </Flex>
        <Flex vertical>
            <Typography.Text className="text-base font-semibold text-neutral-900">
                {title}
                {required && <span style={{ color: '#FF4F4F', marginLeft: 4 }}>*</span>}
            </Typography.Text>
            {subtitle && (
                <Typography.Text className="text-sm text-neutral-500">{subtitle}</Typography.Text>
            )}
        </Flex>
    </Flex>
);

export default StepHeader;
