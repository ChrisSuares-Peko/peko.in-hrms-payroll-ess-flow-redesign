import { useMemo } from 'react';

import { CheckCircleTwoTone, CopyOutlined } from '@ant-design/icons';
import { Button, Card, Flex, message, Result, Spin, Typography } from 'antd';
import { useSearchParams } from 'react-router-dom';

import useVerifyEnachMandateStatus from '../hooks/useVerifyEnachMandateStatus';

const ENachMandatePublicSuccess = () => {
    const [searchParams] = useSearchParams();
    const referenceId = searchParams.get('reference_id');
    const queryStatus =
        searchParams.get('mandate_status') ||
        searchParams.get('status') ||
        searchParams.get('transaction_status');
    const decentroTxnId = searchParams.get('decentro_txn_id');
    const decentroMandateId = searchParams.get('decentro_mandate_id');

    const { mandateStatus, isVerifying } = useVerifyEnachMandateStatus({
        referenceId,
        queryStatus,
        decentroTxnId,
        decentroMandateId,
    });

    const mandateDetails = useMemo(
        () => ({
            referenceId: referenceId || '',
            mandateId:
                searchParams.get('decentro_txn_id') ||
                searchParams.get('transactionId') ||
                searchParams.get('txnId') ||
                '',
            amount: searchParams.get('amount') || '',
        }),
        [searchParams, referenceId]
    );

    const resultConfig = useMemo(() => {
        if (mandateStatus === 'error') {
            return {
                status: 'error' as const,
                title: 'Mandate Setup Failed',
                subTitle: 'Your eNACH mandate could not be completed. Please try again.',
            };
        }

        if (mandateStatus === 'pending') {
            return {
                status: 'info' as const,
                title: 'Mandate Setup Pending',
                subTitle: 'Your eNACH mandate request is being processed. Please check again shortly.',
            };
        }

        return {
            status: 'success' as const,
            title: 'Mandate Setup Successful',
            subTitle: 'Your eNACH mandate was created successfully.',
        };
    }, [mandateStatus]);

    const copyValue = (value: string, label: string) => {
        if (!value) {
            message.error(`${label} not available`);
            return;
        }
        navigator.clipboard.writeText(value);
        message.success(`${label} copied`);
    };

    return (
        <Flex justify="center" align="center" className="min-h-screen bg-slate-50 px-4 py-8">
            <Card className="w-full max-w-[560px]">
                {isVerifying ? (
                    <Flex vertical align="center" gap={16} className="py-8">
                        <Spin size="large" />
                        <Typography.Text className="text-gray-500">
                            Verifying your eNACH mandate...
                        </Typography.Text>
                    </Flex>
                ) : (
                    <>
                        <Result
                            icon={
                                mandateStatus === 'success' ? (
                                    <CheckCircleTwoTone twoToneColor="#52C41A" />
                                ) : undefined
                            }
                            status={resultConfig.status}
                            title={resultConfig.title}
                            subTitle={resultConfig.subTitle}
                        />

                        <Flex vertical gap={10}>
                            {mandateDetails.amount && (
                                <Typography.Text>
                                    <Typography.Text strong>Amount: </Typography.Text>
                                    {mandateDetails.amount}
                                </Typography.Text>
                            )}

                            {mandateDetails.referenceId && (
                                <Flex align="center" justify="space-between" gap={10}>
                                    <Typography.Text ellipsis>
                                        <Typography.Text strong>Reference ID: </Typography.Text>
                                        {mandateDetails.referenceId}
                                    </Typography.Text>
                                    <Button
                                        icon={<CopyOutlined />}
                                        onClick={() => copyValue(mandateDetails.referenceId, 'Reference ID')}
                                        size="small"
                                    >
                                        Copy
                                    </Button>
                                </Flex>
                            )}

                            {mandateDetails.mandateId && (
                                <Flex align="center" justify="space-between" gap={10}>
                                    <Typography.Text ellipsis>
                                        <Typography.Text strong>Mandate ID: </Typography.Text>
                                        {mandateDetails.mandateId}
                                    </Typography.Text>
                                    <Button
                                        icon={<CopyOutlined />}
                                        onClick={() => copyValue(mandateDetails.mandateId, 'Mandate ID')}
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

export default ENachMandatePublicSuccess;
