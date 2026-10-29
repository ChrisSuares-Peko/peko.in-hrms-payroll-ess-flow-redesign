import { useState } from 'react';

import { Button, Form, Input, Modal, Select, Switch } from 'antd';

import useGetEmailTemplateServices from '../../../hooks/useGetEmailTemplateServices';
import { CreateEmailTemplateKeyPayload } from '../../../types/emailTemplateKey';

type EmailTemplateKeyModalProps = {
    open: boolean;
    onClose: () => void;
    onCreate: (payload: CreateEmailTemplateKeyPayload) => Promise<boolean>;
};

// Matches the backend IDENTIFIER convention in validations/emailTemplateKey.js —
// starts with a letter, letters/numbers/underscores only, e.g. WELCOME_EMAIL.
const IDENTIFIER = /^[A-Za-z][A-Za-z0-9_]*$/;

// This is a dropdown, not a paged table — it needs every active service, not just
// the hook's default page of 10.
const ALL_SERVICES_ITEMS_PER_PAGE = 1000;

const EmailTemplateKeyModal = ({ open, onClose, onCreate }: EmailTemplateKeyModalProps) => {
    const [form] = Form.useForm<CreateEmailTemplateKeyPayload>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { services, isLoading: isLoadingServices } = useGetEmailTemplateServices({
        isActive: true,
        itemsPerPage: ALL_SERVICES_ITEMS_PER_PAGE,
    });

    const resetAndClose = () => {
        form.resetFields();
        onClose();
    };

    const handleSubmit = async () => {
        let values: CreateEmailTemplateKeyPayload;
        try {
            values = await form.validateFields();
        } catch {
            return;
        }

        setIsSubmitting(true);
        const success = await onCreate({
            key: values.key.trim().toUpperCase(),
            service: values.service,
            isActive: values.isActive ?? true,
        });
        setIsSubmitting(false);
        if (success) resetAndClose();
    };

    return (
        <Modal
            title="Create Key"
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
                    name="service"
                    label="Service"
                    rules={[{ required: true, message: 'Service is required' }]}
                >
                    <Select
                        placeholder="Select a service"
                        loading={isLoadingServices}
                        showSearch
                        optionFilterProp="label"
                        disabled={isSubmitting}
                        options={services.map(service => ({
                            value: service.key,
                            label: service.key,
                        }))}
                    />
                </Form.Item>
                <Form.Item
                    name="key"
                    label="Template Key"
                    rules={[
                        { required: true, message: 'Template key is required' },
                        { max: 100, message: 'Template key must be 100 characters or fewer' },
                        {
                            pattern: IDENTIFIER,
                            message:
                                'Must start with a letter and contain only letters, numbers and underscores (e.g. WELCOME_EMAIL)',
                        },
                    ]}
                >
                    <Input
                        placeholder="e.g. WELCOME_EMAIL"
                        maxLength={100}
                        disabled={isSubmitting}
                    />
                </Form.Item>
                <Form.Item name="isActive" label="Active" valuePropName="checked">
                    <Switch disabled={isSubmitting} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EmailTemplateKeyModal;
