import React, { useEffect, useState } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { Button, Upload, Form, Typography, Flex } from 'antd';
import { RcFile, UploadChangeParam, UploadFile } from 'antd/es/upload';
import { useFormikContext } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

interface FileUploadInputProps {
    name: string;
    expiryFieldName: string;
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
    handleImageChange?: (file: RcFile) => void;
    isImageCrop?: boolean;
}

const KycFileUpload = ({
    name,
    expiryFieldName,
    label,
    setFile,
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
}: FileUploadInputProps) => {
    const defaultFileList: UploadFile[] = existingFileUrl
        ? [
              {
                  uid: '1',
                  name,
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
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/msword', // .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/vnd.ms-excel', // .xls
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        ];

        const isAllowedType = allowedTypes.includes(file.type);

        if (!isAllowedType) {
            dispatch(
                showToast({
                    description:
                        'Please upload a JPG, JPEG, PNG, PDF, DOC, DOCX, XLS, or XLSX file.',
                    variant: 'error',
                })
            );
            setShowFile(false);
            return false;
        }
        const isNonZeroFileSize = file.size > 0;
        if (!isNonZeroFileSize) {
            // Check if file size is greater than 0 KB and less than or equal to maxFileSize KB
            dispatch(
                showToast({ description: 'File size must be greater than 0 KB.', variant: 'error' })
            );
            setShowFile(false);
            return false;
        }

        const isLtmaxFileSizeKB = file.size / 1024 <= maxFileSize;

        if (!isLtmaxFileSizeKB) {
            dispatch(
                showToast({
                    description: `File size must be smaller than 5 MB`,
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
            if (info.file.status === 'removed') {
                setFieldValue(expiryFieldName, null);
                if (setFile) {
                    setFile(false);
                }
            }
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
            // if (showNotification) {
            //     dispatch(
            //         showToast({
            //             description: `${info.file.status === 'removed' ? 'File removed successfully' : 'File updated successfully'}`,
            //             variant: 'success',
            //         })
            //     );
            // }
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
            // if (showNotification) {
            //     dispatch(
            //         showToast({ description: 'File updated successfully', variant: 'success' })
            //     );
            // }
        }
    };

    const onRemove = (file: UploadFile): boolean | void => {
        // dispatch(
        //     showToast({
        //         description: `File removed successfully`,
        //         variant: 'success',
        //     })
        // );
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
                    if (!isImageCrop) setFieldValue(format!, file.type.split('/')[1]);
                    if (handleImageChange) handleImageChange(file);
                }
            };
            reader.readAsDataURL(file);
            // if (showNotification) {
            //     dispatch(
            //         showToast({
            //             description: 'File uploaded successfully',
            //             variant: 'success',
            //         })
            //     );
            // }
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
            data-testid="form-item"
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
                    showUploadList={showFile}
                    beforeUpload={beforeUpload}
                    onChange={fileOutputObject ? customHandleChange : handleChange}
                    defaultFileList={fileList}
                    onRemove={onRemove}
                    customRequest={setValue}
                >
                    <Button
                        size="small"
                        className="xxl:w-40 xs:w-full h-9"
                        icon={<UploadOutlined />}
                    >
                        Click to Upload
                    </Button>
                </Upload>
            </Flex>
        </Form.Item>
    );
};

export default KycFileUpload;
