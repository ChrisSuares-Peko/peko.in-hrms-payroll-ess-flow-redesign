import { SetStateAction, useEffect, useState } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { Upload, Button, Form, Typography, Flex } from 'antd';
import { useFormikContext } from 'formik';

import { setFileData } from '@src/domains/dashboard/Payroll/slices/employeeSlices';
import { useAppDispatch } from '@src/hooks/store';

const { Text } = Typography;

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
    onFileNameChange?: (fileName: string) => void;
    handleFileChange?: (docName: string) => void;
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
    allowAll,
    isrequired,
    onFileNameChange,
    handleFileChange,
}: DocumentUploadInputProps) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [fileName, setFileName] = useState('');
    // const dispatch=useAppSelector(state=>state.)
    const { touched, errors } = useFormikContext<any>();
    const dispatch = useAppDispatch();

    dispatch(setFileData(fileName));
    uploadedFile = fileName;


    useEffect(() => {
        if (fileName && passName) {
            if (onFileNameChange) onFileNameChange(fileName); // Call the prop function
        }
    }, [fileName, onFileNameChange, passName]);


    return (
        <Form.Item
            name={name}
            label={label}
            help={
                touched[name] && errors[name] ? (
                    <Text className="text-sm font-normal text-red-500 ">
                        {errors[name] as string}
                    </Text>
                ) : undefined
            }
            validateStatus={touched.serviceOperatorId && errors.serviceOperatorId ? 'error' : ''}
            required={isrequired}
        >
            <Flex vertical gap={2}>
                <Upload
                    multiple={false}
                    name={name}

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
            {showFileName && fileName !== '' && (
                <Text className="text-red-400 line-clamp-1 w-28">{fileName}</Text>
            )}
        </Form.Item>
    );
};

export default DocumentUploadInput;
