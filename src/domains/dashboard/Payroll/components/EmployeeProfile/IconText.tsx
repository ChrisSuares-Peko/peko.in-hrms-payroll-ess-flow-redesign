import React from 'react';

import { Space } from 'antd';

interface IconTextProps {
    icon: React.ReactNode;
    text: React.ReactNode;
}

const IconText: React.FC<IconTextProps> = ({ icon, text }) => (
    <Space>
        {icon}
        {text}
    </Space>
);

export default IconText;
