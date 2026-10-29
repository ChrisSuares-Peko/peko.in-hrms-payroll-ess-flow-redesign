import { useState } from 'react';

import { DeleteOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Progress, Table, Typography } from 'antd';
import dayjs from 'dayjs';

import AddPaymentModal, { AddPaymentValues } from './AddPaymentModal';
import PaymentReceiptModal, { ReceiptContext } from './PaymentReceiptModal';
import { PAYMENT_METHODS } from '../../constants';
import { ManualPaymentRecord } from '../../types/CollectPayment';

interface Props {
    documentTotal: number;
    totalPaid: number;
    amountDue: number;
    paymentHistory: ManualPaymentRecord[];
    onAddPayment: (values: AddPaymentValues) => Promise<boolean>;
    onDeletePayment: (paymentId: number) => Promise<boolean>;
    onDownloadReceipt: (paymentId: number) => Promise<boolean>;
    onShareReceipt: (paymentId: number) => Promise<boolean>;
    isDownloadingReceipt: boolean;
    isSharingReceipt: boolean;
    receiptContext: ReceiptContext;
    isLoading: boolean;
}

const fmt = (amount: number) =>
    `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const methodLabel = (value: string) =>
    PAYMENT_METHODS.find(o => o.value === value)?.label ?? value;

const PaymentSection = ({
    documentTotal,
    totalPaid,
    amountDue,
    paymentHistory,
    onAddPayment,
    onDeletePayment,
    onDownloadReceipt,
    onShareReceipt,
    isDownloadingReceipt,
    isSharingReceipt,
    receiptContext,
    isLoading,
}: Props) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<ManualPaymentRecord | null>(null);

    const paidPercent = documentTotal > 0 ? Math.min((totalPaid / documentTotal) * 100, 100) : 0;
    const hasAmountDue = amountDue > 0;

    const handleSave = async (values: AddPaymentValues) => {
        setSaving(true);
        const ok = await onAddPayment(values);
        setSaving(false);
        if (ok) setModalOpen(false);
        return ok;
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'paymentDate',
            key: 'paymentDate',
            render: (val: string) => (
                <Typography.Text className="text-sm text-gray-700">
                    {dayjs(val).format('MMM DD, YYYY')}
                </Typography.Text>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (val: string) => (
                <Typography.Text className="text-sm font-medium text-gray-800">
                    {fmt(Number(val))}
                </Typography.Text>
            ),
        },
        {
            title: 'Method',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            render: (val: string) => (
                <Typography.Text className="text-sm font-medium text-green-600">
                    {methodLabel(val)}
                </Typography.Text>
            ),
        },
        {
            title: 'Reference',
            dataIndex: 'referenceId',
            key: 'referenceId',
            render: (val?: string | null) => (
                <Typography.Text className="text-sm text-gray-700">{val || '—'}</Typography.Text>
            ),
        },
        {
            title: 'Note',
            dataIndex: 'notes',
            key: 'notes',
            render: (val?: string | null) => (
                <Typography.Text className="text-sm text-gray-500">{val || '—'}</Typography.Text>
            ),
        },
        {
            title: 'Action',
            key: 'actions',
            width: 90,
            render: (_: unknown, record: ManualPaymentRecord) => (
                <Flex gap={4} align="center" justify="flex-end">
                    <Button
                        type="text"
                        size="small"
                        disabled={record.isDeleted}
                        icon={<EyeOutlined className="text-gray-500" />}
                        onClick={() => setSelectedPayment(record)}
                    />
                    <Button
                        type="text"
                        size="small"
                        disabled={record.isDeleted}
                        icon={<DeleteOutlined className="text-red-400" />}
                        onClick={() => onDeletePayment(record.id)}
                    />
                </Flex>
            ),
        },
    ];

    return (
        <Card className="w-full rounded-2xl" styles={{ body: { padding: 0, paddingBottom: 15, paddingLeft: 5, paddingRight: 5 } }}>
            <Flex vertical gap={12} className="px-5 pt-5">
                <Flex justify="space-between" align="center" gap={8} wrap>
                    <Flex vertical gap={2}>
                        <Typography.Text className="text-xl font-semibold">
                            Payments
                        </Typography.Text>
                        <Typography.Text className="text-sm text-gray-500">
                            Track payments received against this invoice
                        </Typography.Text>
                    </Flex>
                    <Button
                        type="primary"
                        danger
                        icon={<PlusOutlined />}
                        disabled={!hasAmountDue}
                        onClick={() => setModalOpen(true)}
                    >
                        Add Payment
                    </Button>
                </Flex>

                <Card className="rounded-lg" styles={{ body: { padding: '16px 20px' } }}>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                        <Flex vertical gap={4}>
                            <Typography.Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Invoice Total
                            </Typography.Text>
                            <Typography.Text className="text-sm font-semibold text-gray-800">
                                {fmt(documentTotal)}
                            </Typography.Text>
                        </Flex>
                        <Flex vertical gap={4}>
                            <Typography.Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Total Paid
                            </Typography.Text>
                            <Typography.Text className="text-sm font-semibold text-green-600">
                                {fmt(totalPaid)}
                            </Typography.Text>
                        </Flex>
                        <Flex vertical gap={4}>
                            <Typography.Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Amount Due
                            </Typography.Text>
                            <Typography.Text className="text-sm font-semibold text-red-500">
                                {fmt(amountDue)}
                            </Typography.Text>
                        </Flex>
                    </div>

                    <Progress
                        percent={paidPercent}
                        showInfo={false}
                        strokeColor="#22c55e"
                        trailColor="#e5e7eb"
                        strokeWidth={6}
                    />
                </Card>
            </Flex>

            {paymentHistory.length === 0 && !isLoading ? (
                <Flex vertical align="center" gap={4} className="px-5 py-6">
                    <Typography.Text className="text-sm text-gray-500">
                        No payments recorded yet
                    </Typography.Text>
                    {hasAmountDue && (
                        <button
                            type="button"
                            onClick={() => setModalOpen(true)}
                            className="text-sm text-red-500 font-medium bg-transparent border-0 p-0 cursor-pointer"
                        >
                            Add the first payment
                        </button>
                    )}
                </Flex>
            ) : (
                <div className="mt-3">
                    <Table
                        dataSource={paymentHistory.map(p => ({ ...p, key: p.id }))}
                        columns={columns}
                        pagination={false}
                        size="small"
                        scroll={{ x: 600, ...(paymentHistory.length > 3 ? { y: 220 } : {}) }}
                        rowClassName={(record: ManualPaymentRecord) =>
                            record.isDeleted ? 'opacity-40 pointer-events-none' : ''
                        }
                    />
                </div>
            )}

            <AddPaymentModal
                open={modalOpen}
                maxAmount={amountDue}
                saving={saving}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
            />

            <PaymentReceiptModal
                open={!!selectedPayment}
                payment={selectedPayment}
                context={receiptContext}
                onShare={onShareReceipt}
                sharing={isSharingReceipt}
                onDownload={onDownloadReceipt}
                downloading={isDownloadingReceipt}
                onClose={() => setSelectedPayment(null)}
            />
        </Card>
    );
};

export default PaymentSection;
