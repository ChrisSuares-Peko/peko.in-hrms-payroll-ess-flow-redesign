import { SetStateAction, useEffect, useState } from 'react';

import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { Upload, Button, Form, Typography, Flex } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { RcFile } from 'antd/es/upload';
import { useFormikContext } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getFileExtensionFromUrl } from '../../../utils/data';

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
    fileNameField?: string;
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
    size?: SizeType;
    isDisabled?: boolean;
}

const FileUploadInput = ({
    name,
    label,
    subLabel,
    setFile,
    format,
    fileNameField,
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
    size = 'small',
    isDisabled = false,
}: FileUploadInputProps) => {
    const { setFieldValue, touched, errors, validateField, values, setFieldTouched } =
        useFormikContext<any>();
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
                    return 'JPG, JPEG';
                }
                return type.split('/')[1].toUpperCase();
            });
            const allowedFormats = fileFormats.join(', ').replace(/,([^,]*)$/, ', or$1');
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
                setFieldTouched(name, true);
            } else {
                const reader = new FileReader();
                reader.onload = () => {
                    if (typeof reader.result === 'string') {
                        if (setFile) setFile(reader.result);
                        setFieldValue(name, reader.result.split(',')[1]);
                        setFieldValue(format!, file.type.split('/')[1]);
                        if (fileNameField) setFieldValue(fileNameField, file.name);
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
        setFieldValue(format!, undefined);
        if (fileNameField) setFieldValue(fileNameField, '');
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
                    <Text className="text-sm font-normal text-errorTextRed ">
                        {errors[name] as string}
                    </Text>
                ) : undefined
            }
        >
            <Flex vertical gap={4}>
                {subLabel && (
                    <Text type="secondary" className="text-xs whitespace-nowrap">
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
                    disabled={isDisabled}
                >
                    <Button
                        disabled={isDisabled}
                        className={classes}
                        size={size}
                        icon={<UploadOutlined />}
                    >
                        Click to Upload
                    </Button>
                </Upload>
                {descriptionText && (
                    <Typography.Text className="text-zinc-500">
                        {descriptionText}
                    </Typography.Text>
                )}
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

export default FileUploadInput;
