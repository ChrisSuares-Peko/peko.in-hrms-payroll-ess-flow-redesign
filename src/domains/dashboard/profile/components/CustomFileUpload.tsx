import { SetStateAction, useEffect, useState } from 'react';

import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { Upload, Button, Form, Typography, Flex } from 'antd';
import { RcFile } from 'antd/es/upload';
import { useFormikContext } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

const { Text } = Typography;

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
    subLabel?: string;
    setFile?: React.Dispatch<SetStateAction<any>>;
    format?: string;
    showNotification?: boolean;
    classes?: string;
    showFileName?: boolean;
    allowFileDelete?: boolean;
    defaultFileName?: string;
    maxFileSize?: number;
    allowedFileTypes?: AllowedFileType[];
    isRequired?: boolean;
    descriptionText?: string | null;
    returnOriginalFile?: boolean;
}

const CustomFileUpload = ({
    name,
    label,
    subLabel,
    setFile,
    format,
    classes,
    showNotification = false,
    showFileName = false,
    allowFileDelete = false,
    defaultFileName = 'document',
    maxFileSize = 2000,
    isRequired,
    allowedFileTypes = ['image/jpeg', 'image/png'],
    descriptionText = null,
    returnOriginalFile = false,
}: FileUploadInputProps) => {
    const { setFieldValue, touched, errors, validateField, values, setFieldTouched } =
        useFormikContext<any>();
    const [fileName, setFileName] = useState('');
    const dispatch = useAppDispatch();

    const beforeUpload = (file: RcFile) => {
        const isAllowedFileType = allowedFileTypes.includes(file.type as AllowedFileType);

        if (!isAllowedFileType) {
            const fileFormats = allowedFileTypes.map(type =>
                type === 'image/jpeg' ? 'JPG, JPEG' : type.split('/')[1].toUpperCase()
            );
            const allowedFormats = fileFormats.join(', ').replace(/,([^,]*)$/, ', or$1');
            dispatch(
                showToast({
                    description: `Please upload ${allowedFormats} file.`,
                    variant: 'error',
                })
            );
        }

        const isNonZeroFileSize = file.size > 0;
        if (!isNonZeroFileSize) {
            dispatch(
                showToast({ description: 'File size must be greater than 0 KB.', variant: 'error' })
            );
        }

        const isLtmaxFileSizeKB = file.size / 1024 <= maxFileSize;
        if (!isLtmaxFileSizeKB) {
            dispatch(
                showToast({
                    description: `File size must be smaller than ${
                        maxFileSize % 1024 === 0 ? `${maxFileSize / 1024} MB` : `${maxFileSize} KB`
                    }`,
                    variant: 'error',
                })
            );
        }

        return isAllowedFileType && isLtmaxFileSizeKB && isNonZeroFileSize;
    };

    const setValue = ({ file, onSuccess }: any) => {
        if (file) {
            // ✅ Use uploaded file's actual name
            setFileName(file.name);

            if (returnOriginalFile) {
                setFieldValue(name, file);
                setFieldTouched(name, true);
            } else {
                const reader = new FileReader();
                reader.onload = () => {
                    if (typeof reader.result === 'string') {
                        if (setFile) setFile(reader.result);
                        setFieldValue(name, reader.result.split(',')[1]);
                        if (format) {
                            setFieldValue(format, file.type.split('/')[1]);
                        }
                        setFieldTouched(name, true);
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

    const handleDeleteFile = () => {
        setFileName('');
        setFieldValue(name, null);
        if (format) setFieldValue(format, undefined);
        if (setFile) setFile(null);
        if (showNotification) {
            dispatch(
                showToast({
                    description: 'File deleted successfully',
                    variant: 'success',
                })
            );
        }
    };

    // ✅ Sync filename from Formik values (e.g. on resetForm)
    useEffect(() => {
        const extension = values[format || ''];
        if (values[name] && !fileName) {
            const fallback = extension ? `${defaultFileName}.${extension}` : defaultFileName;
            setFileName(fallback);
        }
        if (!values[name]) {
            setFileName('');
        }
    }, [defaultFileName, fileName, format, name, values]);

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
                    <Text className="text-sm font-normal text-red-500 ">
                        {errors[name] as string}
                    </Text>
                ) : undefined
            }
        >
            <Flex vertical gap={4}>
                {subLabel && (
                    <Text type="secondary" className="whitespace-nowrap text-xs">
                        {subLabel}
                    </Text>
                )}
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
                    <Flex justify="space-between" align="center">
                        <Typography.Text className="text-blue-500 line-clamp-1">
                            {fileName}
                        </Typography.Text>
                        {allowFileDelete && (
                            <Button
                                icon={<DeleteOutlined />}
                                size="small"
                                danger
                                onClick={handleDeleteFile}
                                type="text"
                            />
                        )}
                    </Flex>
                )}
            </Flex>
        </Form.Item>
    );
};

export default CustomFileUpload;
