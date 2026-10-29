import React, { useState, useEffect } from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useFormikContext } from 'formik';

import CertificateCard from './CertificateCard';
import DatePickerInput from './DatePickerInput';
import DocumentUploadInput from './DocumentUploadInput';
import CustomLabel from '../CustomLabel';

type Props = {
    label: string;
    name: string;

    onDateChange: (date: Dayjs) => void;
    documentUrl?: string;
    expiry?: string;

    handleFileChange?: any;
    error?: any;
    touched?: any;
    expiryError?: any;
    expiryTouched?: any;
};

const DocsCard = ({
    label,
    name,
    onDateChange,
    documentUrl,
    expiry,
    handleFileChange,
    error,
    touched,
    expiryError,
    expiryTouched,
}: Props) => {
    const { setFieldValue } = useFormikContext();
    const [fileName, setFileName] = useState('');

    const [, setFile] = useState<string | null>('');
    const [resetTrigger, setResetTrigger] = useState(false);

    const handleFileNameChange = (newFileName: string) => {
        setFileName(newFileName);
    };

    const resetUpload = () => {
        setResetTrigger(true);

        setFileName('');

        setTimeout(() => setResetTrigger(false), 10);
    };

    const handleRemoveFile = () => {
        setFileName('');
        setFile(null);
        handleFileNameChange(fileName);

        setFieldValue(`${name}`, null);
        setFieldValue(`${name}Expiry`, null);

        resetUpload();
    };

    useEffect(() => {}, [fileName]);

    return (
        <Flex vertical className="mb-6">
            <CustomLabel className="mb-3" label={label} />
            <Flex align="center" justify="space-between">
                <Flex gap={16}>
                    <DocumentUploadInput
                        name={name}
                        setFile={setFile}
                        passName
                        resetTrigger={resetTrigger}
                        handleFileChange={() => handleFileChange}
                        onFileNameChange={handleFileNameChange}
                        label=""
                    />

                    <DatePickerInput
                        name={`${name}Expiry`}
                        placeholder="Expiry date"
                        classes=" w-full"
                        size="small"
                        minDate={dayjs(new Date())}
                        onDateChange={onDateChange}
                    />
                </Flex>
                <Button className="border-none" size="small">
                    <Flex gap={5} className="mb-6 text-textGreen text-3">
                        <Button className="border-none" size="small">
                            <Flex gap={5} className=" text-textGreen text-3">
                                <a
                                    href={documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                >
                                    <DownloadOutlined />
                                </a>
                            </Flex>
                        </Button>
                    </Flex>
                </Button>
            </Flex>

            <CertificateCard
                certificateName={name}
                expiry={!!expiry}
                fileName={fileName || documentUrl}
                onDelete={() => {
                    handleRemoveFile();
                }}
                onRemoveCertificate={() => {
                    setTimeout(() => {
                        setFileName('');
                        handleRemoveFile();
                        resetUpload();
                    }, 0);
                }}
            />
        </Flex>
    );
};

export default DocsCard;
