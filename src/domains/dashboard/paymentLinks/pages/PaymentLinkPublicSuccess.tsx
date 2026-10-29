import { useMemo } from 'react';

import { CheckCircleTwoTone, CopyOutlined } from '@ant-design/icons';
import { Button, Card, Flex, message, Result, Spin, Typography } from 'antd';
import { useSearchParams } from 'react-router-dom';

import useVerifyPaymentLinkStatus from '../hooks/useVerifyPaymentLinkStatus';

const PaymentLinkPublicSuccess = () => {
    const [searchParams] = useSearchParams();
    const referenceId = searchParams.get('reference_id');
    const queryStatus = searchParams.get('status') || searchParams.get('transaction_status');
    const { paymentStatus, isVerifying } = useVerifyPaymentLinkStatus({ referenceId, queryStatus });

    const paymentDetails = useMemo(
        () => ({
            transactionId:
                searchParams.get('transactionId') ||
                searchParams.get('txnId') ||
                searchParams.get('decentro_txn_id') ||
                '',
            amount: searchParams.get('amount') || '',
        }),
        [searchParams]
    );

    const resultConfig = useMemo(() => {
        if (paymentStatus === 'error') {
            return {
                status: 'error' as const,
                title: 'Payment Failed',
                subTitle: 'Your payment could not be completed. Please try again.',
            };
        }

        if (paymentStatus === 'pending') {
            return {
                status: 'info' as const,
                title: 'Payment Pending',
                subTitle: 'Your payment is being processed. Please check again shortly.',
            };
        }

        return {
            status: 'success' as const,
            title: 'Payment Successful',
            subTitle: 'Your payment was completed successfully.',
        };
    }, [paymentStatus]);

    const copyTransactionId = () => {
        if (!paymentDetails.transactionId) {
            message.error('Transaction ID not available');
            return;
        }
        navigator.clipboard.writeText(paymentDetails.transactionId);
        message.success('Transaction ID copied');
    };

    return (
        <Flex
            justify="center"
            align="center"
            className="min-h-screen bg-slate-50 px-4 py-8"
        >
            <Card className="w-full max-w-[560px]">
                {isVerifying ? (
                    <Flex vertical align="center" gap={16} className="py-8">
                        <Spin size="large" />
                        <Typography.Text className="text-gray-500">
                            Verifying your payment...
                        </Typography.Text>
                    </Flex>
                ) : (
                    <>
                        <Result
                            icon={
                                paymentStatus === 'success' ? (
                                    <CheckCircleTwoTone twoToneColor="#52C41A" />
                                ) : undefined
                            }
                            status={resultConfig.status}
                            title={resultConfig.title}
                            subTitle={resultConfig.subTitle}
                        />

                        <Flex vertical gap={10}>
                            {paymentDetails.amount && (
                                <Typography.Text>
                                    <Typography.Text strong>Amount: </Typography.Text>
                                    {paymentDetails.amount}
                                </Typography.Text>
                            )}
                            {paymentDetails.transactionId && (
                                <Flex align="center" justify="space-between" gap={10}>
                                    <Typography.Text ellipsis>
                                        <Typography.Text strong>Transaction ID: </Typography.Text>
                                        {paymentDetails.transactionId}
                                    </Typography.Text>
                                    <Button
                                        icon={<CopyOutlined />}
                                        onClick={copyTransactionId}
                                        size="small"
                                    >
                                        Copy
                                    </Button>
                                </Flex>
                            )}
                        </Flex>
                    </>
                )}
            </Card>
        </Flex>
    );
};

export default PaymentLinkPublicSuccess;
