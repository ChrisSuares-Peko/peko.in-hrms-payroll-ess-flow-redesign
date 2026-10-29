import React, { useState } from 'react';

import { CheckOutlined, CopyOutlined } from '@ant-design/icons';
import { Flex } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

interface IrnFieldProps {
    label: string;
    value: string;
    copyable?: boolean;
}

const IrnField: React.FC<IrnFieldProps> = ({ label, value, copyable = false }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Flex vertical gap={4}>
            <TypographyText className="text-sm font-medium text-[#344054]">{label}</TypographyText>
            <Flex
                align="center"
                gap={8}
                className="h-10 px-4 bg-[#F9FAFB] border border-[#E4E4E7] rounded-lg overflow-hidden"
            >
                <TypographyText className="flex-1 text-sm truncate">{value}</TypographyText>
                {copyable && (
                    <Flex
                        className="flex-shrink-0 cursor-pointer text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                        onClick={handleCopy}
                    >
                        {copied ? (
                            <CheckOutlined className="text-[#12B76A] text-xs" />
                        ) : (
                            <CopyOutlined className="text-xs" />
                        )}
                    </Flex>
                )}
            </Flex>
        </Flex>
    );
};

export default IrnField;
