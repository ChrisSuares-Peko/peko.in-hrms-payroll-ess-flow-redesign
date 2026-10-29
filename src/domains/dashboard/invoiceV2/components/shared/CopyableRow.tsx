import { useState } from 'react';

import { CheckOutlined, CopyOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

interface CopyableRowProps {
    title: string;
    description: string;
}

const CopyableRow = ({ title, description }: CopyableRowProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(description);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Flex
            justify="space-between"
            align="center"
            className="flex-1 bg-[#F9FAFB] rounded-xl px-4 py-3"
        >
            <Flex vertical gap={2}>
                <Typography.Text className="text-xs text-[#6A7282]">{title}</Typography.Text>
                <Typography.Text className="text-sm">{description}</Typography.Text>
            </Flex>
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
    );
};

export default CopyableRow;
