import { useState } from 'react';

import { Button, DatePicker, Flex, Form, Input, Modal, Typography, Upload } from 'antd';

import { MODAL_CLOSE_ICON, ROUNDED_MODAL_CLASSNAMES } from '../../common/modalProps';

const { Text } = Typography;

const wsRules = (label: string) => [
    {
        validator: (_: unknown, value: string) => {
            if (!value) return Promise.resolve();
            if (/^\s/.test(value))
                return Promise.reject(new Error(`${label} cannot start with a space`));
            if (/\s{2,}/.test(value))
                return Promise.reject(new Error(`${label} cannot contain consecutive spaces`));
            if (/^\s*$/.test(value))
                return Promise.reject(new Error(`${label} cannot be only spaces`));
            return Promise.resolve();
        },
    },
];

interface UploadInvoiceModalProps {
    open: boolean;
    onClose: () => void;
}

const UploadInvoiceModal = ({ open, onClose }: UploadInvoiceModalProps) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        await form.validateFields();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            form.resetFields();
            onClose();
        }, 800);
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    return (
        <Modal
            open={open}
            onCancel={handleCancel}
            footer={null}
            centered
            width={520}
            closeIcon={MODAL_CLOSE_ICON}
            classNames={{ ...ROUNDED_MODAL_CLASSNAMES, body: 'px-6 pb-6 pt-2' }}
            title={
                <Flex vertical gap={4} className="pb-2">
                    <Text className="text-lg font-semibold text-textHeadings">
                        Upload vendor invoice
                    </Text>
                    <Text className="text-sm font-normal text-textBody">
                        Finance will review and process payment.
                    </Text>
                </Flex>
            }
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Vendor"
                    name="vendor"
                    rules={[
                        { required: true, message: 'Please enter the vendor name' },
                        ...wsRules('Vendor'),
                    ]}
                >
                    <Input placeholder="Enter" />
                </Form.Item>

                <Flex gap={16}>
                    <Form.Item
                        label="Invoice No."
                        name="invoiceNo"
                        className="flex-1"
                        rules={[
                            { required: true, message: 'Please enter the invoice number' },
                            ...wsRules('Invoice number'),
                        ]}
                    >
                        <Input placeholder="Enter" />
                    </Form.Item>

                    <Form.Item
                        label="Amount (INR)"
                        name="amount"
                        className="flex-1"
                        rules={[{ required: true, message: 'Please enter the amount' }]}
                    >
                        <Input placeholder="Enter" type="number" min={0} />
                    </Form.Item>
                </Flex>

                <Form.Item
                    label="Due date"
                    name="dueDate"
                    rules={[{ required: true, message: 'Please select the due date' }]}
                >
                    <DatePicker placeholder="Select date" className="w-full" />
                </Form.Item>

                <Form.Item label="Attach receipt" name="receipt">
                    <Upload
                        multiple={false}
                        beforeUpload={() => false}
                        showUploadList={false}
                        className="!block w-full [&_.ant-upload]:!w-full"
                    >
                        <Flex
                            align="center"
                            justify="space-between"
                            className="w-full rounded-lg border border-dashed border-borderCard px-4 py-2"
                        >
                            <Text className="text-sm text-textGreyLight">Upload File</Text>
                            <Button size="small">Browse File</Button>
                        </Flex>
                    </Upload>
                </Form.Item>

                <Flex gap={12} className="pt-2">
                    <Button block danger onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button block type="primary" loading={loading} onClick={handleUpload}>
                        Upload
                    </Button>
                </Flex>
            </Form>
        </Modal>
    );
};

export default UploadInvoiceModal;
