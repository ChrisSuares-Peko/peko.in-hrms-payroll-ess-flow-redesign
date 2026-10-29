import { SetStateAction, useEffect, useState } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { Upload, Button, Form, Typography, Flex } from 'antd';
import { RcFile } from 'antd/es/upload';
import { UploadFile } from 'antd/lib';
import { useFormikContext } from 'formik';

import { setFileData } from '@src/domains/dashboard/Payroll/slices/employeeSlices';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

interface DocumentUploadInputProps {
    name: string;
    label: string;
    setFile?: React.Dispatch<SetStateAction<any>>;
    format?: string;
    showNotification?: boolean;
    classes?: string;
    showFileName?: boolean;
    passName?: boolean;
    uploadedFile?: string;
    allowAll?: boolean;
    isrequired?: boolean;
    accept?: string;
    onFileNameChange?: (fileName: string) => void;
    handleFileChange?: (docName: string) => void;
    existingFileUrl?: string;
    maxFileSize?: number;
}

const DocumentUploadInput = ({
    name,
    label,
    setFile,
    format,
    classes,
    showNotification = false,
    showFileName = false,
    uploadedFile,
    passName,
    existingFileUrl,
    allowAll,
    isrequired,
    accept = '',
    onFileNameChange,
    handleFileChange,
    maxFileSize = 200,
}: DocumentUploadInputProps) => {
    const defaultFileList: UploadFile[] = existingFileUrl
        ? [
              {
                  uid: '1',
                  name: 'Doc',
                  status: 'done',
                  url: existingFileUrl,
              },
          ]
        : [];
    const [fileName, setFileName] = useState('');
    const [fileList, setFileList] = useState<UploadFile[]>(defaultFileList);
    const [showFile] = useState(showFileName || !!existingFileUrl);
    // const dispatch=useAppSelector(state=>state.)
    const { setFieldValue, touched, errors } = useFormikContext<any>();
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(setFileData(fileName));
    }, [fileName, dispatch]);

    uploadedFile = fileName;

    const getFormatFromMimeType = (mimeType: string): string => {
        switch (mimeType) {
            case 'vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                return 'xlsx';
            case 'vnd.ms-excel':
                return 'xls';
            case 'msword':
                return 'doc';
            case 'vnd.openxmlformats-officedocument.wordprocessingml.document':
                return 'docx';
            case 'plain':
                return 'txt';
            case 'vnd.ms-powerpoint':
                return 'ppt';
            case 'vnd.openxmlformats-officedocument.presentationml.presentation':
                return 'pptx';
            case 'postscript':
                return 'ai';
            case 'illustrator':
                return 'ai';
            default:
                return mimeType; // Default case
        }
    };

    const beforeUpload = (file: RcFile) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/csv',
            'application/vnd.ms-powerpoint',
            'image/jpeg',
            'image/png',
        ];
        const isAllowed = allowedTypes.includes(file.type);

        const isNonZeroFileSize = file.size > 0;
        if (!isNonZeroFileSize) {
            dispatch(
                showToast({
                    description: 'File size must be greater than 0 KB.',
                    variant: 'error',
                })
            );
            return Upload.LIST_IGNORE;
        }
        if (!isAllowed) {
            dispatch(
                showToast({
                    description: 'Invalid File type!',
                    variant: 'error',
                })
            );
            return Upload.LIST_IGNORE;
        }
        const isLtmaxFileSizeKB = file.size / 1024 <= maxFileSize;

        if (!isLtmaxFileSizeKB) {
            dispatch(
                showToast({
                    description: `File size must be smaller than ${maxFileSize % 1024 === 0 ? `${maxFileSize / 1024} MB` : `${maxFileSize} KB`}`,
                    variant: 'error',
                })
            );
            return Upload.LIST_IGNORE;
        }
        return isAllowed && isLtmaxFileSizeKB && isNonZeroFileSize;
    };
    useEffect(() => {
        if (fileName && passName) {
            if (onFileNameChange) onFileNameChange(fileName); // Call the prop function
        }
    }, [fileName, onFileNameChange, passName]);
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
    const setValue = ({ file, onSuccess }: any) => {
        if (file && beforeUpload(file)) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    if (setFile) setFile(reader.result);
                    setFieldValue(name, reader.result.split(',')[1]);
                    setFieldValue(format!, getFormatFromMimeType(file.type.split('/')[1]));
                }
            };
            reader.readAsDataURL(file);
            if (showNotification) {
                dispatch(
                    showToast({
                        description: 'File uploaded successfully ',
                        variant: 'success',
                    })
                );
            }
            onSuccess('ok');
            handleFileChange?.(name);
        }

        if (passName) {
            if (onFileNameChange) onFileNameChange(fileName); // Call the prop function
        }
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
            validateStatus={touched.serviceOperatorId && errors.serviceOperatorId ? 'error' : ''}
            required={isrequired}
        >
            <Flex vertical gap={2}>
                <Upload
                    multiple={false}
                    name={name}
                    accept={accept}
                    beforeUpload={beforeUpload}
                    customRequest={setValue}
                    showUploadList={showFile}
                    defaultFileList={fileList}
                    onRemove={() => {
                        setFieldValue(name, '');
                        if (format) setFieldValue(format, '');
                        if (setFile) setFile('');
                        setFileName('');
                        setFileList([]);
                    }}
                    // help={
                    //     touched[name] && errors[name]
                    //         ? (errors[name] as React.ReactNode)
                    //         : undefined
                    // }
                >
                    <Button className={classes} size="small" icon={<UploadOutlined />}>
                        Click to upload
                    </Button>
                </Upload>
            </Flex>
        </Form.Item>
    );
};

export default DocumentUploadInput;
