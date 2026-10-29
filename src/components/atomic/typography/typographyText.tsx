import React from 'react';

import { Typography } from 'antd';

interface TypographyTextProps {
    className?: string;
    children: React.ReactNode;
}

const { Text } = Typography;

const TypographyText: React.FC<TypographyTextProps> = ({ className, children, ...restProps }) => {
    const classNames = className || '';

    return (
        <Text className={classNames} {...restProps}>
            {children}
        </Text>
    );
};

export default TypographyText;
