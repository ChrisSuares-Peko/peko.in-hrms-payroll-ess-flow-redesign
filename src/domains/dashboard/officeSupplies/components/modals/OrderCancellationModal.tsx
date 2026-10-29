import React, { useState } from 'react';

import { Modal, Form, Select, Input, Button, Typography, Row, Col, Grid } from 'antd';

import { Scope } from '@src/enums/enums';
import { useAppSelector } from '@src/hooks/store';

import CancelOtpModal from './CancelOtpModal';
import { getOtpOrderCancel } from '../../api/orderHistory';
import { orderCancellationReasons } from '../../utils/data';

interface OrderCancellationFormValues {
    reason: string;
    description: string;
    otp: string;
    scope: string;
}

interface OrderCancellationModalProps {
    visible: boolean;
    isLoading: boolean;
    onCancel: () => void;
    onSubmit: any;
}

const { Title, Paragraph } = Typography;
const { Option } = Select;

const OrderCancellationModal: React.FC<OrderCancellationModalProps> = ({
    visible,
    onCancel,
    onSubmit,
    isLoading,
}) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [isOpen, setIsOpen] = useState(false);
    const [isOtpSending, setIsOtpSending] = useState(false);
    const [formValues, setFormValues] = useState<OrderCancellationFormValues | null>(null);

    const onFinish = async (values: OrderCancellationFormValues) => {
        setIsOtpSending(true);
        setFormValues(values);

        const resp = await getOtpOrderCancel({
            userId: id,
            userType: role,
            scope: Scope.EMAIL,
        });
        if (resp) {
            setIsOtpSending(false);
            setIsOpen(true);
        } else {
            setIsOtpSending(false);
            // Handle error if OTP request fails
        }
    };

    const handleOtpSubmit = async (otp: string) => {
        if (formValues) {
            const finalValues = { ...formValues, otp, scope: Scope.EMAIL };
            const response = await onSubmit(finalValues);
            if (response) {
                setIsOpen(false);
            }
        }
    };
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const isMobile = !screens.sm;

    return (
        <>
            <Modal
                open={visible}
                title="Order Cancellation"
                onCancel={onCancel}
                footer={null}
                className="no-border-radius"
                destroyOnClose
            >
                <Title level={5} style={{ color: '#EA3639', marginTop: '10px' }}>
                    Are you sure you want to cancel your order?
                </Title>
                <Paragraph className="font-roboto text-base mt-4">
                    Please Note: If your payment method is a bank account, please ensure that you
                    have updated your bank account information in your profile.
                </Paragraph>

                <Form<OrderCancellationFormValues>
                    onFinish={onFinish}
                    initialValues={{ description: '' }}
                >
                    <Row gutter={16} className="mt-6">
                        <Col span={24}>
                            <Typography.Text className="font-roboto text-base">
                                Select a reason for your order cancellation
                            </Typography.Text>
                            <Form.Item
                                name="reason"
                                rules={[{ required: true, message: 'Please select the reason' }]}
                            >
                                <Select
                                    placeholder="Select a reason for your order cancellation"
                                    className="rounded-non"
                                >
                                    {orderCancellationReasons.map((v, i) => (
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
                                    {
                                        validator: (rule, value) => {
                                            if (value === '') {
                                                return Promise.resolve();
                                            }
                                            if (/^\s/.test(value) || /\s$/.test(value)) {
                                                return Promise.reject(
                                                    new Error(
                                                        'Description cannot start or end with a blank space.'
                                                    )
                                                );
                                            }
                                            if (value.length < 3) {
                                                return Promise.reject(
                                                    new Error(
                                                        'Description must be at least 3 characters'
                                                    )
                                                );
                                            }
                                            if (value.length > 200) {
                                                return Promise.reject(
                                                    new Error(
                                                        'Description must not accept more than 250 characters'
                                                    )
                                                );
                                            }
                                            if (/\s{2,}/.test(value)) {
                                                return Promise.reject(
                                                    new Error(
                                                        'Description cannot contain consecutive blank spaces.'
                                                    )
                                                );
                                            }
                                            return Promise.resolve();
                                        },
                                    },
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
                                    loading={isOtpSending}
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
            <CancelOtpModal
                zIndex={2000}
                isOpen={isOpen}
                isLoading={isLoading!}
                handleCancel={() => setIsOpen(false)}
                isOtpSending={isOtpSending}
                onResend={async () => {
                    setIsOtpSending(true);
                    await getOtpOrderCancel({
                        userId: id,
                        userType: role,
                        scope: Scope.EMAIL,
                    });
                    setIsOtpSending(false);
                }}
                handleSubmit={handleOtpSubmit}
                title="Confirmation"
            />
        </>
    );
};

export default OrderCancellationModal;
