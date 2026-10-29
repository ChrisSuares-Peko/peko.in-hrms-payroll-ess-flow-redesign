import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, CopyOutlined } from '@ant-design/icons';
import { Button, Col, Flex, message, Row, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import { ENachFormValues } from './ENachForm.types';

interface ENachAuthViewProps {
    form: ENachFormValues;
    mandateLink: string;
    timeLeft: number;
    statusType: 'pending' | 'success' | 'failed';
    statusText: string;
    isCheckingStatus?: boolean;
    onCancel: () => void;
    onOpenMandateLink: () => void;
    onCheckStatus: () => void;
}

const formatTime = (seconds: number) => {
    const safeValue = Math.max(0, seconds);
    const m = Math.floor(safeValue / 60).toString().padStart(2, '0');
    const s = (safeValue % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const getStatusTagProps = (statusType: 'pending' | 'success' | 'failed') => {
    if (statusType === 'success') {
        return {
            label: 'Mandate Verified',
            color: '#16A34A',
            bg: '#F0FDF4',
            border: '#86EFAC',
        };
    }

    if (statusType === 'failed') {
        return {
            label: 'Mandate Failed',
            color: '#DC2626',
            bg: '#FEF2F2',
            border: '#FCA5A5',
        };
    }

    return {
        label: 'Awaiting Customer Approval',
        color: '#D97706',
        bg: '#FFFBEB',
        border: '#FDE68A',
    };
};

const ENachAuthView = ({
    form,
    mandateLink,
    timeLeft,
    statusType,
    statusText,
    isCheckingStatus,
    onCancel,
    onOpenMandateLink,
    onCheckStatus,
}: ENachAuthViewProps) => {
    const statusTag = getStatusTagProps(statusType);
    const isTimerExpired = timeLeft <= 0;
    const statusIcon = (() => {
        if (statusType === 'success') {
            return <CheckCircleOutlined style={{ color: statusTag.color, fontSize: 20, marginTop: 2 }} />;
        }
        if (statusType === 'failed') {
            return <CloseCircleOutlined style={{ color: statusTag.color, fontSize: 20, marginTop: 2 }} />;
        }
        return <ClockCircleOutlined style={{ color: statusTag.color, fontSize: 20, marginTop: 2 }} />;
    })();

    return (
        <Flex vertical gap={24} className="pt-2">
            <Flex justify="space-between" align="flex-start" wrap="wrap" gap={8}>
                <Flex vertical gap={4}>
                    <Typography.Title level={4} className="!mb-0 !font-bold">
                        eNACH Mandate Authorization
                    </Typography.Title>
                    <Typography.Text className="text-gray-500">
                        Share the authorization link and verify the mandate status after completion
                    </Typography.Text>
                </Flex>
                <Tag
                    style={{
                        background: statusTag.bg,
                        color: statusTag.color,
                        border: `1px solid ${statusTag.border}`,
                        borderRadius: 20,
                        padding: '4px 12px',
                        fontWeight: 500,
                    }}
                >
                    {statusTag.label}
                </Tag>
            </Flex>

            <div className="rounded-2xl p-4" style={{ background: statusTag.bg, border: `1px solid ${statusTag.border}` }}>
                <Flex gap={12} align="flex-start">
                    {statusIcon}
                    <Flex vertical gap={4}>
                        <Typography.Text className="font-semibold text-sm">{statusText}</Typography.Text>
                        <Typography.Text className="text-xs text-gray-500">
                            {isTimerExpired
                                ? 'The 15-minute link validity window appears to be over. You can still use Check Status to verify the final outcome.'
                                : 'The mandate link can be used once and remains valid for 15 minutes after initiation.'}
                        </Typography.Text>
                    </Flex>
                </Flex>
            </div>

            <div className="rounded-2xl px-4 py-3 !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
                <Flex justify="space-between" align="center" gap={8} wrap="wrap">
                    <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Typography.Text className="text-gray-400 text-xs">Authorization Link</Typography.Text>
                        <Typography.Text className="font-mono text-sm" ellipsis>
                            {mandateLink}
                        </Typography.Text>
                    </Flex>
                    <Button
                        icon={<CopyOutlined />}
                        onClick={() => {
                            navigator.clipboard.writeText(mandateLink);
                            message.success('Link copied');
                        }}
                    >
                        Copy
                    </Button>
                </Flex>
            </div>

            <div className="rounded-2xl p-5 text-center" style={{ background: '#F8FAFC' }}>
                <Flex vertical gap={4} align="center">
                    <Typography.Text className="text-gray-400 text-sm">Link validity window</Typography.Text>
                    <Typography.Title
                        level={2}
                        className="!mb-0 !font-bold"
                        style={{ color: isTimerExpired ? '#DC2626' : '#111827', letterSpacing: 2 }}
                    >
                        {formatTime(timeLeft)}
                    </Typography.Title>
                </Flex>
            </div>

            <div className="rounded-2xl p-5 !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
                <Flex vertical gap={16}>
                    <Typography.Text className="font-bold text-base">Mandate Details</Typography.Text>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                            <Flex vertical gap={2}>
                                <Typography.Text className="text-gray-400 text-xs">Customer Name</Typography.Text>
                                <Typography.Text className="font-semibold text-sm">
                                    {form.customerName || '-'}
                                </Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Flex vertical gap={2}>
                                <Typography.Text className="text-gray-400 text-xs">Email</Typography.Text>
                                <Typography.Text className="text-sm">{form.email || '-'}</Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Flex vertical gap={2}>
                                <Typography.Text className="text-gray-400 text-xs">Mobile</Typography.Text>
                                <Typography.Text className="text-sm">{form.mobile || '-'}</Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Flex vertical gap={2}>
                                <Typography.Text className="text-gray-400 text-xs">Maximum Debit Amount</Typography.Text>
                                <Typography.Text className="font-semibold text-sm">
                                    ₹{form.amount || '-'}
                                </Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Flex vertical gap={2}>
                                <Typography.Text className="text-gray-400 text-xs">Frequency</Typography.Text>
                                <Typography.Text className="text-sm">{form.frequency || '-'}</Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Flex vertical gap={2}>
                                <Typography.Text className="text-gray-400 text-xs">Category</Typography.Text>
                                <Typography.Text className="text-sm">{form.categoryCode || '-'}</Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Flex vertical gap={2}>
                                <Typography.Text className="text-gray-400 text-xs">Amount Rule</Typography.Text>
                                <Typography.Text className="text-sm capitalize">{form.amountRule || '-'}</Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Flex vertical gap={2}>
                                <Typography.Text className="text-gray-400 text-xs">Start Date</Typography.Text>
                                <Typography.Text className="text-sm">
                                    {form.startDate ? dayjs(form.startDate).format('D MMM YYYY') : '-'}
                                </Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Flex vertical gap={2}>
                                <Typography.Text className="text-gray-400 text-xs">End Date</Typography.Text>
                                <Typography.Text className="text-sm">
                                    {form.endDate ? dayjs(form.endDate).format('D MMM YYYY') : '-'}
                                </Typography.Text>
                            </Flex>
                        </Col>
                    </Row>
                </Flex>
            </div>

            <Flex gap={12} wrap="wrap">
               
                <Button size="large" className="flex-1" loading={isCheckingStatus} onClick={onCheckStatus}>
                    Check Status
                </Button>
            </Flex>
        </Flex>
    );
};

export default ENachAuthView;
