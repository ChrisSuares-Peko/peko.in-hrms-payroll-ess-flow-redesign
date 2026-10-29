import { useState } from 'react';

import { Button, Flex, Form, Input, Modal, Select, Typography, Upload } from 'antd';

import { REIMBURSEMENT_CATEGORIES } from '../../../utils/reimbursementsData';
import { MODAL_CLOSE_ICON, ROUNDED_MODAL_CLASSNAMES } from '../../common/modalProps';

const { Text } = Typography;
const { TextArea } = Input;

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

interface SubmitReimbursementModalProps {
    open: boolean;
    onClose: () => void;
}

const SubmitReimbursementModal = ({ open, onClose }: SubmitReimbursementModalProps) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
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
                        Submit reimbursement
                    </Text>
                    <Text className="text-sm font-normal text-textBody">
                        Your manager will review and approve reimbursement.
                    </Text>
                </Flex>
            }
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Merchant"
                    name="merchant"
                    rules={[
                        { required: true, message: 'Please enter the merchant name' },
                        ...wsRules('Merchant'),
                    ]}
                >
                    <Input placeholder="Enter" />
                </Form.Item>

                <Flex gap={16}>
                    <Form.Item
                        label="Category"
                        name="category"
                        className="flex-1"
                        rules={[{ required: true, message: 'Please select the category' }]}
                    >
                        <Select
                            placeholder="Select"
                            options={REIMBURSEMENT_CATEGORIES}
                            className="w-full"
                        />
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

                <Form.Item label="Description" name="description" rules={wsRules('Description')}>
                    <TextArea placeholder="Enter" rows={3} />
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
                    <Button block type="primary" loading={loading} onClick={handleSubmit}>
                        Submit
                    </Button>
                </Flex>
            </Form>
        </Modal>
    );
};

export default SubmitReimbursementModal;
