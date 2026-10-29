import { useState } from 'react';

import { DownloadOutlined, EyeFilled } from '@ant-design/icons';
import { Card, Col, Flex, Tooltip, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import IFrameModal from '@components/molecular/modals/IFrameModal';

import FileIcon from '../../assets/icons/companydocuments/doc-6.svg';

type Props = {
    title: string;
    documentUrl: string;
    key: number;
};

export default function DocsListing({ title, documentUrl, key }: Props) {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const showPreview = () => {
        setIsModalVisible(isHovered);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    // Determine if the file is viewable directly
    const isDirectlyViewable =
        documentUrl.endsWith('.pdf') ||
        documentUrl.endsWith('.jpg') ||
        documentUrl.endsWith('.png');

    // Use Google Docs Viewer for other formats
    const viewerUrl = isDirectlyViewable
        ? documentUrl
        : `https://docs.google.com/gview?url=${encodeURIComponent(documentUrl)}&embedded=true`;

    return (
        <Col className="p-0 m-0" xs={24} sm={12} md={8} lg={12} xl={6} xxl={6} key={key}>
            <Card
                size="small"
                bordered
                className="border w-full sm:w-11/12 sm:h-64 xs:h-48 p-2 rounded-xl"
            >
                <Flex className="w-full" vertical gap={25} align="center">
                    <Flex
                        className="w-full xs:h-24 sm:h-40 bg-gray-100 rounded-lg sm:rounded-lg relative cursor-pointer"
                        align="center"
                        justify="center"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        onClick={showPreview}
                    >
                        <ReactSVG width={100} className="more-services" src={FileIcon} />
                        {isHovered && (
                            <Flex
                                vertical
                                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg"
                            >
                                <EyeFilled height={50} width={50} className="text-white text-xl" />
                                <Typography.Text className="text-white ">Preview</Typography.Text>
                            </Flex>
                        )}
                    </Flex>
                    <Flex justify="space-between" align="center" className="w-full">
                        {title.length > 20 ? (
                            <Tooltip title={title} placement="top">
                                <Typography.Text className="text-[.73rem] sm:text-[0.875rem] font-bold line-clamp-2 me-2">
                                    {title}
                                </Typography.Text>
                            </Tooltip>
                        ) : (
                            <Typography.Text className="text-[.73rem] sm:text-[0.875rem] font-bold line-clamp-2 me-2">
                                {title}
                            </Typography.Text>
                        )}
                        <Flex align="center" gap={10}>
                            <a
                                href={documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                            >
                                <DownloadOutlined className="text-iconRed text-xl" />
                            </a>
                        </Flex>
                    </Flex>
                </Flex>
            </Card>

            {/* Modal for Preview */}
            <IFrameModal
                modalTitle="Document Preview"
                videoUrl={viewerUrl}
                handleCancel={handleCancel}
                open={isModalVisible}
            />
        </Col>
    );
}
