import React from 'react';

import { CheckCircleFilled, ClockCircleFilled } from '@ant-design/icons';
import { Button, Col, Flex, Modal, Row, Space, Tag, Typography } from 'antd';

import useDownloadPayoutReceiptApi from '../hooks/useDownloadPayoutReceiptApi';
import { PayoutTransferResponse } from '../types';

const { Text, Title } = Typography;

interface PayoutSuccessModalProps {
    visible: boolean;
    onClose: () => void;
    transactionData: PayoutTransferResponse | null;
}

const PayoutSuccessModal: React.FC<PayoutSuccessModalProps> = ({ visible, onClose, transactionData }) => {
    const { downloadReceipt, isLoading: receiptLoading } = useDownloadPayoutReceiptApi();
    const isSuccess =
        transactionData?.transactionStatus?.toLowerCase() === 'success' ||
        transactionData?.transactionStatus?.toLowerCase() === 'completed';

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            centered
            width={660}
            closable={false}
            modalRender={(node) => (
                <div style={{ borderRadius: 24, overflow: 'hidden' }}>{node}</div>
            )}
            style={{ top: 40, borderRadius: 24, overflow: 'hidden' }}
            bodyStyle={{ borderRadius: 24, overflow: 'hidden' }}
        >
            <Space direction="vertical" size={24} className="w-full" style={{ alignItems: 'stretch', paddingBottom: 20 }}>
                <Flex justify="center" style={{ marginTop: 16 }}>
                    <Space direction="vertical" size={16} style={{ alignItems: 'center' }}>
                        <Space
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: isSuccess ? '#dcfce7' : '#FFF7E6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: isSuccess ? '0 0 0 12px #f0fdf4' : '0 0 0 12px #FFFBE6',
                            }}
                        >
                            {isSuccess
                                ? <CheckCircleFilled style={{ fontSize: 40, color: '#22c55e' }} />
                                : <ClockCircleFilled style={{ fontSize: 40, color: '#FAAD14' }} />
                            }
                        </Space>

                        <Space direction="vertical" size={4} style={{ alignItems: 'center' }}>
                            <Title level={3} className="m-0">
                                {isSuccess ? 'Payout Successful!' : 'Payout Initiated!'}
                            </Title>
                            <Text type="secondary">
                                {isSuccess
                                    ? 'Your payment has been processed successfully'
                                    : 'Your payment has been initiated and is being processed'
                                }
                            </Text>
                        </Space>
                    </Space>
                </Flex>

                <Flex vertical gap={14} style={{ width: '100%', borderRadius: 12, border: '1.5px solid #d1d5db', padding: '14px 16px' }}>
                    <Title level={5} className="m-0">Payment Summary</Title>

                    {transactionData?.amount !== undefined && (
                        <Flex justify="space-between" align="center" className="w-full">
                            <Text type="secondary">Amount</Text>
                            <Text strong>
                                ₹{transactionData.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        </Flex>
                    )}

                    <Flex justify="space-between" align="center" className="w-full">
                        <Text type="secondary">Transaction ID</Text>
                        <Text strong>{transactionData?.referenceId ?? '—'}</Text>
                    </Flex>

                    <Flex justify="space-between" align="center" className="w-full">
                        <Text type="secondary">Status</Text>
                        <Tag color={isSuccess ? 'success' : 'warning'} style={{ margin: 0 }}>
                            {isSuccess ? 'Completed' : 'Pending'}
                        </Tag>
                    </Flex>

                    <Flex justify="space-between" align="center" className="w-full">
                        <Text type="secondary">Date & Time</Text>
                        <Text strong>
                            {transactionData?.paidAt
                                ? new Date(transactionData.paidAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                                : '—'}
                        </Text>
                    </Flex>
                </Flex>

                {isSuccess ? (
                    <Row gutter={12} className="w-full">
                        <Col span={12}>
                            <Button block onClick={onClose} style={{ borderRadius: 8, height: 44 }}>
                                Close
                            </Button>
                        </Col>
                        <Col span={12}>
                            <Button
                                block
                                type="primary"
                                loading={receiptLoading}
                                disabled={!transactionData?.transactionId}
                                onClick={() => transactionData?.transactionId && downloadReceipt(transactionData.transactionId)}
                                style={{ borderRadius: 8, height: 44, background: '#FF4D4F', borderColor: '#FF4D4F' }}
                            >
                                Download Receipt
                            </Button>
                        </Col>
                    </Row>
                ) : (
                    <Button block onClick={onClose} style={{ borderRadius: 8, height: 44 }}>
                        Close
                    </Button>
                )}
            </Space>
        </Modal>
    );
};

export default PayoutSuccessModal;
