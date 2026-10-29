import React from 'react';

import { FileTextOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Card, Flex, Typography } from 'antd';

const { Text } = Typography;

const FileItem: React.FC<{ name: string; url: string }> = ({ name, url }) => (
    <a href={url} target="_blank" rel="noopener noreferrer" download style={{ textDecoration: 'none' }}>
        <Flex
            align="center"
            gap={8}
            style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 12, padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 20px)', cursor: 'pointer' }}
        >
            <PaperClipOutlined style={{ fontSize: 18, color: '#595959', flexShrink: 0 }} />
            <Text style={{ flex: 1, fontSize: 13, wordBreak: 'break-all', color: '#314259' }}>{name || 'Download File'}</Text>
        </Flex>
    </a>
);

interface Props {
    attachments: { fileName: string; url: string; uploadedAt: string }[];
}

const InvoiceDocumentsCard: React.FC<Props> = ({ attachments }) => (
     <Card className="rounded-3xl w-full !border-gray-100" styles={{ body: { padding: 32 }  }}>
        <Flex vertical gap={16}>
            <Flex align="center" gap={14}>
                <Flex align="center" justify="center" style={{ width: 37, height: 37, background: '#fff4f4', borderRadius: 10, flexShrink: 0,}}>
                    <FileTextOutlined style={{ fontSize: 20, color: '#ff4f4f' }} />
                </Flex>
                <Text style={{ fontSize: 14, fontWeight: 500 }}>Invoice Documents</Text>
            </Flex>
            <Flex vertical gap={8}>
                <Text style={{ fontSize: 14, color: '#314259',fontWeight: 400 }}>Attachments</Text>
                {attachments.length > 0
                    ? attachments.map((a, i) => <FileItem key={i} name={a.fileName} url={a.url} />)
                    : <Text style={{ fontSize: 13, color: '#8c8c8c' }}>No attachments</Text>}
            </Flex>
        </Flex>
    </Card>
);

export default InvoiceDocumentsCard;
