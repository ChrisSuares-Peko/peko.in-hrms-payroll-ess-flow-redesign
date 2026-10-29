import { useState } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { Button, Flex, Typography, Upload } from 'antd';
import type { RcFile } from 'antd/es/upload';
import { useDispatch } from 'react-redux';

import { showToast } from '@src/slices/apiSlice';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_KB = 5120; // 5 MB

interface DocumentUploadCellProps {
    label: string;
    existingDoc?: { id: number; fileUrl?: string } | null;
    onUpload: (payload: { documentBase: string; documentFormat: string }) => Promise<boolean> | void;
}

const DocumentUploadCell = ({ label, existingDoc, onUpload }: DocumentUploadCellProps) => {
    const dispatch = useDispatch();
    const [uploading, setUploading] = useState(false);

    const beforeUpload = (file: RcFile) => {
        const okType = ALLOWED_TYPES.includes(file.type);
        if (!okType) {
            dispatch(
                showToast({ description: 'Please upload a JPG, PNG, or PDF file.', variant: 'error' })
            );
        }
        const okSize = file.size / 1024 <= MAX_FILE_KB;
        if (!okSize) {
            dispatch(
                showToast({ description: 'File size must be smaller than 5 MB', variant: 'error' })
            );
        }
        return okType && okSize;
    };

    const customRequest = ({ file, onSuccess }: any) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setUploading(true);
                Promise.resolve(
                    onUpload({
                        documentBase: reader.result.split(',')[1],
                        documentFormat: file.type.split('/')[1],
                    })
                ).finally(() => setUploading(false));
            }
        };
        reader.readAsDataURL(file);
        if (onSuccess) onSuccess('ok');
    };

    return (
        <Flex gap={5} className="flex-col justify-between h-full">
            <Typography.Text type="secondary" className="text-xs">
                {label}
            </Typography.Text>
            <Flex flex={1} align="center" gap={12}>
                {existingDoc?.fileUrl && (
                    <a
                        href={existingDoc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#ff4f4f]"
                    >
                        View
                    </a>
                )}
                <Upload
                    accept={ALLOWED_TYPES.join(',')}
                    maxCount={1}
                    showUploadList={false}
                    beforeUpload={beforeUpload}
                    customRequest={customRequest}
                    disabled={uploading}
                >
                    <Button size="small" icon={<UploadOutlined />} loading={uploading}>
                        {existingDoc?.fileUrl ? 'Replace' : 'Click to Upload'}
                    </Button>
                </Upload>
            </Flex>
        </Flex>
    );
};

export default DocumentUploadCell;
