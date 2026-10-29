import React, { useEffect, useState } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Descriptions, Drawer, Flex, Skeleton, Tag, Typography } from 'antd';

import { getTransactionDiagnosticDetails } from '@src/domains/admin/reports/api/order';
import { TransactionDiagnosticDetails } from '@src/domains/admin/reports/types/orders';
import { useAppSelector } from '@src/hooks/store';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

interface Props {
    open: boolean;
    transactionId: number | null;
    onClose: () => void;
}

const NA = <Typography.Text type="secondary">—</Typography.Text>;

const formatDate = (val: string | null | undefined) => {
    if (!val) return NA;
    const d = new Date(val);
    return `${formattedDateOnly(d)} ${formattedTime(d)}`;
};

const statusColor: Record<string, string> = {
    FAILED: 'error',
    FAILURE: 'error',
    SUCCESS: 'success',
    REFUNDED: 'processing',
    PENDING: 'warning',
    INITIATED: 'warning',
    COMPLETED: 'success',
};

const TransactionDetailsDrawer: React.FC<Props> = ({ open, transactionId, onClose }) => {
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<TransactionDiagnosticDetails | null>(null);

    useEffect(() => {
        if (!open || !transactionId) {
            setData(null);
            return;
        }
        setIsLoading(true);
        getTransactionDiagnosticDetails({
            userId,
            userType: role,
            transactionId: Number(transactionId),
        })
            .then(result => {
                setData(result || null);
            })
            .finally(() => setIsLoading(false));
    }, [open, transactionId, userId, role]);

    const renderContent = () => {
        if (isLoading) {
            return <Skeleton active paragraph={{ rows: 12 }} />;
        }
        if (!data) {
            return (
                <Typography.Text type="secondary">
                    No details available for this transaction.
                </Typography.Text>
            );
        }

        const { transaction: txn, failure, order, refund } = data;

        return (
            <Flex vertical gap={24}>
                <section>
                    <Typography.Text strong className="block mb-3 text-base">
                        Transaction Info
                    </Typography.Text>
                    <Descriptions
                        size="small"
                        column={1}
                        bordered
                        labelStyle={{ width: 160, fontWeight: 500 }}
                    >
                        <Descriptions.Item label="Transaction ID">
                            {txn.corporateTxnId || NA}
                        </Descriptions.Item>
                        <Descriptions.Item label="Order ID">{order.id ?? NA}</Descriptions.Item>
                        <Descriptions.Item label="Created Date">
                            {formatDate(txn.createdAt)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Status">
                            <Tag color={statusColor[txn.status?.toUpperCase()] ?? 'default'}>
                                {txn.status}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Category">
                            {txn.transactionCategory || NA}
                        </Descriptions.Item>
                        <Descriptions.Item label="Provider">
                            {failure.providerName || NA}
                        </Descriptions.Item>
                        <Descriptions.Item label="Payment Mode">
                            {order.paymentMode || NA}
                        </Descriptions.Item>
                        <Descriptions.Item label="Amount">
                            {order.amountInINR
                                ? `₹ ${formatNumberWithLocalString(Number(order.amountInINR))}`
                                : NA}
                        </Descriptions.Item>
                        <Descriptions.Item label="Account Number">
                            {order.accountNo || NA}
                        </Descriptions.Item>
                    </Descriptions>
                </section>

                <section>
                    <Typography.Text strong className="block mb-3 text-base">
                        Failure Details
                    </Typography.Text>
                    <Descriptions
                        size="small"
                        column={1}
                        bordered
                        labelStyle={{ width: 160, fontWeight: 500 }}
                    >
                        <Descriptions.Item label="Failure Status">
                            <Tag color={statusColor[failure.status?.toUpperCase()] ?? 'default'}>
                                {failure.status || '—'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Failure Reason">
                            {failure.message || NA}
                        </Descriptions.Item>
                        <Descriptions.Item label="Error Code">
                            {failure.errorCode || NA}
                        </Descriptions.Item>
                        <Descriptions.Item label="Error Message">
                            {failure.errorMessage || NA}
                        </Descriptions.Item>
                    </Descriptions>

                    {failure.rawResponse && (
                        <div className="mt-3">
                            <Typography.Text type="secondary" className="text-xs block mb-1">
                                Raw Provider Response
                            </Typography.Text>
                            <pre
                                className="bg-gray-50 border border-gray-200 rounded-md p-3 text-xs overflow-auto"
                                style={{ maxHeight: 200 }}
                            >
                                {JSON.stringify(failure.rawResponse, null, 2)}
                            </pre>
                        </div>
                    )}
                </section>

                <section>
                    <Typography.Text strong className="block mb-3 text-base">
                        Refund Details
                    </Typography.Text>
                    <Descriptions
                        size="small"
                        column={1}
                        bordered
                        labelStyle={{ width: 160, fontWeight: 500 }}
                    >
                        <Descriptions.Item label="Refunded">
                            <Tag color={refund.isRefunded ? 'success' : 'default'}>
                                {refund.isRefunded ? 'YES' : 'NO'}
                            </Tag>
                        </Descriptions.Item>
                        {refund.isRefunded && (
                            <>
                                <Descriptions.Item label="Refund Txn ID">
                                    {refund.refundTransactionId ?? NA}
                                </Descriptions.Item>
                                <Descriptions.Item label="Refund Amount">
                                    {refund.refundAmount != null
                                        ? `₹ ${formatNumberWithLocalString(refund.refundAmount)}`
                                        : NA}
                                </Descriptions.Item>
                                <Descriptions.Item label="Cashback Reversed">
                                    {refund.cashbackReversed != null
                                        ? `₹ ${formatNumberWithLocalString(refund.cashbackReversed)}`
                                        : NA}
                                </Descriptions.Item>
                                <Descriptions.Item label="Refund Date">
                                    {formatDate(refund.refundDate)}
                                </Descriptions.Item>
                            </>
                        )}
                    </Descriptions>
                </section>
            </Flex>
        );
    };

    return (
        <Drawer
            title="Transaction Failure Details"
            open={open}
            onClose={onClose}
            width={620}
            zIndex={1001}
            destroyOnClose
            closeIcon={null}
            extra={
                <CloseOutlined
                    onClick={onClose}
                    style={{ fontSize: '16px', color: '#000', cursor: 'pointer' }}
                />
            }
            styles={{
                body: { paddingInline: 20, paddingBlock: 16 },
                header: { paddingInline: 20 },
            }}
            footer={null}
        >
            {renderContent()}
        </Drawer>
    );
};

export default TransactionDetailsDrawer;
