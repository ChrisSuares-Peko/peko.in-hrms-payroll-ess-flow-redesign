import React, { useState } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { Button, Tabs, Typography } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { uploadUserDocument } from '../api/documents';
import MyDocumentsTab from '../components/sections/MyDocumentsTab';
import RequestDocumentsTab from '../components/sections/RequestDocumentsTab';
import UploadDocumentModal from '../components/sections/UploadDocumentModal';

// data:<mime>;base64,<data> -> {base64, format}, matching the {base64,format}
// shape the backend's file-upload middleware expects.
const parseDataUrl = (dataUrl: string): { base64: string; format: string } => {
    const [meta, base64] = dataUrl.split(',');
    const format = meta.split(':')[1]?.split(';')[0]?.split('/')[1] ?? '';
    return { base64, format };
};

const { Title, Text } = Typography;

type DocumentTab = 'my-documents' | 'request-documents';

const tabItems = [
    { key: 'my-documents' as DocumentTab, label: 'My Documents' },
    { key: 'request-documents' as DocumentTab, label: 'Request Documents' },
];

const Documents: React.FC = () => {
    const [activeTab, setActiveTab] = useState<DocumentTab>('my-documents');
    const [uploadOpen, setUploadOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const handleUpload = async (body: {
        name: string;
        expiryDate?: string;
        holderName?: string;
        url: string;
    }) => {
        try {
            await uploadUserDocument(
                { userType: role, userId: id },
                {
                    name: body.name,
                    expiryDate: body.expiryDate,
                    holderName: body.holderName,
                    url: parseDataUrl(body.url),
                }
            );
            dispatch(
                showToast({ description: 'Document uploaded successfully', variant: 'success' })
            );
            setRefreshKey(k => k + 1);
            return true;
        } catch (err) {
            return false;
        }
    };

    return (
        <div className="w-full">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <Title level={4} className="text-valueText mb-0.5">
                        Document Vault
                    </Title>
                    <Text className="text-titleText text-sm">
                        Access and request your official documents
                    </Text>
                </div>
                {activeTab === 'my-documents' && (
                    <Button
                        type="primary"
                        danger
                        icon={<UploadOutlined />}
                        onClick={() => setUploadOpen(true)}
                        className="h-10 rounded-lg font-medium"
                    >
                        Upload Document
                    </Button>
                )}
            </div>

            <Tabs
                activeKey={activeTab}
                onChange={key => setActiveTab(key as DocumentTab)}
                items={tabItems.map(tab => ({
                    key: tab.key,
                    label: tab.label,
                    children: (
                        <div>
                            {tab.key === 'my-documents' && <MyDocumentsTab key={refreshKey} />}
                            {tab.key === 'request-documents' && <RequestDocumentsTab />}
                        </div>
                    ),
                }))}
            />

            <UploadDocumentModal
                open={uploadOpen}
                onClose={() => setUploadOpen(false)}
                onSubmit={handleUpload}
            />
        </div>
    );
};

export default Documents;
