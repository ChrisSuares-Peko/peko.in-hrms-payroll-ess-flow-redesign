import React, { useEffect, useState } from 'react';

import { ArrowRightOutlined, ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Modal, Select, Space, Typography } from 'antd';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import LoadFundsModal from './LoadFundsModal';
import useNupayMerchants from '../hooks/useNupayMerchants';
import useNupayWalletBalance from '../hooks/useNupayWalletBalance';
import usePayoutStatusApi from '../hooks/usePayoutStatusApi';
import usePostPayoutTransferApi from '../hooks/usePostPayoutTransferApi';
import { PendingRentPayout, PayoutTransferResponse } from '../types';

const { Text, Title } = Typography;

const paymentModeOptions = [
    { value: 'NEFT', label: 'NEFT - National Electronic Funds Transfer' },
    { value: 'RTGS', label: 'RTGS - Real Time Gross Settlement' },
    { value: 'IMPS', label: 'IMPS - Immediate Payment Service' },
];

interface MakePayoutModalProps {
    visible: boolean;
    onCancel: () => void;
    payoutData: PendingRentPayout | null;
    onProcessPayment: (result: PayoutTransferResponse) => void;
}

const MakePayoutModal: React.FC<MakePayoutModalProps> = ({
    visible,
    onCancel,
    payoutData,
    onProcessPayment,
}) => {
    const dispatch = useAppDispatch();
    const { submitPayoutTransfer, isLoading } = usePostPayoutTransferApi();
    const { stopPolling } = usePayoutStatusApi();
    const { statusData: nupayStatus } = useNupayMerchants();
    const { fetchBalance, balance, isLoading: balanceLoading, virtualAccountNumber, ifsc: walletIfsc } = useNupayWalletBalance();
    const ifsc = nupayStatus?.vaIfsc ?? walletIfsc ?? null;
    const [transferType, setTransferType] = useState<string>('NEFT');
    const [loadFundsOpen, setLoadFundsOpen] = useState(false);

    const isInsufficient = balance !== null && payoutData?.amount != null && balance < payoutData.amount;
    const balanceColor = isInsufficient ? '#FF4D4F' : '#43B75D';
    const vaCardBg = isInsufficient
        ? 'linear-gradient(135deg, #fff1f0 0%, #ffe4e6 100%)'
        : '#ECFDF5';

    useEffect(() => {
        if (visible) {
            fetchBalance();
        } else {
            stopPolling();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const handleProcess = async () => {
        if (!payoutData) return;

        const res = await submitPayoutTransfer({
            rentBillId: payoutData.rentBillId,
            beneficiaryId: payoutData.beneficiaryId,
            amount: payoutData.amount,
            transferType,
            category: payoutData.category,
            ifsc: ifsc ?? undefined,
            virtualAccountNumber: nupayStatus?.vaNumber ?? virtualAccountNumber ?? undefined,
        });
        if (res) {
            onProcessPayment(res);
        } else {
            dispatch(showToast({ description: 'Payout transfer failed. Please try again.', variant: 'error' }));
        }
    };

    return (
        <>
            <Modal
                open={visible && !loadFundsOpen}
                onCancel={onCancel}
                footer={null}
                centered
                width={520}
                styles={{ content: { borderRadius: 20 } }}
                title={<Title level={4} className="m-0">Make Payout</Title>}
            >
                <Space direction="vertical" size={20} className="w-full mt-5">
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
                                    ₹{balance !== null ? balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                                </Text>
                            )}
                            <Text style={{ fontSize: 12, color: '#64748b', display: 'block', marginTop: 4 }}>
                                {virtualAccountNumber ?? '—'}
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

                    <Space direction="vertical" size={8} className="w-full">
                        <Text strong>Payment Mode</Text>
                        <Select
                            className="w-full"
                            value={transferType}
                            onChange={setTransferType}
                            options={paymentModeOptions}
                        />
                    </Space>

                    <Space
                        direction="vertical"
                        size={12}
                        className="w-full rounded-xl border border-[#e5e7eb] p-4 bg-[#F8FAFC]"
                    >
                        <Text strong>Payment Details</Text>
                        <Divider className="m-0" />

                        <Flex justify="space-between" className="w-full">
                            <Text type="secondary">Vendor Name:</Text>
                            <Text>{payoutData?.payeeName ?? '—'}</Text>
                        </Flex>
                        <Flex justify="space-between" className="w-full">
                            <Text type="secondary">Bill Number:</Text>
                            <Text>#{payoutData?.rentBillId ?? '—'}</Text>
                        </Flex>
                        <Flex justify="space-between" className="w-full">
                            <Text type="secondary">Date:</Text>
                            <Text>{payoutData?.createdAt ? new Date(payoutData.createdAt).toISOString().slice(0, 10) : '—'}</Text>
                        </Flex>
                        <Flex justify="space-between" className="w-full">
                            <Text type="secondary">Bank Account:</Text>
                            <Text>{payoutData?.beneficiaryAccountNumber ?? '—'}</Text>
                        </Flex>
                        <Flex justify="space-between" className="w-full">
                            <Text type="secondary">IFSC Code:</Text>
                            <Text>{payoutData?.beneficiaryIfscCode ?? '—'}</Text>
                        </Flex>

                        <Divider className="m-0" />

                        <Flex justify="space-between" className="w-full">
                            <Text strong>Total Amount:</Text>
                            <Text strong style={{ fontSize: 16, color: isInsufficient ? '#FF4D4F' : undefined }}>
                                ₹{payoutData?.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
                            </Text>
                        </Flex>
                    </Space>

                    <Flex justify="end" gap={12} className="w-full">
                        <Button onClick={onCancel} style={{ borderRadius: 8 }}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            loading={isLoading}
                            disabled={isInsufficient}
                            onClick={handleProcess}
                            icon={<ArrowRightOutlined />}
                            iconPosition="end"
                            style={{ borderRadius: 8, background: '#FF4D4F', borderColor: '#FF4D4F' }}
                        >
                            Process Payment
                        </Button>
                    </Flex>
                </Space>
            </Modal>

            <LoadFundsModal
                open={loadFundsOpen}
                onBack={() => setLoadFundsOpen(false)}
                onboardingRecord={{
                    virtualAccountNumber: nupayStatus?.vaNumber ?? virtualAccountNumber,
                    virtualIfsc: ifsc,
                    status: (nupayStatus?.vaNumber ?? virtualAccountNumber) ? 'active' : null,
                }}
                balance={balance}
                balanceLoading={balanceLoading}
                virtualAccountNumber={nupayStatus?.vaNumber ?? virtualAccountNumber}
                ifsc={ifsc}
            />
        </>
    );
};

export default MakePayoutModal;
