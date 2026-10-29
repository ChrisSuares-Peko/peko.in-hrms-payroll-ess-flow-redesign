import React, { useState } from 'react';

import { CheckOutlined, CopyOutlined } from '@ant-design/icons';
import { Flex, Input, Typography } from 'antd';

type Props = {
    label: string;
    value: string;
};

const CopyableField: React.FC<Props> = ({ label, value }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Flex vertical gap={4}>
            <Typography.Text className="text-[#344054] text-sm font-medium block">
                {label}
            </Typography.Text>
            <Flex gap={8} align="center">
                <Input value={value} readOnly className="h-9 rounded-lg flex-1" />
                <Flex
                    justify="center"
                    align="center"
                    className="w-9 h-9 bg-[#FF4F4F] rounded-lg cursor-pointer hover:bg-[#e63e3e] transition-colors flex-shrink-0"
                    onClick={handleCopy}
                >
                    {copied ? (
                        <CheckOutlined className="text-white text-sm" />
                    ) : (
                        <CopyOutlined className="text-white text-sm" />
                    )}
                </Flex>
            </Flex>
        </Flex>
    );
};

export default CopyableField;
