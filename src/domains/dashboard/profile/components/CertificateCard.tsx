import React from 'react';

import { DeleteOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Flex, Typography, theme } from 'antd';

interface CertificateCardProps {
    label: string;
    certificateName: string;
    link?: string;
    handleDeleteDocs: () => void;
}
const CertificateCard = ({
    label,
    certificateName,
    link,
    handleDeleteDocs,
}: CertificateCardProps) => {
    const {
        token: { colorPrimary },
    } = theme.useToken();
    return (
        <Flex vertical gap={10}>
            <Typography.Text className="text-sm font-normal text-titleText">
                {label}
            </Typography.Text>
            <Flex
                className="px-3 py-2 border border-gray-200 border-solid rounded-md "
                align="center"
                justify="space-between"
            >
                <Flex gap={8}>
                    <PaperClipOutlined />
                    <Typography.Link
                        style={{ color: colorPrimary }}
                        href={link}
                        target="_blank"
                        className="text-sm font-normal "
                    >
                        {certificateName}
                    </Typography.Link>
                </Flex>
                <DeleteOutlined onClick={() => handleDeleteDocs()} />
            </Flex>
        </Flex>
    );
};

export default CertificateCard;
