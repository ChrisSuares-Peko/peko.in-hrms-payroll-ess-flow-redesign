import React from 'react';

import { Button, Form, Modal, Typography } from 'antd';
import { Formik } from 'formik';
import * as Yup from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';

const { Text } = Typography;

interface RequestDocumentModalProps {
    open: boolean;
    documentType: string;
    fieldLabel: string;
    fieldPlaceholder?: string;
    onCancel: () => void;
    onSubmit: (value: string) => Promise<boolean>;
}

interface RequestDocumentFormValues {
    value: string;
}

const RequestDocumentModal: React.FC<RequestDocumentModalProps> = ({
    open,
    documentType,
    fieldLabel,
    fieldPlaceholder,
    onCancel,
    onSubmit,
}) => {
    const validationSchema = Yup.object({
        value: Yup.string()
            .min(3, `${fieldLabel} must be at least 3 characters`)
            .max(200, `${fieldLabel} must be at most 200 characters`)
            .required(`Please enter ${fieldLabel.toLowerCase()}`),
    });

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            centered
            width={480}
            destroyOnClose
            styles={{ content: { padding: 24, borderRadius: 24, overflow: 'hidden' } }}
        >
            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                    <Text className="text-valueText font-bold text-lg">{documentType}</Text>
                    <Text className="text-titleText text-sm">
                        Provide the details below to submit this request
                    </Text>
                </div>

                <Formik<RequestDocumentFormValues>
                    initialValues={{ value: '' }}
                    validationSchema={validationSchema}
                    onSubmit={async (values, { resetForm }) => {
                        const ok = await onSubmit(values.value.trim());
                        if (ok) resetForm();
                    }}
                >
                    {({ isSubmitting, handleSubmit }) => (
                        <Form
                            onFinish={handleSubmit}
                            layout="vertical"
                            className="flex flex-col gap-4 [&_.ant-form-item]:!mb-0"
                        >
                            <TextInput
                                name="value"
                                type="text"
                                label={fieldLabel}
                                placeholder={fieldPlaceholder}
                                isRequired
                                maxLength={200}
                            />
                            <div className="flex gap-3">
                                <Button
                                    size="large"
                                    onClick={onCancel}
                                    className="flex-1 rounded-lg font-medium"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    danger
                                    size="large"
                                    htmlType="submit"
                                    loading={isSubmitting}
                                    className="flex-1 rounded-lg font-medium text-brandColor border-brandColor"
                                >
                                    Submit Request
                                </Button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </Modal>
    );
};

export default RequestDocumentModal;
