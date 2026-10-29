import { useRef } from 'react';

import { CheckCircleFilled, CloseCircleOutlined, FilePdfOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';
import { useField } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import FieldError from './FieldError';
import { useDocAutoUpload } from '../hooks/useDocAutoUpload';
import { UPLOAD_ACCEPT } from '../utils/proprietorDocuments';

const { Text } = Typography;

const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Value stored in Formik for an uploaded file: name for display + raw base64
// content for the vendor KYC upload (data-URL prefix stripped).
export interface UploadedFile {
    name: string;
    base64: string;
}

const readAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });

interface FileUploadFieldProps {
    name: string;
    label: string;
    required?: boolean;
    // Empty-state placeholder (e.g. accepted formats / size). Defaults to "Upload File".
    hint?: string;
}

// Upload field matching the design (Figma 1819:22349): a "Browse File" control
// that switches to a filename + remove chip once a file is picked. Stores the
// file content (base64, ≤5 MB) so the submit chain can upload it to the vendor.
const FileUploadField = ({ name, label, required, hint }: FileUploadFieldProps) => {
    const [field, , helpers] = useField(name);
    const dispatch = useAppDispatch();
    const inputRef = useRef<HTMLInputElement>(null);
    const { status, error, upload, setStatus } = useDocAutoUpload(name);
    const value = field.value as UploadedFile | string | undefined;
    const fileName = typeof value === 'string' ? value : value?.name;
    // A filename string (base64 dropped) means it's already uploaded — show the
    // tick even after a remount/refresh when `status` has reset to idle.
    const uploaded = typeof value === 'string' && Boolean(value);

    const handlePick = async (file?: File) => {
        if (!file) return;
        if (file.size > MAX_FILE_BYTES) {
            dispatch(showToast({ description: 'File must be 10 MB or smaller', variant: 'error' }));
            return;
        }
        try {
            const base64 = await readAsBase64(file);
            // Uploads to the vendor immediately (on the go), then drops the base64.
            await upload({ name: file.name, base64 });
        } catch {
            dispatch(showToast({ description: 'Could not read the selected file', variant: 'error' }));
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <Text className="!text-[14px] !text-[rgba(0,0,0,0.85)] !leading-[22px]">
                {label}
                {required && <span className="text-[#ff4f4f]"> *</span>}
            </Text>
            <input
                ref={inputRef}
                type="file"
                accept={UPLOAD_ACCEPT}
                className="hidden"
                onChange={e => {
                    handlePick(e.target.files?.[0]);
                    e.target.value = '';
                }}
            />
            {fileName ? (
                <div
                    className={`border border-dashed rounded-[8px] h-[40px] px-3 flex items-center gap-2 ${
                        status === 'error' ? 'border-[#ef4444]' : 'border-[#ff4f4f]'
                    }`}
                >
                    {status === 'uploading' ? (
                        <LoadingOutlined className="text-[#ff4f4f]" />
                    ) : (
                        <FilePdfOutlined className="text-[#ff4f4f]" />
                    )}
                    <Text className="!text-[14px] !text-[#1e293b] flex-1 truncate">{fileName}</Text>
                    {status === 'uploading' && <Text className="!text-[12px] !text-[#94a3b8]">Uploading…</Text>}
                    {uploaded && <CheckCircleFilled style={{ color: '#22c55e' }} />}
                    {status !== 'uploading' && (
                        <CloseCircleOutlined
                            className="text-[#94a3b8] cursor-pointer"
                            onClick={() => {
                                helpers.setValue('');
                                setStatus('idle');
                            }}
                        />
                    )}
                </div>
            ) : (
                <div className="border border-[#d9d9d9] rounded-[8px] h-[40px] pl-3 pr-1 flex items-center justify-between">
                    <Text className="!text-[14px] !text-[#ababab] truncate">{hint ?? 'Upload File'}</Text>
                    <Button
                        size="small"
                        onClick={() => inputRef.current?.click()}
                        className="!text-[13px] !border-[#d9d9d9] !text-[#475569] !rounded-[6px]"
                    >
                        Browse File
                    </Button>
                </div>
            )}
            {status === 'error' && error && (
                <Text data-form-error="true" className="!text-[13px] !text-[#ff4d4f]">
                    {error}
                </Text>
            )}
            <FieldError name={name} />
        </div>
    );
};

export default FileUploadField;
