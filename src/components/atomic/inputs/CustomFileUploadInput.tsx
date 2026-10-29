import React, { useEffect, useState } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { Button, Upload, Form, Typography, Flex } from 'antd';
import { RcFile, UploadChangeParam, UploadFile } from 'antd/es/upload';
import { useFormikContext } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

const { Text } = Typography;

interface FileUploadInputProps {
    name: string;
    label: string;
    setFile?: React.Dispatch<React.SetStateAction<any>>;
    format?: string;
    showNotification?: boolean;
    classes?: string;
    showFileName?: boolean;
    maxFileSize?: number;
    existingFileUrl?: string;
    handleRemove?: (file: UploadFile) => boolean | void;
    fileOutputObject?: boolean;
    isRequired?: boolean;
}

const CustomFileUploadInput = ({
    name,
    label,
    setFile,
    format,
    classes,
    showNotification = false,
    showFileName = false,
    maxFileSize = 500, // Default max file size is 500KB
    existingFileUrl,
    handleRemove,
    fileOutputObject = false,
    isRequired = false,
}: FileUploadInputProps) => {
    const defaultFileList: UploadFile[] = existingFileUrl
        ? [
              {
                  uid: '1',
                  name: 'Image',
                  status: 'done',
                  url: existingFileUrl,
              },
          ]
        : [];
    const [fileList, setFileList] = useState<UploadFile[]>(defaultFileList);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [fileName, setFileName] = useState('');
    const [showFile, setShowFile] = useState(showFileName || !!existingFileUrl);
    const { setFieldValue, touched, errors } = useFormikContext<any>();
    const dispatch = useAppDispatch();

    const beforeUpload = (file: RcFile): boolean => {
        const isJpegorPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpegorPng) {
            dispatch(
                showToast({
                    description: 'Please upload JPEG or PNG file',
                    variant: 'error',
                })
            );
            setShowFile(false);
            return false;
        }
        const isLtmaxFileSizeKB = file.size / 1024 <= maxFileSize;
        if (!isLtmaxFileSizeKB) {
            dispatch(
                showToast({
                    description: `Image must be smaller than ${maxFileSize}KB!`,
                    variant: 'error',
                })
            );
            setShowFile(false);
            return false;
        }
        setShowFile(showFileName);
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
                    }
                };
                reader.readAsDataURL(updatedFileList[0].originFileObj as RcFile);
            }
            if (showNotification) {
                dispatch(
                    showToast({
                        description: `${info.file.status === 'removed' ? 'File removed successfully' : 'File updated successfully'}`,
                        variant: 'success',
                    })
                );
            }
        }
    };

    const customHandleChange = (info: UploadChangeParam): void => {
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
                        setFile(reader.result); // Set base64 representation of the image
                        setFieldValue(`${name}.imageBase`, reader.result.split(',')[1]); // Set image base64
                        setFieldValue(`${name}.imageFormat`, info?.file?.type?.split('/')[1]); // Set image type
                    }
                };
                reader.readAsDataURL(updatedFileList[0].originFileObj as RcFile);
            }
            if (showNotification) {
                dispatch(
                    showToast({ description: 'File updated successfully', variant: 'success' })
                );
            }
        }
    };

    const onRemove = (file: UploadFile): boolean | void => {
        dispatch(
            showToast({
                description: `File removed successfully`,
                variant: 'success',
            })
        );
        if (handleRemove) {
            return handleRemove(file);
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
        if (existingFileUrl) {
            setFileList([
                {
                    uid: '1', // Update the identifier if necessary
                    name: 'Existing file',
                    status: 'done',
                    url: existingFileUrl,
                },
            ]);
        }
    }, [existingFileUrl]);

    return (
        <Form.Item
            name={name}
            label={label}
            required={isRequired}
            help={
                touched[name] && errors[name] ? (
                    <Text className="text-sm font-normal text-red-500 ">
                        {errors[name] as string}
                    </Text>
                ) : undefined
            }
        >
            <Flex vertical gap={4}>
                <Upload
                    multiple={false}
                    name={name}
                    maxCount={1}
                    className={`avatar-uploader ${classes}`}
                    showUploadList={showFile}
                    beforeUpload={beforeUpload}
                    onChange={fileOutputObject ? customHandleChange : handleChange}
                    defaultFileList={fileList}
                    onRemove={onRemove}
                    customRequest={setValue}
                >
                    <Button size="small" className="w-full" icon={<UploadOutlined />}>
                        Click to Upload
                    </Button>
                </Upload>
            </Flex>
        </Form.Item>
    );
};

export default CustomFileUploadInput;
