import React from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Button, Col, Row, Typography } from 'antd';

import { downloadDocumentData } from '../utils/data';

const DocumentDownload = () => (
    <Col span={24}>
        <Typography.Text className="text-lg font-medium">Policy Documents</Typography.Text>
        <Row className="mt-4 gap-5">
            {downloadDocumentData.map((item, i) => (
                <Button danger className="rounded-sm p-6 border flex items-center" key={i}>
                    {item}
                    <DownloadOutlined className="ml-2 text-xl" />
                </Button>
            ))}
        </Row>
    </Col>
);

export default DocumentDownload;
