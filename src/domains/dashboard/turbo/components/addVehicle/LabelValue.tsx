import { ReactNode } from 'react';

import { Flex, Typography } from 'antd';

interface LabelValueProps {
    label: ReactNode;
    value: ReactNode;
    className?: string;
    labelClassName?: string;
    valueClassName?: string;
    gap?: number;
}

const LabelValue = ({
    label,
    value,
    className,
    labelClassName = 'text-xs',
    valueClassName = 'mt-2 font-medium',
    gap,
}: LabelValueProps) => (
    <Flex vertical gap={gap} className={className}>
        <Typography.Text type="secondary" className={labelClassName}>
            {label}
        </Typography.Text>
        <Typography.Text className={valueClassName}>{value}</Typography.Text>
    </Flex>
);

export default LabelValue;
