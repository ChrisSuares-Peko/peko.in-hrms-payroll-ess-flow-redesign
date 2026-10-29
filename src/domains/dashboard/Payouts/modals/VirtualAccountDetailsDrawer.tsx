import { ArrowLeftOutlined, CheckCircleOutlined, CopyOutlined } from '@ant-design/icons';
import { Badge, Button, Divider, Drawer, Flex, Typography, message } from 'antd';

const { Text, Title } = Typography;

interface VirtualAccountDetailsDrawerProps {
    open: boolean;
    onClose: () => void;
    onboardingRecord: {
        businessName?: string | null;
        bankName?: string | null;
        virtualAccountNumber?: string | null;
        virtualIfsc?: string | null;
        accountHolderName?: string | null;
        phone?: string | null;
        pan?: string | null;
        status?: string | null;
    } | null;
    balance: number | null;
    balanceLoading?: boolean;
}

const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    message.success('Copied to clipboard');
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <Flex
        justify="space-between"
        align="center"
        style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 12px' }}
    >
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{label}</Text>
        <Flex align="center" gap={8}>
            <Text style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{value}</Text>
            <CopyOutlined
                style={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 13 }}
                onClick={() => copyToClipboard(value)}
            />
        </Flex>
    </Flex>
);

const VirtualAccountDetailsDrawer = ({
    open,
    onClose,
    onboardingRecord,
    balance,
    balanceLoading,
}: VirtualAccountDetailsDrawerProps) => {
    const isActive = onboardingRecord?.status === 'active';

    const formattedBalance = balance !== null
        ? `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '—';

    return (
        <Drawer
            open={open}
            onClose={onClose}
            placement="right"
            width={400}
            closable={false}
            title={
                <Flex align="center" gap={12}>
                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={onClose} size="small" />
                    <Flex vertical gap={1}>
                        <Flex align="center" gap={8}>
                            <Title level={5} className="!m-0">
                                {onboardingRecord?.businessName ?? 'Virtual Account'}
                            </Title>
                            {isActive && (
                                <Badge color="green" text={<Text style={{ fontSize: 11, color: '#43b75d' }}>Active</Text>} />
                            )}
                        </Flex>
                        <Text style={{ fontSize: 12, color: '#64748b', fontWeight: 'normal' }}>
                            {[onboardingRecord?.bankName, onboardingRecord?.virtualAccountNumber].filter(Boolean).join(' · ')}
                        </Text>
                    </Flex>
                </Flex>
            }
        >
            <Flex vertical gap={16}>
                <Flex
                    vertical
                    gap={12}
                    style={{
                        background: 'linear-gradient(135deg, #FF6B6B 0%, #FF4F4F 100%)',
                        borderRadius: 16,
                        padding: '16px',
                    }}
                >
                    <Flex justify="space-between" align="center">
                        {onboardingRecord?.bankName && (
                            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                                {onboardingRecord.bankName}
                            </Text>
                        )}
                        {isActive && (
                            <Flex
                                align="center"
                                gap={4}
                                style={{ background: '#BB2929', borderRadius: 20, padding: '3px 10px' }}
                            >
                                <CheckCircleOutlined style={{ color: '#fff', fontSize: 13 }} />
                                <Text style={{ fontSize: 11, color: '#fff' }}>KYC Verified</Text>
                            </Flex>
                        )}
                    </Flex>

                    <Flex vertical gap={2}>
                        <Text style={{ fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                            {balanceLoading ? 'Loading...' : formattedBalance}
                        </Text>
                        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Current Balance</Text>
                    </Flex>

                    <Flex vertical gap={8}>
                        {onboardingRecord?.virtualAccountNumber && (
                            <DetailRow label="Account Number" value={onboardingRecord.virtualAccountNumber} />
                        )}
                        {onboardingRecord?.virtualIfsc && (
                            <DetailRow label="IFSC" value={onboardingRecord.virtualIfsc} />
                        )}
                    </Flex>
                </Flex>

                {isActive && (
                    <Flex gap={12}>
                        <Flex vertical gap={4} style={{ flex: 1, background: '#F8FAFC', borderRadius: 10, padding: '10px 14px' }}>
                            <Text style={{ fontSize: 11, color: '#94a3b8' }}>Settlement</Text>
                            <Text style={{ fontSize: 13, color: '#43b75d', fontWeight: 500 }}>Auto-Settlement</Text>
                        </Flex>
                        <Flex vertical gap={4} style={{ flex: 1, background: '#F8FAFC', borderRadius: 10, padding: '10px 14px' }}>
                            <Text style={{ fontSize: 11, color: '#94a3b8' }}>KYC Status</Text>
                            <Text style={{ fontSize: 13, color: '#43b75d', fontWeight: 500 }}>Verified</Text>
                        </Flex>
                    </Flex>
                )}

                {(onboardingRecord?.accountHolderName || onboardingRecord?.phone || onboardingRecord?.pan) && (
                    <>
                        <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: 0.5 }}>
                            ACCOUNT HOLDER
                        </Text>
                        <Flex vertical gap={10}>
                            {onboardingRecord?.accountHolderName && (
                                <Flex justify="space-between">
                                    <Text style={{ fontSize: 13, color: '#64748b' }}>Name</Text>
                                    <Text style={{ fontSize: 13 }}>{onboardingRecord.accountHolderName}</Text>
                                </Flex>
                            )}
                            {onboardingRecord?.phone && (
                                <Flex justify="space-between">
                                    <Text style={{ fontSize: 13, color: '#64748b' }}>Mobile</Text>
                                    <Text style={{ fontSize: 13 }}>{onboardingRecord.phone}</Text>
                                </Flex>
                            )}
                            {onboardingRecord?.pan && (
                                <Flex justify="space-between">
                                    <Text style={{ fontSize: 13, color: '#64748b' }}>PAN</Text>
                                    <Text style={{ fontSize: 13 }}>{onboardingRecord.pan}</Text>
                                </Flex>
                            )}
                        </Flex>
                        <Divider className="!m-0" />
                    </>
                )}

                <Flex
                    gap={10}
                    align="flex-start"
                    style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px' }}
                >
                    <Text style={{ fontSize: 16 }}>💡</Text>
                    <Text style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
                        Share the account number and IFSC for NEFT/RTGS/IMPS transfers.
                    </Text>
                </Flex>
            </Flex>
        </Drawer>
    );
};

export default VirtualAccountDetailsDrawer;
