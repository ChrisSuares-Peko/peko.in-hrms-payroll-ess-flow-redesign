import React, { useState } from 'react';

import { CloudUploadOutlined } from '@ant-design/icons';
import { Button, Form, Modal, Typography, Upload } from 'antd';
import type { RcFile } from 'antd/es/upload';
import { Formik } from 'formik';
import * as Yup from 'yup';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { noSurroundingSpaces } from '../../schema';

const { Text } = Typography;

const MAX_MB = 5;

// Document types offered in the employee-side upload modal — matches IN's
// onboarding document catalog naming (PAN/Aadhaar in place of AE's Emirates ID).
const documentOptions = [
    { value: 'PAN Card', label: 'PAN Card' },
    { value: 'Aadhaar Card', label: 'Aadhaar Card' },
    { value: 'Passport', label: 'Passport' },
    { value: 'Bank Account Details', label: 'Bank Account Details' },
    { value: 'Educational Certificates / Degree', label: 'Educational Certificates / Degree' },
    { value: 'Experience Letters', label: 'Experience Letters' },
    { value: 'Signed Offer Letter', label: 'Signed Offer Letter' },
    {
        value: 'No Objection Certificate (if applicable)',
        label: 'No Objection Certificate (if applicable)',
    },
    { value: 'Medical Fitness Certificate', label: 'Medical Fitness Certificate' },
];

interface UploadDocumentBody {
    name: string;
    expiryDate?: string;
    holderName?: string;
    url: string;
}

interface UploadDocumentModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (body: UploadDocumentBody) => Promise<boolean>;
}

interface UploadFormValues {
    name: string;
    holderName: string;
    expiryDate: string;
    url: string;
}

const validationSchema = Yup.object({
    name: Yup.string().required('Please enter the document name'),
    holderName: noSurroundingSpaces('Holder name')
        .test('min-length', 'Holder name must be at least 3 characters', v => !v || v.length >= 3)
        .max(30, 'Holder name must be at most 30 characters'),
    expiryDate: Yup.string(),
    url: Yup.string().required('Please attach a file'),
});

const initialValues: UploadFormValues = {
    name: '',
    holderName: '',
    expiryDate: '',
    url: '',
};

// Reads the file as base64 client-side (matches IN's OnboardingUpload convention)
// rather than AE's temp-upload-then-move-to-S3 flow.
const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({ open, onClose, onSubmit }) => {
    const dispatch = useAppDispatch();
    const [fileName, setFileName] = useState('');

    const handleSubmit = async (
        values: UploadFormValues,
        { resetForm }: { resetForm: () => void }
    ) => {
        const ok = await onSubmit({
            name: values.name,
            expiryDate: values.expiryDate || undefined,
            holderName: values.holderName || undefined,
            url: values.url,
        });
        if (ok) {
            resetForm();
            setFileName('');
            onClose();
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            width={460}
            styles={{ content: { padding: 24, borderRadius: 24, overflow: 'hidden' } }}
        >
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({
                    errors,
                    touched,
                    setFieldValue,
                    setFieldTouched,
                    isSubmitting,
                    handleSubmit: formikSubmit,
                }) => (
                    <Form onFinish={formikSubmit} layout="vertical">
                        <div className="flex flex-col gap-4 [&_.ant-form-item]:!mb-0">
                            <div className="flex flex-col gap-1">
                                <Text className="text-valueText font-bold text-lg">
                                    Upload Document
                                </Text>
                                <Text className="text-titleText text-sm">
                                    Add a document to your profile
                                </Text>
                            </div>

                            <SelectInput
                                name="name"
                                label="Document Name"
                                placeholder="Select document name"
                                options={documentOptions}
                                showSearch
                                filterOption
                                isRequired
                            />
                            <TextInput
                                name="holderName"
                                label="Holder Name (optional)"
                                placeholder="Name on the document"
                                type="text"
                                allowAlphabetsAndSpaceOnly
                                maxLength={30}
                            />
                            <DatePickerInput
                                name="expiryDate"
                                label="Expiry Date (optional)"
                                placeholder="Select expiry date"
                                classes="w-full"
                            />

                            <div>
                                <Text className="text-sm font-medium text-valueText block mb-1.5">
                                    <span className="text-textRed">* </span>File
                                </Text>
                                <Upload.Dragger
                                    accept=".png,.jpg,.jpeg,.pdf"
                                    maxCount={1}
                                    showUploadList={false}
                                    beforeUpload={(f: RcFile) => {
                                        if (f.size > 5.1 * 1024 * 1024) {
                                            dispatch(
                                                showToast({
                                                    description: `File must be smaller than ${MAX_MB}MB.`,
                                                    variant: 'error',
                                                })
                                            );
                                            return Upload.LIST_IGNORE;
                                        }
                                        setFileName(f.name);
                                        setFieldTouched('url', true, false);
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                            if (typeof reader.result === 'string') {
                                                setFieldValue('url', reader.result);
                                            }
                                        };
                                        reader.readAsDataURL(f);
                                        return false;
                                    }}
                                >
                                    <p className="ant-upload-drag-icon">
                                        <CloudUploadOutlined style={{ color: '#FF3A3A' }} />
                                    </p>
                                    <p className="ant-upload-text text-sm">
                                        {fileName || 'Click or drag file to this area to upload'}
                                    </p>
                                    <p className="ant-upload-hint text-xs">
                                        PDF, JPEG, JPG, PNG — max {MAX_MB}MB
                                    </p>
                                </Upload.Dragger>
                                {touched.url && errors.url && (
                                    <div className="text-textRed text-xs mt-1">{errors.url}</div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={onClose}
                                    className="flex-1 h-11 rounded-lg font-medium"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    danger
                                    htmlType="submit"
                                    loading={isSubmitting}
                                    className="flex-1 h-11 rounded-lg font-medium text-brandColor border-brandColor"
                                >
                                    Upload
                                </Button>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
};

export default UploadDocumentModal;
