import { SetStateAction, useEffect, useState } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { Upload, Button, Form, Typography, Flex } from 'antd';
import { RcFile } from 'antd/es/upload';
import { useFormikContext } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { getFileExtensionFromUrl } from '@src/utils/data';

type AllowedFileType =
    | 'image/jpeg'
    | 'image/png'
    | 'image/bmp'
    | 'image/gif'
    | 'application/pdf'
    | 'application/msword'
    | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    | 'application/vnd.ms-excel'
    | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

interface FileUploadInputProps {
    name: string;
    label?: string;
    setFile?: React.Dispatch<SetStateAction<any>>;
    format?: string;
    showNotification?: boolean;
    classes?: string;
    showFileName?: boolean;
    defaultFileName?: string;
    maxFileSize?: number;
    allowedFileTypes?: AllowedFileType[];
    isRequired?: boolean;
    descriptionText?: string | null;
    returnOriginalFile?: boolean;
}

const FileUploadInput = ({
    name,
    label,
    setFile,
    format,
    classes,
    showNotification = false,
    showFileName = false,
    defaultFileName = 'document',
    maxFileSize = 5120,
    isRequired,
    allowedFileTypes = ['image/jpeg', 'image/png'],
    descriptionText = null,
    returnOriginalFile = false,
}: FileUploadInputProps) => {
    const { setFieldValue, touched, errors, validateField, values } = useFormikContext<any>();
    const [fileName, setFileName] = useState(
        values[name] ? `${defaultFileName}.${getFileExtensionFromUrl(values[name])}` : ''
    );
    const dispatch = useAppDispatch();

    const beforeUpload = (file: RcFile) => {
        // const isJpegorPng = file.type === 'image/jpeg' || file.type === 'image/png';
        const isAllowedFileType = allowedFileTypes.includes(file.type as AllowedFileType);
        if (!isAllowedFileType) {
            const fileFormats = allowedFileTypes.map(type => {
                if (type === 'image/jpeg') {
                    return 'JPG or JPEG';
                }
                return type.split('/')[1].toUpperCase();
            });
            const allowedFormats = fileFormats.join(` or `);
            dispatch(
                showToast({
                    description: `Please upload  ${allowedFormats} file.`,
                    variant: 'error',
                })
            );
        }
        const isLtmaxFileSizeKB = file.size / 1024 <= maxFileSize;

        if (!isLtmaxFileSizeKB) {
            dispatch(
                showToast({
                    description: `File size must be smaller than ${maxFileSize % 1024 === 0 ? `${maxFileSize / 1024} MB` : `${maxFileSize} KB`}`,
                    variant: 'error',
                })
            );
        }
        // return isJpegorPng && isLtmaxFileSizeKB;
        return isAllowedFileType && isLtmaxFileSizeKB;
    };

    const setValue = ({ file, onSuccess }: any) => {
        if (file) {
            setFileName(file.name);
            if (returnOriginalFile) {
                setFieldValue(name, file);
            } else {
                const reader = new FileReader();
                reader.onload = () => {
                    if (typeof reader.result === 'string') {
                        if (setFile) setFile(reader.result);
                        setFieldValue(name, reader.result.split(',')[1]);
                        setFieldValue(format!, file.type.split('/')[1]);
                    }
                };
                reader.readAsDataURL(file);
            }
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
            label={label}
            required={isRequired}
            validateStatus={touched[name] && errors[name] ? 'error' : ''}
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
                    accept={allowedFileTypes.join(', ')}
                    multiple={false}
                    name={name}
                    maxCount={1}
                    listType="picture"
                    className="avatar-uploader custom-upload"
                    showUploadList={false}
                    beforeUpload={beforeUpload}
                    customRequest={setValue}
                >
                    <Button className={classes} size="small" icon={<UploadOutlined />}>
                        Click to Upload
                    </Button>
                    {descriptionText && (
                        <Typography.Text className="text-zinc-500 ml-2 mt-2">
                            {descriptionText}
                        </Typography.Text>
                    )}
                </Upload>
                {showFileName && fileName !== '' && (
                    <Typography.Text className="text-blue-500 ">{fileName}</Typography.Text>
                )}
            </Flex>
        </Form.Item>
    );
};

export default FileUploadInput;
