import { useEffect } from 'react';

import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Drawer, Flex, Form, Input, Typography } from 'antd';

import useUpdateEmailTemplateKeyVariables from '../../../hooks/useUpdateEmailTemplateKeyVariables';
import { EmailTemplateKey } from '../../../types/emailTemplateKey';

type EmailTemplateKeyVariablesModalProps = {
    emailTemplateKey: EmailTemplateKey | null;
    onClose: () => void;
    onUpdated: () => void;
};

type VariablesFormValues = {
    names: { name: string }[];
};

// Same camelCase placeholder convention as validations/emailTemplateKey.js's
// VARIABLE_NAME — these names become the ${variable} placeholders a template author
// inserts; nothing here drives the actual substitution at send time.
const VARIABLE_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const EmailTemplateKeyVariablesModal = ({
    emailTemplateKey,
    onClose,
    onUpdated,
}: EmailTemplateKeyVariablesModalProps) => {
    const [form] = Form.useForm<VariablesFormValues>();
    const { updateVariables, isSaving } = useUpdateEmailTemplateKeyVariables();

    useEffect(() => {
        if (emailTemplateKey) {
            form.setFieldsValue({
                names: Object.keys(emailTemplateKey.variables ?? {}).map(name => ({ name })),
            });
        }
    }, [emailTemplateKey, form]);

    const handleClose = () => {
        form.resetFields();
        onClose();
    };

    const handleSubmit = async () => {
        if (!emailTemplateKey) return;

        let values: VariablesFormValues;
        try {
            values = await form.validateFields();
        } catch {
            return;
        }

        const names = values.names.map(entry => entry.name.trim()).filter(Boolean);
        const uniqueNames = new Set(names);
        if (uniqueNames.size !== names.length) {
            form.setFields([
                {
                    name: 'names',
                    errors: ['Variable names must be unique.'],
                },
            ]);
            return;
        }

        const variables = Object.fromEntries(names.map(name => [name, '']));
        const success = await updateVariables(
            emailTemplateKey.service,
            emailTemplateKey.key,
            variables
        );
        if (success) {
            onUpdated();
            handleClose();
        }
    };

    return (
        <Drawer
            title={
                emailTemplateKey ? (
                    <Flex vertical gap={2}>
                        <Typography.Text className="font-medium">Variables</Typography.Text>
                        <Typography.Text className="text-textGray text-xs font-normal">
                            {emailTemplateKey.service} / {emailTemplateKey.key}
                        </Typography.Text>
                    </Flex>
                ) : (
                    'Variables'
                )
            }
            open={Boolean(emailTemplateKey)}
            onClose={handleClose}
            width={420}
            destroyOnClose
            footer={
                <Flex justify="flex-end" gap={10}>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button type="primary" danger loading={isSaving} onClick={handleSubmit}>
                        Save
                    </Button>
                </Flex>
            }
        >
            <Typography.Text className="text-textGray text-sm">
                These names become the <Typography.Text code>${'{variable}'}</Typography.Text>{' '}
                placeholders this key&apos;s send site substitutes — they document the contract,
                they don&apos;t drive the substitution itself.
            </Typography.Text>
            <Form form={form} layout="vertical" className="mt-4">
                <Form.List name="names">
                    {(fields, { add, remove }) => (
                        <Flex vertical gap={8}>
                            {fields.map(field => (
                                <Flex key={field.key} gap={8} align="start">
                                    <Form.Item
                                        {...field}
                                        name={[field.name, 'name']}
                                        className="mb-0 flex-1"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Variable name is required',
                                            },
                                            {
                                                pattern: VARIABLE_NAME,
                                                message:
                                                    'Letters, numbers and underscores, starting with a letter (e.g. employeeName)',
                                            },
                                        ]}
                                    >
                                        <Input
                                            placeholder="e.g. employeeName"
                                            disabled={isSaving}
                                        />
                                    </Form.Item>
                                    <Button
                                        type="text"
                                        icon={<MinusCircleOutlined />}
                                        onClick={() => remove(field.name)}
                                        disabled={isSaving}
                                    />
                                </Flex>
                            ))}
                            <Button
                                type="dashed"
                                icon={<PlusOutlined />}
                                onClick={() => add({ name: '' })}
                                disabled={isSaving}
                                block
                            >
                                Add Variable
                            </Button>
                        </Flex>
                    )}
                </Form.List>
            </Form>
        </Drawer>
    );
};

export default EmailTemplateKeyVariablesModal;
