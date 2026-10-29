import { useState } from 'react';

import { InboxOutlined } from '@ant-design/icons';
import { Flex, Form, Typography, Upload } from 'antd';
import type { RcFile } from 'antd/es/upload';
import { getIn, useFormikContext } from 'formik';

const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_MB = 5;

interface OnboardingUploadProps {
    name: string;
    format: string;
    label: string;
    isRequired?: boolean;
}

// Same drag-and-drop look as AE's OnboardingUpload, but reads the file as base64
// client-side (matching IN's own FileUploadInput convention) instead of AE's
// temp-upload-then-move-to-permanent-S3 flow, which IN has no equivalent of.
const OnboardingUpload = ({ name, format, label, isRequired }: OnboardingUploadProps) => {
    const { values, setFieldValue, setFieldTouched, touched, errors } = useFormikContext<any>();
    const [fileName, setFileName] = useState('');
    const [uploadError, setUploadError] = useState('');
    const error = uploadError || (getIn(touched, name) && getIn(errors, name));
    const hasValue = Boolean(getIn(values, name));

    const beforeUpload = (file: RcFile) => {
        if (!ALLOWED.includes(file.type)) {
            setUploadError('Please upload a PDF, JPG or PNG file.');
            return Upload.LIST_IGNORE;
        }
        if (file.size > 5.1 * 1024 * 1024) {
            setUploadError(`File must be smaller than ${MAX_MB}MB.`);
            return Upload.LIST_IGNORE;
        }
        setUploadError('');
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setFieldValue(format, file.type.split('/')[1], false);
                setFieldValue(name, reader.result.split(',')[1]);
                setFieldTouched(name, true, false);
            }
        };
        reader.readAsDataURL(file);
        return false;
    };

    return (
        <Flex vertical gap={6} className="w-full">
            <Typography.Text className="text-sm font-medium">
                {label}
                {isRequired && <span className="text-brandColor"> *</span>}
            </Typography.Text>
            <Upload.Dragger
                name={name}
                accept={ALLOWED.join(',')}
                multiple={false}
                maxCount={1}
                showUploadList={false}
                beforeUpload={beforeUpload}
                className={error ? '!border-red-400' : ''}
            >
                <Flex vertical align="center" justify="center" gap={4} className="py-2">
                    <InboxOutlined className="text-2xl text-brandColor" />
                    <Typography.Text className="text-sm">
                        {fileName ||
                            (hasValue
                                ? 'File uploaded'
                                : 'Click or drag file to this area to upload')}
                    </Typography.Text>
                    <Typography.Text className="text-xs text-gray-400">
                        PDF, JPG, PNG — max {MAX_MB}MB
                    </Typography.Text>
                </Flex>
            </Upload.Dragger>
            {error && (
                <Form.Item
                    className="!mb-0"
                    validateStatus="error"
                    help={error as React.ReactNode}
                />
            )}
        </Flex>
    );
};

export default OnboardingUpload;
