import React from 'react';

import { Flex } from 'antd';

interface CustomLabelProps {
    label: string;
    className?: string;
    required?: boolean;
}
const CustomLabel: React.FC<CustomLabelProps> = ({ label, className, required }) => (
    <Flex className={` text-center text-[.9rem] ${className}`}>
        {' '}
        {required && <span style={{ color: 'red' }}>* </span>} {label}
    </Flex>
);

export default CustomLabel;
