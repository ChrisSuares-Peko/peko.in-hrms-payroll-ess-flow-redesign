import React from 'react';

import { Flex } from 'antd';

interface CustomLabelProps {
    label: string;
    className?: string;
}
const CustomLabel: React.FC<CustomLabelProps> = ({ label, className }) => (
    <Flex gap={10} className={` text-center text-[.9rem] ${className}`}>
        {label}
    </Flex>
);

export default CustomLabel;
