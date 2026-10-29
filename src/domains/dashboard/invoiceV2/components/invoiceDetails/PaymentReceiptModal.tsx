import { DownloadOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Modal, Typography } from 'antd';
import dayjs from 'dayjs';

import { ManualPaymentRecord } from '../../api/invoices';
import { PAYMENT_MODE_OPTIONS } from '../../constants/settings';

export interface ReceiptContext {
    invoiceNo: string;
    currency: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    billerName: string;
}

interface Props {
    open: boolean;
    payment: ManualPaymentRecord | null;
    context: ReceiptContext;
    onShare: (paymentId: number) => Promise<boolean>;
    sharing: boolean;
    onDownload: (paymentId: number) => Promise<boolean>;
    downloading: boolean;
    onClose: () => void;
}

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <Flex vertical gap={2}>
        <Typography.Text className="text-xs text-gray-500 uppercase tracking-wide">
            {label}
        </Typography.Text>
        <Typography.Text className="text-sm font-medium text-gray-800">
            {value || '—'}
        </Typography.Text>
    </Flex>
);

const fmt = (amount: string | number, currency: string) =>
    `${currency} ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const methodLabel = (val: string) =>
    PAYMENT_MODE_OPTIONS.find(o => o.value === val)?.label ?? val;

const PaymentReceiptModal = ({
    open,
    payment,
    context,
    onShare,
    sharing,
    onDownload,
    downloading,
    onClose,
}: Props) => {
    if (!payment) return null;

    const { invoiceNo, currency, customerName, customerEmail, customerPhone, billerName } = context;
    const receiptNo = payment.receiptNo || `RC-${invoiceNo}-${payment.id}`;

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={520}
            styles={{ body: { padding: '24px 28px' } }}
        >
            {/* Header */}
            <Flex justify="space-between" align="flex-start">
                <Flex vertical gap={2}>
                    <Typography.Text className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                        Payment Receipt
                    </Typography.Text>
                    <Typography.Text className="text-2xl font-bold text-gray-900">
                        {receiptNo}
                    </Typography.Text>
                    <Typography.Text className="text-xs text-gray-400">
                        Issued {dayjs(payment.paymentDate).format('DD MMM YYYY')}
                    </Typography.Text>
                </Flex>
                <div
                    className="border-2 border-green-500 rounded px-3 py-1"
                    style={{ transform: 'rotate(6deg)' }}
                >
                    <Typography.Text className="text-sm font-bold text-green-600 uppercase tracking-widest">
                        PAID
                    </Typography.Text>
                </div>
            </Flex>

            <Divider className="my-4" />

            {/* Received from / by */}
            <div className="grid grid-cols-2 gap-6 mb-4">
                <Flex vertical gap={4}>
                    <Typography.Text className="text-xs text-gray-500 uppercase tracking-wide">
                        Received From
                    </Typography.Text>
                    <Typography.Text className="text-sm font-semibold text-gray-800">
                        {customerName}
                    </Typography.Text>
                    {customerEmail && (
                        <Typography.Text className="text-xs text-gray-500">
                            {customerEmail}
                        </Typography.Text>
                    )}
                    {customerPhone && (
                        <Typography.Text className="text-xs text-gray-500">
                            {customerPhone}
                        </Typography.Text>
                    )}
                </Flex>
                <Flex vertical gap={4}>
                    <Typography.Text className="text-xs text-gray-500 uppercase tracking-wide">
                        Received By
                    </Typography.Text>
                    <Typography.Text className="text-sm font-semibold text-gray-800">
                        {billerName}
                    </Typography.Text>
                </Flex>
            </div>

            <Divider className="my-4" />

            {/* Payment details */}
            <div className="grid grid-cols-4 gap-4 mb-4">
                <InfoRow label="Payment Date" value={dayjs(payment.paymentDate).format('DD MMM YYYY')} />
                <InfoRow label="Method" value={methodLabel(payment.paymentMethod)} />
                <InfoRow label="Reference" value={payment.referenceId ?? undefined} />
                <InfoRow label="Currency" value={currency} />
            </div>

            <Divider className="my-4" />

            {/* Amount */}
            <Flex vertical gap={4} className="bg-green-50 rounded-lg px-4 py-3 mb-4">
                <Typography.Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Amount Received
                </Typography.Text>
                <Typography.Text className="text-3xl font-bold text-green-600">
                    {fmt(payment.amount, currency)}
                </Typography.Text>
            </Flex>

            {/* Allocated to */}
            <Flex vertical gap={6}>
                <Typography.Text className="text-sm font-semibold text-gray-700">
                    Allocated to
                </Typography.Text>
                <Flex justify="space-between" align="center" className="px-1">
                    <Flex vertical gap={1}>
                        <Typography.Text className="text-sm font-medium text-gray-800">
                            {invoiceNo}
                        </Typography.Text>
                        <Typography.Text className="text-xs text-gray-500">
                            {customerName} — {dayjs(payment.paymentDate).format('DD MMM YYYY')}
                        </Typography.Text>
                    </Flex>
                    <Typography.Text className="text-sm font-semibold text-gray-800">
                        {fmt(payment.amount, currency)}
                    </Typography.Text>
                </Flex>
            </Flex>

            <Divider className="my-4" />

            {/* Actions */}
            <Flex justify="flex-end" gap={8}>
                <Button
                    icon={<ShareAltOutlined />}
                    loading={sharing}
                    onClick={() => onShare(payment.id)}
                >
                    Share
                </Button>
                <Button
                    danger
                    type="primary"
                    icon={<DownloadOutlined />}
                    loading={downloading}
                    onClick={() => onDownload(payment.id)}
                >
                    Download
                </Button>
            </Flex>
        </Modal>
    );
};

export default PaymentReceiptModal;
