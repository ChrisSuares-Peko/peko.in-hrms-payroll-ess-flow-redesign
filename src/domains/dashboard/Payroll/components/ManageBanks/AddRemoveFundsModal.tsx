import { useState } from 'react';

import { BankOutlined, CopyOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Input, InputNumber, Modal, Row, Tabs, Tag, Typography } from 'antd';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { CARD_BORDER, LABEL_COLOR, RED, VALUE_COLOR } from './constants';

const { Text } = Typography;

interface OnboardingBankDetails {
    accountHolderName?: string | null;
    bankName?: string | null;
    accountNumber?: string | null;
    ifscCode?: string | null;
}

interface AddRemoveFundsModalProps {
    open: boolean;
    onClose: () => void;
    accountHolderName: string | null;
    virtualAccountNumber: string | null;
    ifsc: string | null;
    bankDetails?: OnboardingBankDetails;
    availableBalance?: number | null;
    isWithdrawing?: boolean;
    onWithdraw?: (payload: {
        amount: number;
        transferType: 'IMPS';
        remarks: string;
    }) => Promise<boolean | void>;
}

const PAYMENT_METHODS = [
    { key: 'NEFT', label: 'NEFT', description: 'Settles in 2-4 hours' },
    { key: 'IMPS', label: 'IMPS', description: 'Instant transfer' },
    { key: 'RTGS', label: 'RTGS', description: 'For ₹2L and above' },
];

const writeTextToClipboard = async (value: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
    }

    if (typeof document === 'undefined') {
        throw new Error('Clipboard is not available');
    }

    const textArea = document.createElement('textarea');
    textArea.value = value;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.select();

    try {
        const isCopied = document.execCommand('copy');
        if (!isCopied) {
            throw new Error('Copy command failed');
        }
    } finally {
        document.body.removeChild(textArea);
    }
};

const CopyableField = ({
    label,
    value,
    onCopy,
}: {
    label: string;
    value: string;
    onCopy: (label: string, value: string) => void;
}) => (
    <Flex
        justify="space-between"
        align="center"
        style={{
            background: '#f8fafc',
            borderRadius: 8,
            padding: '12px 16px',
        }}
    >
        <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 12, color: LABEL_COLOR }}>{label}</Text>
            <Text style={{ fontSize: 14, fontWeight: 600, color: VALUE_COLOR }} ellipsis>
                {value || '—'}
            </Text>
        </Flex>
        <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => onCopy(label, value)}
            style={{ color: LABEL_COLOR }}
        />
    </Flex>
);

const AddRemoveFundsModal = ({
    open,
    onClose,
    accountHolderName,
    virtualAccountNumber,
    ifsc,
    bankDetails,
    availableBalance,
    isWithdrawing = false,
    onWithdraw,
}: AddRemoveFundsModalProps) => {
    const dispatch = useAppDispatch();
    const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add');
    const [amount, setAmount] = useState<number | null>(null);

    const handleCopy = async (label: string, value: string) => {
        const copyValue = value.trim();

        if (!copyValue) {
            dispatch(showToast({ variant: 'error', description: `${label} is not available to copy` }));
            return;
        }

        try {
            await writeTextToClipboard(copyValue);
            dispatch(showToast({ variant: 'success', description: `${label} copied successfully` }));
        } catch {
            dispatch(showToast({
                variant: 'error',
                description: `Unable to copy ${label.toLowerCase()}. Please try again`,
            }));
        }
    };

    const handleClose = () => {
        if (isWithdrawing) return;
        setActiveTab('add');
        setAmount(null);
        onClose();
    };

    const handleWithdrawFunds = async () => {
        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            dispatch(showToast({ variant: 'error', description: 'Please enter a valid amount' }));
            return;
        }

        if (availableBalance != null && numericAmount > availableBalance) {
            dispatch(showToast({
                variant: 'error',
                description: 'Amount cannot exceed available balance',
            }));
            return;
        }

        if (!bankDetails?.accountNumber || !bankDetails?.ifscCode || !bankDetails?.accountHolderName) {
            dispatch(showToast({
                variant: 'error',
                description: 'Settlement bank details are missing',
            }));
            return;
        }

        if (!onWithdraw) {
            dispatch(showToast({
                variant: 'error',
                description: 'Remove funds service is not available',
            }));
            return;
        }

        const ok = await onWithdraw({
            amount: numericAmount,
            transferType: 'IMPS',
            remarks: 'Virtual account withdrawal',
        });

        if (ok !== false) {
            handleClose();
        }
    };

    const renderAddFunds = () => (
        <Flex vertical gap={20}>
            <Flex vertical gap={4}>
                <Text style={{ fontSize: 14, fontWeight: 600, color: VALUE_COLOR }}>
                    Transfer to your virtual account
                </Text>
                <Text style={{ fontSize: 12, color: LABEL_COLOR }}>
                    Use the following account details to top up your virtual account from any
                    bank.
                </Text>
            </Flex>

            <Card style={{ border: CARD_BORDER, borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
                <Flex vertical gap={10}>
                    <CopyableField
                        label="Account Holder"
                        value={accountHolderName || ''}
                        onCopy={handleCopy}
                    />
                    <CopyableField
                        label="Account Number"
                        value={virtualAccountNumber || ''}
                        onCopy={handleCopy}
                    />
                    <CopyableField label="IFSC Code" value={ifsc || ''} onCopy={handleCopy} />
                    <Flex
                        justify="space-between"
                        align="center"
                        style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 16px' }}
                    >
                        <Flex vertical gap={2} style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, color: LABEL_COLOR }}>Bank Name</Text>
                            <Text style={{ fontSize: 14, fontWeight: 600, color: VALUE_COLOR }}>
                                Peko Bank
                            </Text>
                        </Flex>
                        <BankOutlined style={{ fontSize: 18, color: LABEL_COLOR }} />
                    </Flex>
                </Flex>
            </Card>

            <Flex vertical gap={10}>
                <Text style={{ fontSize: 14, fontWeight: 600, color: VALUE_COLOR }}>
                    Allowed Payment Methods
                </Text>
                <Row gutter={[12, 12]}>
                    {PAYMENT_METHODS.map((method) => (
                        <Col key={method.key} span={12}>
                            <Card
                                size="small"
                                style={{ background: '#f8fafc', border: 'none', borderRadius: 8 }}
                                styles={{ body: { padding: '12px 14px' } }}
                            >
                                <Flex justify="space-between" align="center">
                                    <Flex vertical gap={2}>
                                        <Text style={{ fontSize: 13, fontWeight: 600, color: VALUE_COLOR }}>
                                            {method.label}
                                        </Text>
                                        <Text style={{ fontSize: 11, color: LABEL_COLOR }}>
                                            {method.description}
                                        </Text>
                                    </Flex>
                                    <Tag color="success" style={{ margin: 0, borderRadius: 12, fontSize: 11 }}>
                                        Allowed
                                    </Tag>
                                </Flex>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Flex>
        </Flex>
    );

    const renderRemoveFunds = () => (
        <Flex vertical gap={20}>
            <Flex vertical gap={4}>
                <Text style={{ fontSize: 14, fontWeight: 600, color: VALUE_COLOR }}>
                    Withdraw to your registered bank account
                </Text>
                <Text style={{ fontSize: 12, color: LABEL_COLOR }}>
                    Funds will be transferred to the bank account you provided during onboarding.
                </Text>
            </Flex>

            <Flex vertical gap={6}>
                <Text style={{ fontSize: 12, color: LABEL_COLOR }}>Amount</Text>
                <InputNumber
                    value={amount}
                    onChange={(value) => setAmount(typeof value === 'number' ? value : Number(value) || null)}
                    placeholder="Enter amount"
                    size="large"
                    prefix={<Text style={{ color: LABEL_COLOR }}>₹</Text>}
                    style={{ width: '100%', borderRadius: 8 }}
                    min={1}
                    controls={false}
                    formatter={(val) => (val ? Number(val).toLocaleString('en-IN') : '')}
                />
            </Flex>

            <Flex vertical gap={10}>
                <Text style={{ fontSize: 13, fontWeight: 600, color: VALUE_COLOR }}>
                    Bank Details
                </Text>
                <Row gutter={[12, 12]}>
                    <Col span={12}>
                        <Flex vertical gap={6}>
                            <Text style={{ fontSize: 12, color: LABEL_COLOR }}>
                                Account Holder Name
                            </Text>
                            <Input
                                disabled
                                value={bankDetails?.accountHolderName || ''}
                                style={{ borderRadius: 8 }}
                            />
                        </Flex>
                    </Col>
                    <Col span={12}>
                        <Flex vertical gap={6}>
                            <Text style={{ fontSize: 12, color: LABEL_COLOR }}>Bank Name</Text>
                            <Input
                                disabled
                                value={bankDetails?.bankName || ''}
                                style={{ borderRadius: 8 }}
                            />
                        </Flex>
                    </Col>
                    <Col span={12}>
                        <Flex vertical gap={6}>
                            <Text style={{ fontSize: 12, color: LABEL_COLOR }}>Account Number</Text>
                            <Input
                                disabled
                                value={bankDetails?.accountNumber || ''}
                                style={{ borderRadius: 8 }}
                            />
                        </Flex>
                    </Col>
                    <Col span={12}>
                        <Flex vertical gap={6}>
                            <Text style={{ fontSize: 12, color: LABEL_COLOR }}>IFSC Code</Text>
                            <Input
                                disabled
                                value={bankDetails?.ifscCode || ''}
                                style={{ borderRadius: 8 }}
                            />
                        </Flex>
                    </Col>
                </Row>
            </Flex>

            <Flex justify="flex-end" gap={12} style={{ marginTop: 8 }}>
                <Button
                    onClick={handleClose}
                    disabled={isWithdrawing}
                    style={{ borderRadius: 8, height: 38, padding: '0 20px' }}
                >
                    Cancel
                </Button>
                <Button
                    loading={isWithdrawing}
                    disabled={isWithdrawing}
                    onClick={handleWithdrawFunds}
                    style={{
                        borderRadius: 8,
                        height: 38,
                        padding: '0 20px',
                        background: RED,
                        borderColor: RED,
                        color: '#fff',
                    }}
                >
                    Withdraw Funds
                </Button>
            </Flex>
        </Flex>
    );

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            centered
            width="clamp(420px, 50vw, 720px)"
            styles={{ content: { borderRadius: 16, padding: '24px 28px' } }}
            closeIcon={null}
            destroyOnClose
        >
            <Flex vertical gap={4} style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 'clamp(16px, 1.2vw, 20px)', fontWeight: 700, color: VALUE_COLOR }}>
                    Add / Remove Funds
                </Text>
                <Text style={{ fontSize: 'clamp(12px, 0.85vw, 14px)', color: LABEL_COLOR }}>
                    Manage your virtual account balance.
                </Text>
            </Flex>

            <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key as 'add' | 'remove')}
                style={{ '--ant-color-primary': RED } as React.CSSProperties}
                items={[
                    {
                        key: 'add',
                        label: (
                            <Flex align="center" gap={6}>
                                <DownloadOutlined />
                                <span>Add Funds</span>
                            </Flex>
                        ),
                        children: renderAddFunds(),
                    },
                    {
                        key: 'remove',
                        label: (
                            <Flex align="center" gap={6}>
                                <UploadOutlined />
                                <span>Remove Funds</span>
                            </Flex>
                        ),
                        children: renderRemoveFunds(),
                    },
                ]}
            />
        </Modal>
    );
};

export default AddRemoveFundsModal;
