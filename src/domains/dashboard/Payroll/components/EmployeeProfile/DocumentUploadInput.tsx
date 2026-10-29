import { SetStateAction, useEffect, useState } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { Upload, Button, Form, Typography, Flex } from 'antd';
import { RcFile } from 'antd/es/upload';
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
    isRequired?: boolean;
    showFileName?: boolean;
    passName?: boolean;
    uploadedFile?: string;
    onFileNameChange?: (fileName: string) => void;
    handleFileChange?: (docName: string) => void;
    resetTrigger?: boolean;
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
    isRequired,
    onFileNameChange,
    handleFileChange,
    resetTrigger,
}: DocumentUploadInputProps) => {
    const [fileName, setFileName] = useState('');
    // const dispatch=useAppSelector(state=>state.)
    const { setFieldValue, touched, errors } = useFormikContext<any>();
    // const [fileList, setFileList] = useState([]);
    const dispatch = useAppDispatch();
    useEffect(() => {
        if (resetTrigger) {
            // setFileList([]);
            setFieldValue(name, null);
        }
    }, [resetTrigger, setFieldValue, name]);

    dispatch(setFileData(fileName));
    uploadedFile = fileName;

    const beforeUpload = (file: RcFile) => {
        // Check if the file is a PDF, JPEG, or JPG document
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        const isAllowed = allowedTypes.includes(file.type);

        if (!isAllowed) {
            dispatch(
                showToast({
                    description: 'Please upload PDF, JPEG,JPG or PNG file.',
                    variant: 'error',
                })
            );
        }
        return isAllowed;
    };
    useEffect(() => {
        if (fileName && passName) {
            if (onFileNameChange) onFileNameChange(fileName); // Call the prop function
        }
    }, [fileName, onFileNameChange, passName]);

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
            required={isRequired}
            label={label}
            help={
                touched[name] && errors[name] ? (
                    <Typography.Text className=" text-red-500 text-sm font-normal">
                        {errors[name] as string}
                    </Typography.Text>
                ) : undefined
            }
        >
            <Flex vertical gap={2}>
                <Upload
                    multiple={false}
                    name={name}
                    maxCount={1}
                    className="document-uploader custom-upload"
                    showUploadList={false}
                    beforeUpload={beforeUpload}
                    customRequest={setValue}
                >
                    <Button className={classes} size="small" icon={<UploadOutlined />}>
                        Click to upload
                    </Button>
                </Upload>
            </Flex>
            {showFileName && fileName !== '' && (
                <Typography.Text className=" text-red-400 line-clamp-1 w-28">
                    {fileName}
                </Typography.Text>
            )}
        </Form.Item>
    );
};

export default DocumentUploadInput;
