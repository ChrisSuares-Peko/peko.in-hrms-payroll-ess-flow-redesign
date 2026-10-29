import { SetStateAction, useState } from 'react';

import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { Upload, Button, Form, Typography, Flex } from 'antd';
import { RcFile } from 'antd/es/upload';
import { useFormikContext } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

interface FileUploadInputProps {
    name: string;
    label: string;
    setFile?: React.Dispatch<SetStateAction<any>>;
    format?: string;
    showNotification?: boolean;
    classes?: string;
    showFileName?: boolean;
    maxFileSize?: number;
    handleChange?: (file: RcFile) => void;
    isImageCrop?: boolean;
    clearFilePreview?: () => void; // Add this line
}

const CustomImageUploadInput = ({
    name,
    label,
    setFile,
    format,
    classes,
    showNotification = false,
    showFileName = false,
    maxFileSize = 200,
    handleChange,
    isImageCrop = false,
    clearFilePreview, // Add this line
}: FileUploadInputProps) => {
    const [fileName, setFileName] = useState('');
    const { setFieldValue, touched, errors } = useFormikContext<any>();
    const dispatch = useAppDispatch();

    const beforeUpload = (file: RcFile) => {
        const isJpegorPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpegorPng) {
            dispatch(
                showToast({
                    description: 'Please upload JPG, JPEG, or PNG file.',
                    variant: 'error',
                })
            );
        }
        const isLtmaxFileSizeKB = file.size / 1024 <= maxFileSize;
        if (!isLtmaxFileSizeKB) {
            dispatch(
                showToast({
                    description: `File size must be smaller than ${maxFileSize} KB`,
                    variant: 'error',
                })
            );
        }
        return isJpegorPng && isLtmaxFileSizeKB;
    };

    const setValue = ({ file, onSuccess }: any) => {
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    if (setFile) setFile(reader.result);
                    setFieldValue(format!, file.type.split('/')[1]);
                    if (!isImageCrop) {
                        setFieldValue(name, reader.result.split(',')[1]);
                    }
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
            if (handleChange) handleChange(file);
            onSuccess('ok');
        }
    };
    const clearFile = () => {
        setFileName(''); // Reset file name to empty
        if (setFile) {
            setFile(null); // Reset file data to null or initial state
        }
        // Optionally, reset the field value in the formik context if necessary
        setFieldValue(name, '');
        setFieldValue(format!, undefined); // Assuming 'format' is the field for the file type, adjust as necessary
        if (clearFilePreview) clearFilePreview(); // Call the new prop function
    };

    return (
        <Form.Item
            name={name}
            label={label}
            help={
                touched[name] && errors[name] ? (
                    <Typography.Text className="text-sm font-normal text-red-500 ">
                        {errors[name] as string}
                    </Typography.Text>
                ) : undefined
            }
        >
            <Flex vertical gap={4}>
                {showFileName && fileName !== '' && (
                    <Typography.Text className="text-blue-500 ">{fileName}</Typography.Text>
                )}
                <Flex>
                    <Upload
                        multiple={false}
                        name={name}
                        maxCount={1}
                        listType="picture"
                        className="avatar-uploader custom-upload"
                        showUploadList={false}
                        beforeUpload={beforeUpload}
                        customRequest={setValue}
                        accept=".jpeg, .jpg, .png, .webp, .heic, .heif"
                    >
                        <Button className={classes} size="small" icon={<UploadOutlined />}>
                            Click to Upload
                        </Button>
                    </Upload>
                    <DeleteOutlined onClick={clearFile} style={{ marginLeft: '8px' }} />
                </Flex>
            </Flex>
        </Form.Item>
    );
};

export default CustomImageUploadInput;
