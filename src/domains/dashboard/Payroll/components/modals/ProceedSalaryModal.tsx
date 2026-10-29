import { Button, Flex, Modal, Typography } from 'antd';

const { Text } = Typography;

interface ProceedSalaryModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    employeeCount: number;
    totalPayout: number;
    isProcessing?: boolean;
}

const ProceedSalaryModal = ({
    open,
    onClose,
    onConfirm,
    employeeCount,
    totalPayout,
    isProcessing = false,
}: ProceedSalaryModalProps) => (
    <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        closable={false}
        centered
        width={480}
        maskClosable={!isProcessing}
        styles={{ content: { borderRadius: 24, padding: '24px 28px' } }}
    >
        <Flex vertical gap={20}>
            {/* Icon + heading */}
            <Flex vertical align="center" gap={12}>
                <Flex align="center" justify="center" style={{
                    width: 80, height: 80, borderRadius: '50%', background: '#FCF3FF',
                }}>
                    <Flex align="center" justify="center" style={{
                        width: 60, height: 60, borderRadius: '50%', background: '#F8E6FF',
                    }}>
                        <Text style={{ fontSize: 28, fontWeight: 700, color: '#B73DE7', lineHeight: 1 }}>!</Text>
                    </Flex>
                </Flex>
                <Text style={{ fontSize: 18, fontWeight: 500, color: '#000000', lineHeight: '26px' }}>
                    Ready to run payroll?
                </Text>
                <Text style={{ fontSize: 13, color: '#6B788E', textAlign: 'center', lineHeight: '20px' }}>
                    You&apos;re about to disburse salaries to
                </Text>
            </Flex>

            {/* Summary card */}
            <Flex
                vertical
                style={{
                    background: '#FFFFFF',
                    border: '1px solid #D9D9D9',
                    boxShadow: '0px 1px 12px 1px rgba(122,122,122,0.06)',
                    borderRadius: 16,
                    padding: '16px 20px',
                }}
            >
                <Flex
                    justify="space-between"
                    align="center"
                    style={{ paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid #EAECF0' }}
                >
                    <Text style={{ fontSize: 14, color: '#6B788E' }}>Employees</Text>
                    <Text style={{ fontSize: 14, fontWeight: 600, color: '#101828' }}>{employeeCount}</Text>
                </Flex>
                <Flex justify="space-between" align="center">
                    <Text style={{ fontSize: 14, color: '#6B788E' }}>Total Payout</Text>
                    <Text style={{ fontSize: 14, fontWeight: 600, color: '#101828' }}>
                        ₹{totalPayout.toLocaleString('en-IN')}
                    </Text>
                </Flex>
            </Flex>

            {/* Buttons */}
            <Flex gap={10}>
                <Button
                    block
                    disabled={isProcessing}
                    style={{
                        height: 38, borderRadius: 8, fontSize: 14, fontWeight: 500,
                        border: '1px solid #FF4F4F', color: '#FF4F4F', background: '#FFFFFF',
                    }}
                    onClick={onClose}
                >
                    Cancel
                </Button>
                <Button
                    type="primary"
                    danger
                    block
                    loading={isProcessing}
                    disabled={isProcessing}
                    style={{
                        height: 38, borderRadius: 8, fontSize: 14, fontWeight: 500,
                        background: '#FF4F4F', borderColor: '#FF4F4F',
                    }}
                    onClick={onConfirm}
                >
                    Yes, Distribute Now
                </Button>
            </Flex>
        </Flex>
    </Modal>
);

export default ProceedSalaryModal;
