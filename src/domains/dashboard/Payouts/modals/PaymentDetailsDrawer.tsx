import React, { useEffect, useState } from 'react';

import { ArrowRightOutlined, ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Drawer, Flex, Row, Select, Space, Typography } from 'antd';

import LoadFundsModal from './LoadFundsModal';
import { InvoiceData } from '../../Procure/types';
import { formatShortDate } from '../../Procure/utils';
import useNupayMerchants from '../hooks/useNupayMerchants';
import useNupayWalletBalance from '../hooks/useNupayWalletBalance';
import usePayInvoiceApi from '../hooks/usePayInvoiceApi';
import { PayoutTransferResponse } from '../types';

const { Text, Title } = Typography;

interface PaymentDetailsDrawerProps {
    visible: boolean;
    selectedInvoices: InvoiceData[];
    onCancel: () => void;
    onProcessPayment: (result: PayoutTransferResponse | null) => void;
}

const PaymentDetailsDrawer: React.FC<PaymentDetailsDrawerProps> = ({
    visible,
    selectedInvoices,
    onCancel,
    onProcessPayment,
}) => {
    const [loadFundsOpen, setLoadFundsOpen] = useState(false);
    const [transferType, setTransferType] = useState<string>('NEFT');

    const { statusData: nupayStatus } = useNupayMerchants();
    const { fetchBalance, balance, isLoading: balanceLoading, ifsc: walletIfsc } = useNupayWalletBalance();
    const vaIfsc = nupayStatus?.vaIfsc ?? walletIfsc ?? null;
    const { pay, isSubmitting } = usePayInvoiceApi();

    useEffect(() => {
        if (visible) {
            fetchBalance();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const handleProcessPayment = async () => {
        const results = await Promise.all(
            selectedInvoices.map(invoice => pay(invoice.id, transferType))
        );
        if (results.every(Boolean)) {
            const last = results[results.length - 1] as PayoutTransferResponse;
            onProcessPayment({ ...last, amount: totalAmount, paidAt: new Date().toISOString() });
        }
    };

    const totalAmount = selectedInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const isInsufficient = balance !== null && balance < totalAmount;

    const formattedBalance = balance !== null
        ? `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '—';

    const vaCardBg = isInsufficient
        ? 'linear-gradient(135deg, #fff1f0 0%, #ffe4e6 100%)'
        : 'linear-gradient(135deg, #e6f7f0 0%, #d0f0e4 100%)';

    const balanceColor = isInsufficient ? '#FF4D4F' : '#43B75D';

    return (
        <>
            <Drawer
                open={visible && !loadFundsOpen}
                onClose={onCancel}
                placement="right"
                width={520}
                closable={false}
                title={
                    <Space direction="vertical" size={2}>
                        <Title level={4} className="m-0">Add Bill Payout</Title>
                        <Text type="secondary" style={{ fontSize: 13, fontWeight: 'normal' }}>
                            Fill in the bill details below
                        </Text>
                    </Space>
                }
                footer={
                    <Row justify="end" gutter={12}>
                        <Col>
                            <Button onClick={onCancel} style={{ borderRadius: 8 }}>Cancel</Button>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                onClick={handleProcessPayment}
                                disabled={isInsufficient}
                                loading={isSubmitting}
                                style={{ borderRadius: 8, background: '#FF4D4F', borderColor: '#FF4D4F' }}
                            >
                                Process Payment <ArrowRightOutlined />
                            </Button>
                        </Col>
                    </Row>
                }
            >
                <Space direction="vertical" size={16} className="w-full">
                    {/* VA Balance Card */}
                    <div style={{
                        background: vaCardBg,
                        borderRadius: 14,
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <div>
                            <Text style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 4 }}>
                                Virtual Account
                            </Text>
                            {balanceLoading ? (
                                <Text style={{ fontSize: 28, fontWeight: 700, color: balanceColor }}>Loading...</Text>
                            ) : (
                                <Text style={{ fontSize: 28, fontWeight: 700, color: balanceColor, display: 'block', lineHeight: 1.2 }}>
                                    {formattedBalance}
                                </Text>
                            )}
                            <Text style={{ fontSize: 12, color: '#64748b', display: 'block', marginTop: 4 }}>
                                {nupayStatus?.vaNumber ?? '—'}
                            </Text>
                        </div>
                        <Flex vertical align="flex-end" gap={6}>
                            <Button
                                size="small"
                                onClick={() => setLoadFundsOpen(true)}
                                style={{
                                    borderRadius: 8,
                                    fontSize: 12,
                                    borderColor: isInsufficient ? '#FF4D4F' : '#43b75d',
                                    color: isInsufficient ? '#fff' : '#43b75d',
                                    background: isInsufficient ? '#FF4D4F' : '#fff',
                                }}
                            >
                                Load Funds
                            </Button>
                            {isInsufficient && (
                                <Flex align="center" gap={4}>
                                    <ExclamationCircleOutlined style={{ color: '#FF4D4F', fontSize: 11 }} />
                                    <Text style={{ fontSize: 11, color: '#FF4D4F' }}>Insufficient balance</Text>
                                </Flex>
                            )}
                        </Flex>
                    </div>

                    {/* Insufficient funds warning banner */}
                    {isInsufficient && (
                        <Flex
                            align="center"
                            gap={10}
                            style={{
                                background: '#fff1f0',
                                border: '1px solid #ffccc7',
                                borderRadius: 10,
                                padding: '10px 14px',
                            }}
                        >
                            <WarningOutlined style={{ color: '#FF4D4F', fontSize: 16 }} />
                            <Text style={{ fontSize: 13, color: '#FF4D4F' }}>
                                Insufficient funds. Load funds into your virtual account to proceed.
                            </Text>
                        </Flex>
                    )}

                    {/* Payment Mode */}
                    <Space direction="vertical" size={6} className="w-full">
                        <Text strong>Payment Mode</Text>
                        <Select
                            className="w-full"
                            value={transferType}
                            onChange={setTransferType}
                            options={[
                                { value: 'NEFT', label: 'NEFT - National Electronic Funds Transfer' },
                                { value: 'RTGS', label: 'RTGS - Real Time Gross Settlement' },
                                { value: 'IMPS', label: 'IMPS - Immediate Payment Service' },
                            ]}
                        />
                    </Space>

                    {/* Payment Details */}
                    <Space direction="vertical" size={12} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl">
                        <Text strong>Payment Details</Text>
                        {selectedInvoices.map((invoice, index) => (
                            <Card
                                key={invoice.id}
                                size="small"
                                style={{ borderRadius: 10, border: '1px solid #e5e7eb' }}
                                styles={{ body: { padding: '12px 14px' } }}
                            >
                                <Text strong style={{ fontSize: 13 }}>Bill {index + 1}</Text>
                                <Divider className="my-2" />
                                <Space direction="vertical" size={6} className="w-full">
                                    <Row justify="space-between">
                                        <Col><Text type="secondary" style={{ fontSize: 12 }}>Bill Amount</Text></Col>
                                        <Col>
                                            <Text strong style={{ fontSize: 12 }}>
                                                ₹{parseFloat(invoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </Text>
                                        </Col>
                                    </Row>
                                    <Row justify="space-between">
                                        <Col><Text type="secondary" style={{ fontSize: 12 }}>Vendor</Text></Col>
                                        <Col><Text style={{ fontSize: 12 }}>{invoice.purchaseOrder?.vendor?.businessName ?? '—'}</Text></Col>
                                    </Row>
                                    <Row justify="space-between">
                                        <Col><Text type="secondary" style={{ fontSize: 12 }}>Bill Number</Text></Col>
                                        <Col><Text style={{ fontSize: 12 }}>{invoice.invoiceNumber}</Text></Col>
                                    </Row>
                                    <Row justify="space-between">
                                        <Col><Text type="secondary" style={{ fontSize: 12 }}>Date</Text></Col>
                                        <Col><Text style={{ fontSize: 12 }}>{formatShortDate(invoice.invoiceDate)}</Text></Col>
                                    </Row>
                                    <Row justify="space-between">
                                        <Col><Text type="secondary" style={{ fontSize: 12 }}>Bank Account</Text></Col>
                                        <Col><Text style={{ fontSize: 12 }}>{invoice.purchaseOrder?.vendor?.accountNumber ?? invoice.accountNumber ?? '—'}</Text></Col>
                                    </Row>
                                    <Row justify="space-between">
                                        <Col><Text type="secondary" style={{ fontSize: 12 }}>IFSC Code</Text></Col>
                                        <Col><Text style={{ fontSize: 12 }}>{invoice.purchaseOrder?.vendor?.ifscCode ?? invoice.ifscCode ?? '—'}</Text></Col>
                                    </Row>
                                </Space>
                            </Card>
                        ))}
                    </Space>
                </Space>
            </Drawer>

            <LoadFundsModal
                open={loadFundsOpen}
                onBack={() => setLoadFundsOpen(false)}
                onboardingRecord={{
                    virtualAccountNumber: nupayStatus?.vaNumber ?? null,
                    virtualIfsc: vaIfsc,
                    status: nupayStatus?.vaNumber ? 'active' : null,
                }}
                balance={balance}
                balanceLoading={balanceLoading}
                virtualAccountNumber={nupayStatus?.vaNumber ?? null}
                ifsc={vaIfsc}
            />
        </>
    );
};

export default PaymentDetailsDrawer;
