import React, { useEffect, useState } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { Button, Upload, Form, Typography, Flex } from 'antd';
import { RcFile, UploadChangeParam, UploadFile } from 'antd/es/upload';
import { useFormikContext } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
// import '../../../assets/style.css';
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
    label: string;
    setFile?: React.Dispatch<React.SetStateAction<any>>;
    format?: string;
    showNotification?: boolean;
    classes?: string;
    showFileName?: boolean;
    maxFileSize?: number;
    existingFileUrl?: any;
    existingFilName?: any;
    // handleRemove?: (file: UploadFile) => boolean | void;
    fileOutputObject?: boolean;
    isrequired?: boolean;
    allowedFileTypes?: AllowedFileType[];
}

const AirlineFileUploadInput = ({
    name,
    label,
    setFile,
    format,
    classes,
    showNotification = false,
    showFileName = false,
    maxFileSize = 5120, // Default max file size is 500KB
    existingFileUrl,
    // handleRemove,
    existingFilName,
    fileOutputObject = false,
    isrequired,
    allowedFileTypes = [],
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
    const [, setFileName] = useState('');
    const [showFile, setShowFile] = useState(showFileName || !!existingFileUrl);
    const { setFieldValue, touched, errors } = useFormikContext<any>();
    const dispatch = useAppDispatch();

    const beforeUpload = (file: RcFile): boolean => {
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
        if (info.file.status === 'done') {
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
                    showToast({ description: 'File uploaded successfully', variant: 'success' })
                );
            }
        }
        // else if( info.file.status === 'removed'){
        //     if (showNotification) {
        //         dispatch(
        //             showToast({ description: 'File removed successfully', variant: 'success' })
        //         );
        //     }
        // }
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
                        // setFieldValue(`${name}.imageName`, fileName);
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
                    name: existingFilName,
                    status: 'done',
                    url: existingFileUrl,
                },
            ]);
        }
    }, [existingFilName, existingFileUrl]);

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
            required={isrequired}
        >
            <Flex vertical gap={4}>
                <Upload
                    accept={allowedFileTypes.join(', ')}
                    multiple={false}
                    name={name}
                    maxCount={1}
                    className={`avatar-uploader ${classes}`}
                    showUploadList={{
                        showRemoveIcon: false,
                        showPreviewIcon: false,
                        showDownloadIcon: false,
                    }}
                    fileList={showFile ? fileList : []}
                    beforeUpload={beforeUpload}
                    onChange={fileOutputObject ? customHandleChange : handleChange}
                    defaultFileList={fileList}
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

export default AirlineFileUploadInput;
