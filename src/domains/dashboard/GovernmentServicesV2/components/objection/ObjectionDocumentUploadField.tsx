import { useRef } from 'react';

import { CheckCircleFilled, CloseCircleOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';

const { Text } = Typography;

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const UPLOAD_ACCEPT = '.pdf,.jpg,.jpeg,.png';

interface ObjectionDocumentUploadFieldProps {
    label: string;
    required?: boolean;
    fileName?: string;
    isUploading?: boolean;
    error?: string;
    onFileSelect: (file: File) => void;
    onRemove: () => void;
}

// Same "Browse File" / filename-chip design as BusinessRegistration's FileUploadField (Figma
// 1819:22349) — kept as its own copy here rather than importing across domains (that component is
// also tied to Formik's useField + BusinessRegistration's own useDocAutoUpload vendor-upload hook,
// neither of which applies here; the actual vendor upload call for Objection lives in
// TrademarkObjectionForm.tsx's handleFileSelect instead, same Service Document endpoint Trademark
// Registration's Logo Upload uses).
const ObjectionDocumentUploadField = ({
    label,
    required,
    fileName,
    isUploading,
    error,
    onFileSelect,
    onRemove,
}: ObjectionDocumentUploadFieldProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handlePick = (file?: File) => {
        if (!file) return;
        if (file.size > MAX_FILE_BYTES) return;
        onFileSelect(file);
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
                onChange={(e) => {
                    handlePick(e.target.files?.[0]);
                    e.target.value = '';
                }}
            />
            {fileName ? (
                <div className="border border-dashed rounded-[8px] h-[40px] px-3 flex items-center gap-2 border-[#ff4f4f]">
                    <FilePdfOutlined className="text-[#ff4f4f]" />
                    <Text className="!text-[14px] !text-[#1e293b] flex-1 truncate">{fileName}</Text>
                    <CheckCircleFilled style={{ color: '#22c55e' }} />
                    <CloseCircleOutlined className="text-[#94a3b8] cursor-pointer" onClick={onRemove} />
                </div>
            ) : (
                <div
                    className={`border rounded-[8px] h-[40px] pl-3 pr-1 flex items-center justify-between ${
                        error ? 'border-[#ff4d4f]' : 'border-[#d9d9d9]'
                    }`}
                >
                    <Text className="!text-[14px] !text-[#ababab] truncate">
                        {isUploading ? 'Uploading…' : 'Upload File'}
                    </Text>
                    <Button
                        size="small"
                        loading={isUploading}
                        disabled={isUploading}
                        onClick={() => inputRef.current?.click()}
                        className="!text-[13px] !border-[#d9d9d9] !text-[#475569] !rounded-[6px]"
                    >
                        Browse File
                    </Button>
                </div>
            )}
            {error && <Text className="!text-[13px] !text-[#ff4d4f]">{error}</Text>}
        </div>
    );
};

export default ObjectionDocumentUploadField;
