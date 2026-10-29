import React from 'react';

import { Modal, Form, Select, Input, Button, Typography, Row, Col, Grid } from 'antd';
import { RuleObject } from 'antd/es/form';

import { useManageOrderApi } from '../../hooks/useManageOrderApi';
import { productReturnReasons } from '../../utils/data';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

interface ProductReturnFormValues {
    reason: string;
    description: string;
}

interface ProductReturnModalProps {
    visible: boolean;
    productId: number;
    orderId: number;
    onCancel: () => void;
    onSuccess?: () => void;
}

const ProductReturnModal: React.FC<ProductReturnModalProps> = ({
    visible,
    onCancel,
    productId,
    orderId,
    onSuccess,
}) => {
    const { isLoading, productReturn } = useManageOrderApi();
    const screens = useBreakpoint();
    const isMobile = !screens.sm;

    const onFinish = async (values: ProductReturnFormValues) => {
        await productReturn(orderId, values.description, values.reason, productId);

        if (onSuccess) onSuccess();

        onCancel();
    };

    const validateDescription = (_: RuleObject, value: string) => {
        if (!value) return Promise.resolve();
        if (value[0] === ' ' || value[value.length - 1] === ' ')
            return Promise.reject(new Error('Description cannot start or end with a whitespace'));
        if (value.length < 3)
            return Promise.reject(new Error('Description must be at least 3 characters'));
        if (value.length > 250)
            return Promise.reject(new Error('Description must not exceed 250 characters'));
        if (/\s{2,}/.test(value))
            return Promise.reject(new Error('Description cannot contain consecutive whitespaces'));
        return Promise.resolve();
    };

    return (
        <Modal
            open={visible}
            title="Order Return"
            onCancel={onCancel}
            footer={null}
            className="no-border-radius"
        >
            <Title level={5} style={{ color: '#EA3639', marginTop: '10px' }}>
                Are you sure you want to return your order?
            </Title>
            <Paragraph className="font-roboto text-base mt-4">
                Please Note: If your payment method is a bank account, please ensure that you have
                updated your bank account information in your profile.
            </Paragraph>

            <Form<ProductReturnFormValues> onFinish={onFinish} initialValues={{ description: '' }}>
                <Row gutter={16} className="mt-6">
                    <Col span={24}>
                        <Typography.Text className="font-roboto text-base">
                            Select a reason of your return
                        </Typography.Text>
                        <Form.Item
                            name="reason"
                            rules={[{ required: true, message: 'Please select the reason' }]}
                        >
                            <Select
                                placeholder="Select a reason of your return"
                                className="rounded-non"
                            >
                                {productReturnReasons.map((v, i) => (
                                    <Option key={i} value={v}>
                                        {v}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={24}>
                        <Typography.Text className="font-roboto text-base">
                            Description
                        </Typography.Text>
                        <Form.Item
                            name="description"
                            rules={[
                                { required: true, message: 'Please enter the description' },
                                { validator: validateDescription },
                            ]}
                        >
                            <Input.TextArea
                                placeholder="Enter description"
                                maxLength={250}
                                rows={3}
                                showCount={!isMobile}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row justify="end">
                    <Col>
                        <Form.Item>
                            <Button
                                loading={isLoading}
                                type="primary"
                                htmlType="submit"
                                className="bg-bgOrange2  font-extralight"
                                style={{ borderRadius: '4px' }}
                            >
                                Submit
                            </Button>
                            <Button
                                onClick={onCancel}
                                style={{ marginLeft: 8, borderRadius: '4px' }}
                                className=""
                            >
                                Cancel
                            </Button>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default ProductReturnModal;
