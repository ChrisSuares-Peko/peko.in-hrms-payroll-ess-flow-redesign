import React, { useEffect, useState } from 'react';

import { CheckCircleFilled, CloseCircleFilled, EyeOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Image, Typography, Upload } from 'antd';
import type { RcFile } from 'antd/es/upload';
import { useFormikContext } from 'formik';

interface FileUploadFieldProps {
    label: string;
    subtitle?: string;
    fieldName: string;
    uploadLabel: string;
    allowedTypes: string[];
    acceptedTypesLabel: string;
    accept: string;
    maxFileSizeMB?: number;
    existingUrl?: string | null;
    displayName?: string;
    removeFieldName?: string;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
    label,
    subtitle,
    fieldName,
    uploadLabel,
    allowedTypes,
    acceptedTypesLabel,
    accept,
    maxFileSizeMB,
    existingUrl,
    displayName,
    removeFieldName,
}) => {
    const { setFieldValue } = useFormikContext();
    const hasNewFile = React.useRef(false);

    const getDisplayName = (url: string) => {
        const cleanUrl = url.split('?')[0];
        if (!displayName) return cleanUrl.split('/').pop() ?? 'Existing file';
        const urlExt = cleanUrl.split('.').pop();
        const baseName = displayName.replace(/\.[^/.]+$/, '');
        return urlExt ? `${baseName}.${urlExt}` : displayName;
    };

    const [selectedFile, setSelectedFile] = useState<string | null>(
        existingUrl ? getDisplayName(existingUrl) : null
    );
    const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl ?? null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (existingUrl && !hasNewFile.current) {
            setSelectedFile(getDisplayName(existingUrl));
            setPreviewUrl(existingUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existingUrl]);

    const handleBeforeUpload = (file: RcFile) => {
        if (!allowedTypes.includes(file.type)) {
            setError(`Only ${acceptedTypesLabel} files are allowed`);
            setSelectedFile(null);
            setPreviewUrl(null);
            setFieldValue(fieldName, null);
            return Upload.LIST_IGNORE;
        }
        if (maxFileSizeMB && file.size > maxFileSizeMB * 1024 * 1024) {
            setError(`File size must not exceed ${maxFileSizeMB} MB`);
            setSelectedFile(null);
            setPreviewUrl(null);
            setFieldValue(fieldName, null);
            return Upload.LIST_IGNORE;
        }
        setError(null);
        hasNewFile.current = true;
        if (displayName) {
            const ext = file.name.split('.').pop();
            const baseName = displayName.replace(/\.[^/.]+$/, '');
            setSelectedFile(ext ? `${baseName}.${ext}` : displayName);
        } else {
            setSelectedFile(file.name);
        }
        setPreviewUrl(URL.createObjectURL(file));
        setFieldValue(fieldName, file);
        if (removeFieldName) setFieldValue(removeFieldName, false);
        return false;
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        const wasExisting = !hasNewFile.current && !!existingUrl;
        hasNewFile.current = false;
        setSelectedFile(null);
        setPreviewUrl(null);
        setError(null);
        setFieldValue(fieldName, null);
        if (removeFieldName && wasExisting) setFieldValue(removeFieldName, true);
    };

    const handlePreview = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewVisible(true);
    };

    let uploadBorderClass = 'border-[#D0D5DD] hover:border-[#A1A1AA]';
    if (error) uploadBorderClass = 'border-red-400 bg-red-50';
    else if (selectedFile) uploadBorderClass = 'border-green-400 bg-green-50';

    return (
        <Form.Item
            label={
                <Flex vertical gap={2}>
                    <Typography.Text className="text-sm text-[#344054] font-medium">
                        {label}
                    </Typography.Text>
                    {subtitle && (
                        <Typography.Text className="text-xs text-[#6A7282] font-normal">
                            {subtitle}
                        </Typography.Text>
                    )}
                </Flex>
            }
            validateStatus={error ? 'error' : ''}
            help={
                error && <Typography.Text className="text-xs text-red-500">{error}</Typography.Text>
            }
        >
            <Upload
                beforeUpload={handleBeforeUpload}
                showUploadList={false}
                maxCount={1}
                accept={accept}
                style={{ display: 'block', width: '100%' }}
            >
                <Flex
                    justify="space-between"
                    align="center"
                    className={`border border-dashed rounded-lg px-4 py-3 cursor-pointer transition-colors ${uploadBorderClass}`}
                >
                    {selectedFile ? (
                        <>
                            <Flex align="center" gap={8}>
                                <CheckCircleFilled className="text-green-500 text-base" />
                                <Flex vertical gap={1}>
                                    <Typography.Text
                                        className="text-sm text-[#344054] max-w-[200px]"
                                        ellipsis={{ tooltip: selectedFile }}
                                    >
                                        {selectedFile}
                                    </Typography.Text>
                                    <Typography.Text className="text-xs text-[#A1A1AA]">
                                        Click to replace
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                            <Flex gap={8} onClick={e => e.stopPropagation()}>
                                {previewUrl && (
                                    <EyeOutlined
                                        className="text-[#A1A1AA] hover:text-blue-500 text-base"
                                        onClick={handlePreview}
                                    />
                                )}
                                <CloseCircleFilled
                                    className="text-[#A1A1AA] hover:text-red-500 text-base"
                                    onClick={handleRemove}
                                />
                            </Flex>
                        </>
                    ) : (
                        <>
                            <Flex vertical gap={2}>
                                <Typography.Text className="text-sm text-[#344054]">
                                    {uploadLabel}
                                </Typography.Text>
                                <Typography.Text className="text-xs text-[#A1A1AA]">
                                    {acceptedTypesLabel}
                                    {maxFileSizeMB ? ` - Max ${maxFileSizeMB} MB` : ''}
                                </Typography.Text>
                            </Flex>
                            <Button size="small" className="text-xs px-3">
                                Browse files
                            </Button>
                        </>
                    )}
                </Flex>
            </Upload>

            {previewUrl && (
                <Image
                    src={previewUrl}
                    style={{ display: 'none' }}
                    preview={{
                        visible: previewVisible,
                        onVisibleChange: setPreviewVisible,
                        src: previewUrl,
                    }}
                />
            )}
        </Form.Item>
    );
};

export default React.memo(FileUploadField);
