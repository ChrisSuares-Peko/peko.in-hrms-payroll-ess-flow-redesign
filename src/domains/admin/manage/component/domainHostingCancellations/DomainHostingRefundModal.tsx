import React, { useEffect } from 'react';

import { Descriptions, Form, Input, InputNumber, Modal, Tag, Typography } from 'antd';

import { formattedDateOnly } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import useProcessRefund from '../../hooks/domainHostingCancellations/useProcessRefund';
import { DomainHostingCancellation } from '../../types/domainHostingCancellations';

const { Text } = Typography;

interface Props {
    open: boolean;
    record: DomainHostingCancellation;
    onClose: () => void;
    onSuccess: () => void;
}

const DomainHostingRefundModal = ({ open, record, onClose, onSuccess }: Props) => {
    const [form] = Form.useForm();
    const { submitRefund, isLoading } = useProcessRefund(() => {
        onSuccess();
        onClose();
    });

    useEffect(() => {
        if (open) {
            form.setFieldsValue({
                refundAmount: record.amountInINR,
                remarks: '',
            });
        }
    }, [open, record, form]);

    const handleOk = async () => {
        const values = await form.validateFields();
        await submitRefund(record.corporateTxnId, values.refundAmount, values.remarks);
    };

    const { orderResponse } = record;
    const items = Array.isArray(orderResponse?.items) ? (orderResponse.items as any[]) : [];

    return (
        <Modal
            title="Process Refund"
            open={open}
            onOk={handleOk}
            onCancel={onClose}
            okText="Process Refund"
            confirmLoading={isLoading}
            width={560}
        >
            <Descriptions size="small" column={1} bordered className="mb-4">
                <Descriptions.Item label="Txn ID">
                    <Text copyable>{record.corporateTxnId}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Customer">
                    {record.credential?.name || record.credential?.username || '—'}
                    {record.credential?.username && (
                        <Text type="secondary" className="ml-1 text-xs">
                            ({record.credential.username})
                        </Text>
                    )}
                </Descriptions.Item>
                <Descriptions.Item label="Date">
                    {formattedDateOnly(new Date(record.transactionDate))}
                </Descriptions.Item>
                <Descriptions.Item label="Amount Paid">
                    ₹ {formatNumberWithLocalString(record.amountInINR)}
                </Descriptions.Item>
                <Descriptions.Item label="Payment Mode">
                    <Tag>{record.paymentMode}</Tag>
                </Descriptions.Item>
                {items.length > 0 && (
                    <Descriptions.Item label="Items">
                        {items.map((item: any, i: number) => (
                            <Tag key={i} className="mb-1">
                                {item.productName || item.itemType}
                            </Tag>
                        ))}
                    </Descriptions.Item>
                )}
                {orderResponse?.cancelledItemType && (
                    <Descriptions.Item label="Cancelled Item">
                        <Tag color="red">{orderResponse.cancelledItemType}</Tag>
                    </Descriptions.Item>
                )}
            </Descriptions>

            <Form form={form} layout="vertical">
                <Form.Item
                    name="refundAmount"
                    label="Refund Amount (₹)"
                    rules={[
                        { required: true, message: 'Please enter the refund amount' },
                        {
                            validator: (_, value) => {
                                if (!value || value <= 0)
                                    return Promise.reject(
                                        new Error('Refund amount must be greater than 0')
                                    );
                                if (value > record.amountInINR)
                                    return Promise.reject(
                                        new Error(
                                            `Cannot exceed paid amount of ₹${record.amountInINR}`
                                        )
                                    );
                                return Promise.resolve();
                            },
                        },
                    ]}
                >
                    <InputNumber
                        className="w-full"
                        min={0.01}
                        max={record.amountInINR}
                        precision={2}
                        prefix="₹"
                    />
                </Form.Item>
                <Form.Item
                    name="remarks"
                    label="Remarks"
                    rules={[
                        { required: true, message: 'Please enter remarks' },
                        { whitespace: true, message: 'Remarks cannot be blank' },
                    ]}
                >
                    <Input.TextArea
                        rows={3}
                        placeholder="Enter reason for refund..."
                        maxLength={500}
                        showCount
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default DomainHostingRefundModal;
