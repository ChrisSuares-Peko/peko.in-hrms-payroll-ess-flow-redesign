import React, { useEffect, useState } from 'react';

import {  PlusOutlined,DeleteOutlined } from '@ant-design/icons';
import { Upload, Form, Typography } from 'antd';
import { RcFile } from 'antd/es/upload';
import { useFormikContext } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

interface FileUploaderProps {
    name: string;
    label?: string;
    setFile?: React.Dispatch<React.SetStateAction<any>>;
    format?: string;
    showNotification?: boolean;
    classes?: string;
    showFileName?: boolean;
    maxFileSize?: number;
    allowedFileTypes?: string[];
    isRequired?: boolean;
    initialImageUrl?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
    name,
    label,
    setFile,
    format,
    classes,
    showNotification = false,
    showFileName = false,
    maxFileSize = 200,
    isRequired,
    allowedFileTypes = ['image/jpeg', 'image/png'],
    initialImageUrl,
}) => {
    const [fileName, setFileName] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
    const { setFieldValue, touched, errors, validateField } = useFormikContext<any>();
    const dispatch = useAppDispatch();

    useEffect(() => {
        setImageUrl(initialImageUrl || null);
    }, [initialImageUrl]);

    const beforeUpload = (file: RcFile) => {
        const isAllowedFileType = allowedFileTypes.includes(file.type);
        if (!isAllowedFileType) {
            const fileFormats = allowedFileTypes.map(type => type.split('/')[1].toUpperCase());
            let allowedFormats = '';
            if (fileFormats.length === 1) {
                allowedFormats = fileFormats[0];
            } else if (fileFormats.length === 2) {
                allowedFormats = fileFormats.join(' or ');
            } else {
                // For 3 or more formats
                allowedFormats = `${fileFormats.slice(0, -1).join(', ')}, or ${fileFormats[fileFormats.length - 1]}`;
            }
            dispatch(
                showToast({
                    description: `Please upload file in ${allowedFormats} format.`,
                    variant: 'error',
                })
            );
            return false;
        }
        const isLtMaxFileSizeKB = file.size / 1024 <= maxFileSize;
        if (!isLtMaxFileSizeKB) {
            dispatch(
                showToast({
                    description: `File size should be smaller than ${maxFileSize} KB`,
                    variant: 'error',
                })
            );
            return false;
        }
        return true;
    };

    const setValue = ({ file, onSuccess }: any) => {
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    if (setFile) setFile(reader.result);
                    setImageUrl(reader.result); // Set the image URL for preview
                    setFieldValue(name, reader.result.split(',')[1]);
                    setFieldValue(format!, file.type.split('/')[1]);
                }
            };
            reader.readAsDataURL(file);
            if (showNotification) {
                dispatch(
                    showToast({
                        description: 'File uploaded successfully',
                        variant: 'success',
                    })
                );
            }
            onSuccess('ok');
        }
    };

    useEffect(() => {
        if (errors[name]) {
            validateField(name);
        }
    }, [errors, name, validateField]);

    return (
        <Form.Item
            name={name}
            label={<Typography.Text>{label}</Typography.Text>}
            required={isRequired}
            validateStatus={touched[name] && errors[name] ? 'error' : ''}
            help={
                touched[name] && errors[name] ? (
                    <Typography.Text className="text-sm font-normal text-red-500">
                        {errors[name] as string}
                    </Typography.Text>
                ) : undefined
            }
        >
            {showFileName && fileName !== '' && (
                <Typography.Text className="text-blue-500">{fileName}</Typography.Text>
            )}
            <Upload
                multiple={false}
                name={name}
                maxCount={1}
                listType="picture-card"
                className="avatar-uploader"
                showUploadList={false}
                beforeUpload={beforeUpload}
                customRequest={setValue}
                style={{
                    width: '104px',
                    height: '104px',
                    border: '1px dashed #d9d9d9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                }}
            >
                {imageUrl ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%',overflow: 'hidden' }}>
                        {/* A plain <img>, not antd's Image, so the width/height/objectFit
                        below apply to the actual rendered element — Image's style prop lands
                        on its wrapper span, leaving the inner <img> at its natural aspect
                        ratio and unfilled space below it whenever that ratio isn't square.
                        preview={false} already meant Image's own zoom feature was unused. */}
                        <img
                            src={imageUrl}
                            alt="Uploaded preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', display: 'block' }}
                        />
                        <button
                            type="button"
                            onClick={e => {
                                e.stopPropagation();
                                setImageUrl('');
                                setFileName('');
                                setFieldValue(name, '');
                                if (format) setFieldValue(format, '');
                                if (setFile) setFile('');
                            }}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                background: 'rgba(255,255,255,0.85)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                cursor: 'pointer',
                                zIndex: 2,
                            }}
                            aria-label="Delete"
                        >
                            <DeleteOutlined style={{color:"red"}}/>
                        </button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <PlusOutlined style={{ fontSize: '24px', color: '#999' }} />
                        <div style={{ marginTop: 8, color: '#666' }}>Upload</div>
                    </div>
                )}
            </Upload>
        </Form.Item>
    );
};

export default FileUploader;
