import React from 'react';

import { PaperClipOutlined } from '@ant-design/icons';
import { Flex, Typography, theme } from 'antd';

interface CertificateCardProps {
    label?: string;
    certificateName: string;
    fileName?: string;
    onDelete: () => void;
    expiry?: boolean;
    onRemoveCertificate: () => void;
}
const CertificateCard = ({
    label,
    certificateName,
    fileName,
    expiry,
    onDelete,
    onRemoveCertificate,
}: CertificateCardProps) => {
    const {
        token: { colorPrimary },
    } = theme.useToken();

    return (
        <Flex vertical gap={16} style={{ marginTop: '-2rem', width: '287px' }}>
            <Typography.Text className=" text-titleText font-normal text-sm mt-3">
                {label}
            </Typography.Text>
            <Flex
                className=" border border-solid border-gray-200 px-5 py-2 rounded-sm"
                align="center"
                justify="space-between"
            >
                <Flex gap={16}>
                    <PaperClipOutlined />

                    <Typography.Text
                        style={{ color: colorPrimary }}
                        className="font-normal text-sm line-clamp-1"
                    >
                        {fileName}
                    </Typography.Text>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default CertificateCard;
