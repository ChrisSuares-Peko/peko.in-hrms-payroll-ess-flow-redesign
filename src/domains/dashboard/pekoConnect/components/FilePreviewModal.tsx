import React from 'react';

import { Button, Flex, Image, Modal, Typography } from 'antd';

import documentDefault from '../assets/documentDefault.svg';

const { Text } = Typography;

interface FileMessagePreviewProps {
    previewVisible: boolean;
    previewImage: string | null;
    file: File | null;
    isLoadingPostChatFile: boolean;
    handleCancel: () => void;
    handleSubmit: () => void;
}

const FilePreviewModal: React.FC<FileMessagePreviewProps> = ({
    previewVisible,
    handleCancel,
    handleSubmit,
    isLoadingPostChatFile,
    previewImage,
    file,
}) => (
    <Modal
        open={previewVisible}
        title="File Preview"
        onCancel={handleCancel}
        footer={[
            <Button key="back" onClick={handleCancel}>
                Cancel
            </Button>,
            <Button
                loading={isLoadingPostChatFile}
                key="submit"
                type="primary"
                danger
                onClick={handleSubmit}
            >
                Proceed
            </Button>,
        ]}
    >
        {previewImage && file?.type.startsWith('image/') ? (
            <img alt="Preview" style={{ width: '100%' }} src={previewImage} />
        ) : (
            <Flex vertical justify="center" align="center">
                <Image style={{ width: '100%' }} src={documentDefault} preview={false} alt="" />
                <Text className="my-5 text-center">Preview not available</Text>
            </Flex>
        )}
    </Modal>
);
export default FilePreviewModal;
