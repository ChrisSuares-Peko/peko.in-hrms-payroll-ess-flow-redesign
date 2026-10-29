import React, { useState } from 'react';

import { CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Flex, Typography, Upload } from 'antd';
import { RcFile } from 'antd/es/upload';
import { useFormikContext } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { ALLOWED_DOC_TYPES, AllowedDocType } from '../../utils/complianceDetail';

const { Text } = Typography;

interface UploadedFile {
    name: string;
    base64: string;
}

interface MultiDocUploadFieldProps {
    name: string;
    label: string;
    multiple?: boolean;
}

const MultiDocUploadField: React.FC<MultiDocUploadFieldProps> = ({ name, label, multiple = false }) => {
    const { setFieldValue } = useFormikContext<Record<string, string | UploadedFile[]>>();
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const dispatch = useAppDispatch();

    const beforeUpload = (file: RcFile) => {
        const isAllowed = ALLOWED_DOC_TYPES.includes(file.type as AllowedDocType);
        const isSize = file.size / 1024 <= 5120;
        if (!isAllowed) dispatch(showToast({ description: 'Please upload a PDF, JPG, or PNG file.', variant: 'error' }));
        if (!isSize) dispatch(showToast({ description: 'File size must be smaller than 5 MB.', variant: 'error' }));
        return isAllowed && isSize;
    };

    const handleUpload = ({ file, onSuccess }: any) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                const base64 = reader.result.split(',')[1];
                const newFile: UploadedFile = { name: (file as RcFile).name, base64 };
                const updated = multiple ? [...files, newFile] : [newFile];
                setFiles(updated);
                setFieldValue(name, multiple ? JSON.stringify(updated) : base64);
            }
        };
        reader.readAsDataURL(file);
        onSuccess('ok');
    };

    const handleRemove = (index: number) => {
        const updated = files.filter((_, i) => i !== index);
        setFiles(updated);
        setFieldValue(name, multiple ? JSON.stringify(updated) : '');
    };

    return (
        <Flex vertical gap={8}>
            <Text style={{ fontSize: 14, color: '#314259' }}>{label}</Text>

            {files.map((f, i) => (
                <Flex
                    key={i}
                    align="center"
                    justify="space-between"
                    className="border-[0.927px] border-dashed border-[#cbd0dc] rounded-[11px] px-4 h-[51px]"
                >
                    <Flex align="center" gap={10} className="flex-1 min-w-0">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
                            <rect width="28" height="28" rx="4" fill="#fff1f1" />
                            <text x="4" y="20" fontSize="9" fontWeight="700" fill="#ff4f4f">FILE</text>
                        </svg>
                        <Text className="!text-[14px] !font-medium !text-[#292d32] truncate">{f.name}</Text>
                    </Flex>
                    <button
                        type="button"
                        onClick={() => handleRemove(i)}
                        className="shrink-0 text-[#8c8c8c] hover:text-[#ff4f4f] transition-colors ml-3"
                    >
                        <CloseCircleOutlined style={{ fontSize: 16 }} />
                    </button>
                </Flex>
            ))}

            {(multiple || files.length === 0) && (
                <Upload
                    accept=".pdf,.jpg,.jpeg,.png"
                    showUploadList={false}
                    maxCount={multiple ? undefined : 1}
                    beforeUpload={beforeUpload}
                    customRequest={handleUpload}
                    className="!block w-full [&_.ant-upload]:!block [&_.ant-upload]:!w-full"
                >
                    <Flex
                        align="center"
                        justify="space-between"
                        className="border-[0.927px] border-dashed border-[#cbd0dc] rounded-[11px] px-4 h-[51px] cursor-pointer hover:border-[#ff4f4f] transition-colors w-full"
                    >
                        <Text className="!text-[14px] !font-medium !text-[#8c8c8c]">
                            {multiple && files.length > 0 ? 'Add another file' : 'Upload PDF, JPG, PNG (Max 5 MB)'}
                        </Text>
                        <span className="shrink-0 border-[0.867px] border-solid border-[#cbd0dc] rounded-[8px] px-3 py-[5px] text-[14px] font-medium text-[#54575c] bg-white flex items-center gap-1">
                            {multiple && files.length > 0 ? <PlusOutlined style={{ fontSize: 12 }} /> : null}
                            Browse
                        </span>
                    </Flex>
                </Upload>
            )}
        </Flex>
    );
};

export default MultiDocUploadField;
