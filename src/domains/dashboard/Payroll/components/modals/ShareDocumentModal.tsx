import { useState } from 'react';

import { InboxOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Typography, Upload } from 'antd';
import type { RcFile } from 'antd/es/upload';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useUploadDocumentRequestApi from '../../hooks/docAndAssetsHooks/useUploadDocumentRequestApi';
import type { DocumentRequestRecord } from '../Employees/DocumentRequestsTab';

const MAX_MB = 10;

interface Props {
    open: boolean;
    record: DocumentRequestRecord | null;
    onCancel: () => void;
    onSuccess: () => void;
}

// Reads the file as base64 client-side (IN has no temp-upload service, unlike
// AE) — the backend's {base64, format} shape is populated here instead.
const readFileAsBase64 = (file: RcFile): Promise<{ base64: string; format: string }> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve({ base64: reader.result.split(',')[1], format: file.type.split('/')[1] });
            } else {
                reject(new Error('Failed to read file'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const ShareDocumentModal = ({ open, record, onCancel, onSuccess }: Props) => {
    const dispatch = useAppDispatch();
    const [note, setNote] = useState('');
    const [noteError, setNoteError] = useState('');
    const [fileBase64, setFileBase64] = useState('');
    const [fileFormat, setFileFormat] = useState('');
    const [fileName, setFileName] = useState('');
    const { handleUpload, isLoading } = useUploadDocumentRequestApi(() => {
        handleClose();
        onSuccess();
    });

    const handleClose = () => {
        setNote('');
        setNoteError('');
        setFileBase64('');
        setFileFormat('');
        setFileName('');
        onCancel();
    };

    const handleNoteChange = (value: string) => {
        setNote(value);
        setNoteError(
            value.trim().length > 0 && value.trim().length < 3
                ? 'Note must be at least 3 characters'
                : ''
        );
    };

    const handleSubmit = async () => {
        if (!record || !fileBase64) return;
        const trimmedNote = note.trim();
        if (trimmedNote.length > 0 && trimmedNote.length < 3) {
            setNoteError('Note must be at least 3 characters');
            return;
        }
        await handleUpload(record.requestId, { document: fileBase64, documentFormat: fileFormat, note: trimmedNote || undefined });
    };

    return (
        <Modal
            open={open}
            title="Share Document"
            onCancel={handleClose}
            footer={
                <div className="flex justify-end gap-2">
                    <Button onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="primary" danger loading={isLoading} onClick={handleSubmit}>
                        Submit
                    </Button>
                </div>
            }
            width={480}
        >
            {record && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <Typography.Text className="text-sm text-gray-500">
                        Document Requested
                    </Typography.Text>
                    <Typography.Text className="block font-medium">
                        {record.documentType}
                    </Typography.Text>
                    {record.purpose && (
                        <>
                            <Typography.Text className="text-sm text-gray-500 mt-1 block">
                                {record.documentType === 'Others' ? 'Document Name' : 'Purpose'}
                            </Typography.Text>
                            <Typography.Text className="block font-medium">
                                {record.purpose}
                            </Typography.Text>
                        </>
                    )}
                    <Typography.Text className="text-sm text-gray-500 mt-1 block">
                        Employee
                    </Typography.Text>
                    <Typography.Text className="block font-medium">
                        {record.employeeName}
                    </Typography.Text>
                </div>
            )}

            <div className="mb-4">
                <Typography.Text className="block text-sm font-medium mb-2">
                    Upload Document
                </Typography.Text>
                <Upload.Dragger
                    name="file"
                    multiple={false}
                    maxCount={1}
                    showUploadList={false}
                    beforeUpload={file => {
                        if (file.size / 1_000_000 > MAX_MB) {
                            dispatch(
                                showToast({
                                    description: `File must be smaller than ${MAX_MB}MB.`,
                                    variant: 'error',
                                })
                            );
                            return Upload.LIST_IGNORE;
                        }
                        setFileName(file.name);
                        readFileAsBase64(file).then(({ base64, format }) => {
                            setFileBase64(base64);
                            setFileFormat(format);
                        });
                        return false;
                    }}
                    accept=".pdf,.doc,.docx,.jpg,.png"
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">
                        {fileName || 'Click or drag file to this area to upload'}
                    </p>
                    <p className="ant-upload-hint">
                        Supports PDF, DOC, DOCX, JPG, PNG — max {MAX_MB}MB
                    </p>
                </Upload.Dragger>
            </div>

            <Form.Item
                label={<span className="text-sm font-medium">Additional Note</span>}
                layout="vertical"
                colon={false}
                className="mb-6"
                validateStatus={noteError ? 'error' : ''}
                help={noteError || undefined}
            >
                <Input.TextArea
                    rows={3}
                    placeholder="Add a note..."
                    value={note}
                    onChange={e => handleNoteChange(e.target.value)}
                    maxLength={250}
                    showCount
                />
            </Form.Item>
        </Modal>
    );
};

export default ShareDocumentModal;
