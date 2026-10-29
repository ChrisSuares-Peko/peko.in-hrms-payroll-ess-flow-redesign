import { useState } from 'react';

import { Button, Form, Input, Modal, Switch } from 'antd';

import { CreateEmailTemplateServicePayload } from '../../../types/emailTemplateService';

type EmailTemplateServiceModalProps = {
    open: boolean;
    onClose: () => void;
    onCreate: (payload: CreateEmailTemplateServicePayload) => Promise<boolean>;
};

// Matches the backend IDENTIFIER convention in validations/emailTemplateService.js —
// starts with a letter, letters/numbers/underscores only, e.g. AUTH.
const IDENTIFIER = /^[A-Za-z][A-Za-z0-9_]*$/;

const EmailTemplateServiceModal = ({ open, onClose, onCreate }: EmailTemplateServiceModalProps) => {
    const [form] = Form.useForm<CreateEmailTemplateServicePayload>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetAndClose = () => {
        form.resetFields();
        onClose();
    };

    const handleSubmit = async () => {
        let values: CreateEmailTemplateServicePayload;
        try {
            values = await form.validateFields();
        } catch {
            return;
        }

        setIsSubmitting(true);
        const success = await onCreate({
            key: values.key.trim().toUpperCase(),
            isActive: values.isActive ?? true,
        });
        setIsSubmitting(false);
        if (success) resetAndClose();
    };

    return (
        <Modal
            title="Create Service"
            open={open}
            onCancel={resetAndClose}
            footer={[
                <Button key="cancel" onClick={resetAndClose}>
                    Cancel
                </Button>,
                <Button
                    key="create"
                    type="primary"
                    danger
                    loading={isSubmitting}
                    onClick={handleSubmit}
                >
                    Create
                </Button>,
            ]}
            centered
            destroyOnClose
        >
            <Form form={form} layout="vertical" initialValues={{ isActive: true }} className="mt-4">
                <Form.Item
                    name="key"
                    label="Service Key"
                    rules={[
                        { required: true, message: 'Service key is required' },
                        { max: 50, message: 'Service key must be 50 characters or fewer' },
                        {
                            pattern: IDENTIFIER,
                            message:
                                'Must start with a letter and contain only letters, numbers and underscores (e.g. AUTH)',
                        },
                    ]}
                >
                    <Input placeholder="e.g. AUTH" maxLength={50} disabled={isSubmitting} />
                </Form.Item>
                <Form.Item name="isActive" label="Active" valuePropName="checked">
                    <Switch disabled={isSubmitting} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EmailTemplateServiceModal;
