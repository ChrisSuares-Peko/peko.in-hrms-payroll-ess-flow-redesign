import { useState, useEffect } from 'react';

import { CloseCircleOutlined } from '@ant-design/icons';
import { Flex, Typography, Upload } from 'antd';
import { RcFile } from 'antd/es/upload';
import { useFormikContext } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { ALLOWED_DOC_TYPES, AllowedDocType } from '../../utils/complianceDetail';

const { Text } = Typography;

interface DocUploadFieldProps {
    name: string;
    label: string;
    required?: boolean;
}

export interface DocFieldValue {
    base64: string;
    name: string;
    mimeType: string;
}

export default function DocUploadField({ name, label, required }: DocUploadFieldProps) {
    const { setFieldValue, values, errors, submitCount } = useFormikContext<Record<string, DocFieldValue | ''>>();
    const existing = values[name];
    const [fileName, setFileName] = useState(existing && typeof existing === 'object' ? existing.name : '');
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (existing && typeof existing === 'object') {
            setFileName(existing.name);
        } else {
            setFileName('');
        }
    }, [name, existing]);

    const beforeUpload = (file: RcFile) => {
        const isAllowed = ALLOWED_DOC_TYPES.includes(file.type as AllowedDocType);
        const isSize = file.size / 1024 <= 5120;
        if (!isAllowed)
            dispatch(showToast({ description: 'Please upload a PDF, JPG, or PNG file.', variant: 'error' }));
        if (!isSize)
            dispatch(showToast({ description: 'File size must be smaller than 5 MB.', variant: 'error' }));
        return isAllowed && isSize;
    };

    const handleUpload = ({ file, onSuccess }: any) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                const rcFile = file as RcFile;
                setFieldValue(name, {
                    base64: reader.result.split(',')[1],
                    name: rcFile.name,
                    mimeType: rcFile.type,
                });
                setFileName(rcFile.name);
            }
        };
        reader.readAsDataURL(file);
        onSuccess('ok');
    };

    const handleRemove = () => {
        setFileName('');
        setFieldValue(name, '');
    };

    const fieldError = submitCount > 0 ? (errors[name] as string | undefined) : undefined;

    return (
        <Flex vertical gap={12}>
            <Text style={{ fontSize: 14, color: '#314259' }}>
                {label}
                {required && <span style={{ color: '#ff4f4f', marginLeft: 2 }}>*</span>}
            </Text>

            {fileName ? (
                <Flex
                    align="center"
                    justify="space-between"
                    className="border-[0.927px] border-dashed border-[#cbd0dc] rounded-[11px] px-4 h-[51px]"
                >
                    <Flex align="center" gap={10} className="flex-1 min-w-0">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
                            <rect width="28" height="28" rx="4" fill="#fff1f1" />
                            <text x="4" y="20" fontSize="9" fontWeight="700" fill="#ff4f4f">PDF</text>
                        </svg>
                        <Text className="!text-[14px] !font-medium !text-[#292d32] truncate">{fileName}</Text>
                    </Flex>
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="shrink-0 text-[#8c8c8c] hover:text-[#ff4f4f] transition-colors ml-3"
                    >
                        <CloseCircleOutlined style={{ fontSize: 16 }} />
                    </button>
                </Flex>
            ) : (
                <Upload
                    accept=".pdf,.jpg,.jpeg,.png"
                    showUploadList={false}
                    maxCount={1}
                    beforeUpload={beforeUpload}
                    customRequest={handleUpload}
                    className="!block w-full [&_.ant-upload]:!block [&_.ant-upload]:!w-full"
                >
                    <Flex
                        align="center"
                        justify="space-between"
                        wrap="wrap"
                        gap={8}
                        className="border-[0.927px] border-dashed border-[#cbd0dc] rounded-[11px] px-4 py-3 min-h-[51px] cursor-pointer hover:border-[#ff4f4f] transition-colors w-full"
                    >
                        <Text className="!text-[13px] !font-medium !text-[#8c8c8c]">
                            <span className="hidden sm:inline">Upload PDF, JPG, PNG File (Max 5 MB)</span>
                            <span className="sm:hidden">PDF, JPG, PNG · Max 5 MB</span>
                        </Text>
                        <span className="shrink-0 border-[0.867px] border-solid border-[#cbd0dc] rounded-[8px] px-3 py-[5px] text-[14px] font-medium text-[#54575c] bg-white">
                            Browse File
                        </span>
                    </Flex>
                </Upload>
            )}
            {fieldError && (
                <Text style={{ fontSize: 12, color: '#ff4f4f' }}>{fieldError}</Text>
            )}
        </Flex>
    );
}
