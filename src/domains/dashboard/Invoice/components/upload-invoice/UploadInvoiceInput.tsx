import React from 'react';

import { InboxOutlined } from '@ant-design/icons';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { Col, Flex, Spin } from 'antd';
import { RcFile } from 'antd/es/upload';
import Dragger from 'antd/es/upload/Dragger';

type UploadInvoiceInputPropsType = {
    handleChange: (file: RcFile) => void;
    viewPdf: any;
    isUploading: boolean;
};
const UploadInvoiceInput = ({
    handleChange,
    viewPdf,
    isUploading,
}: UploadInvoiceInputPropsType) => (
    <Col
        md={10}
        className="border rounded-md mb-5 md:mb-0"
        style={{ maxHeight: '810px', padding: 0 }}
    >
        {isUploading ? (
            <Flex className="w-full h-full items-center justify-center">
                <Spin />
            </Flex>
        ) : (
            <>
                {viewPdf ? (
                    <Flex align="center" justify="center" className="h-full w-full">
                        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                            <Viewer fileUrl={viewPdf} defaultScale={SpecialZoomLevel.PageFit} />
                        </Worker>
                    </Flex>
                ) : (
                    <Dragger
                        name="file"
                        accept="application/pdf"
                        multiple={false}
                        showUploadList={false}
                        beforeUpload={file => {
                            handleChange(file);
                            return false;
                        }}
                    >
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Click or drag file to this area to upload</p>
                        <p className="ant-upload-hint">
                            Please upload a single PDF file that contains your invoice details.
                        </p>
                    </Dragger>
                )}
            </>
        )}
    </Col>
);

export default UploadInvoiceInput;
