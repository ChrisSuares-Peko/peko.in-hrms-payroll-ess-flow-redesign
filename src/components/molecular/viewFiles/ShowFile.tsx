import React from 'react';

import { DeleteOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Flex, Typography, theme } from 'antd';

interface ShowFileProps {
    label: string;
    fileName: string;
    link?: string;
    handleDeleteDocs?: () => void;
}

const { Text } = Typography;

const ShowFile = ({ label, fileName, link, handleDeleteDocs }: ShowFileProps) => {
    const {
        token: { colorPrimary },
    } = theme.useToken();
    return (
        <Flex vertical gap={10} className="mb-3">
            <Text className=" text-titleText font-normal text-sm">{label}</Text>
            <Flex
                className=" border border-solid border-gray-200 px-3 py-2 rounded-md"
                align="center"
                justify="space-between"
            >
                <Flex gap={8}>
                    <PaperClipOutlined />
                    <Typography.Link
                        style={{ color: colorPrimary }}
                        href={link}
                        target="_blank"
                        className="  font-normal text-sm"
                    >
                        {fileName}
                    </Typography.Link>
                </Flex>

                <DeleteOutlined onClick={() => handleDeleteDocs && handleDeleteDocs()} />
            </Flex>
        </Flex>
    );
};

export default ShowFile;
