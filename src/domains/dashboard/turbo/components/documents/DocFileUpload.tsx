import React, { useEffect, useState } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { Button, Upload, Form, Typography, Flex } from 'antd';
import { RcFile, UploadChangeParam, UploadFile } from 'antd/es/upload';
import { useFormikContext } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

interface FileUploadInputProps {
    name: string;
    label: string;
    setFile?: React.Dispatch<React.SetStateAction<any>>;
    setFileName?: React.Dispatch<React.SetStateAction<string>>; // Add setFileName prop
    format?: string;
    showNotification?: boolean;
    classes?: string;
    showFileName?: boolean;
    maxFileSize?: number;
    existingFileUrl?: string;
    handleRemove?: (file: UploadFile) => boolean | void;
    fileOutputObject?: boolean;
    isRequired?: boolean;
    handleImageChange?: (file: RcFile) => void;
    isImageCrop?: boolean;
    accept?:string;
    labelHidden?: boolean;
}

const DocFileUpload = ({
    name,
    label,
    setFile,
    setFileName, // Accept setFileName prop
    format,
    classes,
    showNotification = false,
    showFileName = false,
    maxFileSize = 5120, // Default max file size is 500KB
    existingFileUrl,
    handleRemove,
    fileOutputObject = false,
    isRequired = false,
    handleImageChange,
    isImageCrop = false,
    accept,
    labelHidden = false
}: FileUploadInputProps) => {
    const defaultFileList: UploadFile[] = existingFileUrl
        ? [
              {
                  uid: '1',
                  name: 'Existing file',
                  status: 'done',
                  url: existingFileUrl,
              },
          ]
        : [];
    const [fileList, setFileList] = useState<UploadFile[]>(defaultFileList);
const { setFieldValue, touched, errors } = useFormikContext<any>();
    const dispatch = useAppDispatch();

    const beforeUpload = (file: RcFile): boolean => {
        const isJpegorPng =
            file.type === 'application/pdf' ||
            file.type === 'image/jpeg' ||
            file.type === 'image/png';
        if (!isJpegorPng) {
            dispatch(
                showToast({
                    description: 'Please upload a JPG, JPEG, PNG, or PDF file.',
                    variant: 'error',
                })
            );
            return false;
        }
        const isLtmaxFileSizeKB = file.size / 1024 <= maxFileSize;
        if (!isLtmaxFileSizeKB) {
            dispatch(
                showToast({
                    description: `File must be smaller than 5 MB`,
                    variant: 'error',
                })
            );
            return false;
        }
        return true;
    };

    const handleChange = (info: UploadChangeParam): void => {
        let updatedFileList = [...info.fileList];
        updatedFileList = updatedFileList.slice(-1);

        setFileList(updatedFileList);
        if (info.file.status === 'done' || info.file.status === 'removed') {
            setFieldValue(
                name,
                updatedFileList.length > 0 ? updatedFileList[0].originFileObj : null
            );
            if (updatedFileList.length > 0 && setFile && updatedFileList[0].originFileObj) {
                const reader = new FileReader();
                reader.onload = () => {
                    if (typeof reader.result === 'string') {
                        setFile(reader.result);
                        if (setFileName) setFileName(updatedFileList[0].name); // Update filename in parent
                    }
                };
                reader.readAsDataURL(updatedFileList[0].originFileObj as RcFile);
            }
        }
    };

    useEffect(() => {
        if (existingFileUrl) {
            setFileList([
                {
                    uid: '1', // Update the identifier if necessary
                    name: 'Existing file',
                    status: 'done',
                    url: existingFileUrl,
                },
            ]);
            
            if (setFileName) setFileName(label || 'Existing File'); // Update the parent component state
        }
    }, [existingFileUrl, setFileName, label]);

    return (
        <Form.Item
            name={name}
            label={labelHidden ? '' : label}
            required={isRequired}
            help={
                touched[name] && errors[name] ? (
                    <Typography.Text className="text-sm font-normal text-red-500 ">
                        {errors[name] as string}
                    </Typography.Text>
                ) : undefined
            }
        >
            <Flex vertical gap={4}>
                <Upload
                    multiple={false}
                    name={name}
                    maxCount={1}
                    className={`avatar-uploader truncate ${classes}`}
                    showUploadList={false}
                    beforeUpload={beforeUpload}
                    onChange={handleChange}
                    accept={accept}
                    defaultFileList={fileList}
                    customRequest={({ file, onSuccess }: any) => {
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                    if (setFile) setFile(reader.result); // ✅ Add this check
                                    setFieldValue(name, reader.result.split(',')[1]);
                                    setFieldValue(format!, file.type.split('/')[1]);
                                }
                            };
                            reader.readAsDataURL(file);
                            onSuccess('ok');
                        }
                    }}
                >
                    <Button
                        size="small"
                        className="h-8 xxl:w-40 xs:w-full"
                        icon={<UploadOutlined />}
                    >
                        Click to Upload
                    </Button>
                </Upload>
            </Flex>
        </Form.Item>
    );
};

export default DocFileUpload;
