import React from 'react';

import { InboxOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Flex, Typography, Upload, Spin } from 'antd';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;

interface UploadFormSectionProps {
    uploadProps: UploadProps;
    loading: boolean;
    uploadedFileName: string | null;
    error?: string;
}

const UploadFormSection: React.FC<UploadFormSectionProps> = ({
    uploadProps,
    loading,
    uploadedFileName,
    error,
}) => (
    <div>
        <div className="bg-[#ECFDF3] text-[#027A48] px-4 py-2 rounded mb-4">
            <Typography.Text className="font-medium text-[#027A48]">Note:</Typography.Text> Download
            the Excel template, fill it out, and upload the filled form.
        </div>

        <Dragger {...uploadProps} className="bg-white w-full" style={{ minHeight: '8rem' }}>
            {loading && (
                <Flex
                    justify="center"
                    align="center"
                    className="absolute inset-0 bg-white bg-opacity-75 z-10"
                >
                    <Spin tip="Uploading..." />
                </Flex>
            )}
            <Flex vertical className="mx-5 py-6 items-center">
                <p className="ant-upload-drag-icon text-black">
                    <InboxOutlined style={{ fontSize: '2rem' }} />
                </p>
                <Typography.Text>Click or drag file to this area to upload</Typography.Text>
                <Typography.Text className="text-gray-400 font-light text-center">
                    Support for a single or bulk upload.
                </Typography.Text>
            </Flex>
        </Dragger>

        {error && <Typography.Text className="text-errorTextRed mt-2 block">{error}</Typography.Text>}

        {uploadedFileName && (
            <Flex className="mt-2 items-center">
                <PaperClipOutlined className="text-errorTextRed mr-2" />
                <Typography.Text className="text-errorTextRed">{uploadedFileName}</Typography.Text>
            </Flex>
        )}
    </div>
);

export default UploadFormSection;
