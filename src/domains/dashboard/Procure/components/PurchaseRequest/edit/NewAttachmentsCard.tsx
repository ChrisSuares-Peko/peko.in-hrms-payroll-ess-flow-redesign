import React from 'react';

import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Flex, Form, Typography, Upload } from 'antd';

import purchaseRequestIcon12 from '@src/domains/dashboard/Procure/assets/icons/purchaseRequestIcon2.svg';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import SectionHeader from './SectionHeader';
import { ALLOWED_FILE_TYPES, sectionCard } from './shared';

const { Text } = Typography;

interface Attachment { fileName: string; fileBase64: string; fileFormat: string }

interface Props {
    values: { attachments: Attachment[] };
    setFieldValue: (field: string, value: any) => void;
}

const NewAttachmentsCard: React.FC<Props> = ({ values, setFieldValue }) => {
    const dispatch = useAppDispatch();

    const handleBeforeUpload = (file: File) => {
        if (!ALLOWED_FILE_TYPES.includes(file.type as any)) {
            dispatch(showToast({ variant: 'error', description: 'Unsupported file type. Allowed: PDF, JPG, PNG, DOC, DOCX.' }));
            return Upload.LIST_IGNORE;
        }
        if (file.size / 1024 > 5120) {
            dispatch(showToast({ variant: 'error', description: 'File size must be smaller than 5 MB.' }));
            return Upload.LIST_IGNORE;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            const format = file.name.split('.').pop()?.toLowerCase() ?? '';
            setFieldValue('attachments', [...values.attachments, { fileName: file.name, fileBase64: base64, fileFormat: format }]);
        };
        reader.readAsDataURL(file);
        return false;
    };

    return (
        <Card {...sectionCard}>
            <SectionHeader icon={purchaseRequestIcon12} title="Supporting Documents" subtitle="Attach any relevant files or notes" />
            <Divider className="!my-3 !-mx-6" style={{ width: 'calc(100% + 48px)' }} />
            <Form.Item label={<Text strong className="text-sm">Attachments</Text>} className="!mb-0">
                <Flex vertical gap={8}>
                    <Upload multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" showUploadList={false} beforeUpload={handleBeforeUpload}>
                        <Button icon={<UploadOutlined />} className="w-full" size="middle">Click to Upload</Button>
                    </Upload>
                    {values.attachments.map((att, i) => (
                        <Flex key={i} justify="space-between" align="center" style={{ background: '#fafafa', borderRadius: 6, padding: '6px 10px', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.07)' }}>
                            <Text className="text-sm text-blue-500 line-clamp-1">{att.fileName}</Text>
                            <Button
                                icon={<DeleteOutlined />}
                                size="small"
                                danger
                                type="text"
                                onClick={() => setFieldValue('attachments', values.attachments.filter((_, idx) => idx !== i))}
                            />
                        </Flex>
                    ))}
                </Flex>
            </Form.Item>
        </Card>
    );
};

export default NewAttachmentsCard;
