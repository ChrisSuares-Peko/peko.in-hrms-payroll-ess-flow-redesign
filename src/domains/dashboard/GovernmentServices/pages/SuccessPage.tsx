import { CheckCircleFilled, ClockCircleOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Skeleton, Typography } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import useGetTransactionData from '@src/domains/dashboard/payments/hooks/useGetTransactionData';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { serviceDetailsMap } from '../utils';

const { Title, Text } = Typography;

const SuccessPage = () => {
    const { serviceId } = useParams<{ serviceId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const transactionId = new URLSearchParams(location.search).get('transactionId');
    const { transactionData, isLoading } = useGetTransactionData(transactionId);

    const servicesList = useAppSelector(state => state.reducer.governmentServices.servicesList);
    const selectedService = useAppSelector(state => state.reducer.governmentServices.selectedService);
    const serviceIdNum = Number(serviceId);
    const service = servicesList.find((s) => s.id === serviceIdNum)
        ?? (selectedService?.id === serviceIdNum ? selectedService : undefined);
    const detail = serviceDetailsMap[serviceIdNum];

    const parsedOrder = (() => {
        try {
            return JSON.parse(transactionData?.orderResponse ?? '{}');
        } catch {
            return {};
        }
    })();
    const applicationId = parsedOrder?.applicationId ?? null;
    const applicationNumber = parsedOrder?.applicationNumber ?? null;

    const dateValue = transactionData?.transactionDate
        ? new Date(transactionData.transactionDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
        : '—';
    const amountValue = transactionData?.amountInINR
        ? `₹ ${parseFloat(transactionData.amountInINR).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '—';
    const modeValue = transactionData?.paymentMode ?? '—';

    return (
        <Flex vertical align="center" justify="center" gap={24} className="p-10" style={{ minHeight: '80vh' }}>
            <Flex vertical align="center" gap={12}>
                <CheckCircleFilled style={{ fontSize: 56, color: '#26A411' }} />
                <Flex vertical align="center" gap={6}>
                    <Title level={4} className="!mb-0">
                        Application Submitted Successfully!
                    </Title>
                    <Text className="text-sm" style={{ color: '#8C8C8C' }}>
                        We&apos;ll take it from here. You&apos;ll receive updates via email and SMS.
                    </Text>
                </Flex>
            </Flex>

            <Flex
                vertical
                align="center"
                gap={0}
                style={{
                    width: '100%',
                    maxWidth: 480,
                    backgroundColor: '#FFF7F6',
                    border: '1px solid #FFE4E4',
                    borderRadius: 12,
                    overflow: 'hidden',
                }}
            >
                <Flex vertical align="center" gap={4} className="py-5 px-6 w-full">
                    <Text className="text-xs" style={{ color: '#8C8C8C' }}>
                        Application Number
                    </Text>
                    {isLoading ? (
                        <Skeleton.Input active size="small" style={{ width: 160 }} />
                    ) : (
                        <Text style={{ fontSize: 22, fontWeight: 700, color: '#FF3A3A' }}>
                            {applicationNumber ?? '—'}
                        </Text>
                    )}
                </Flex>

                <Divider style={{ borderColor: '#FFE4E4', margin: 0 }} />

                <Flex vertical align="center" gap={8} className="py-5 px-6 w-full">
                    <Text className="text-xs" style={{ color: '#8C8C8C' }}>
                        Service
                    </Text>
                    <Text strong className="text-sm">
                        {service?.name ?? 'Government Service'}
                    </Text>
                    <Flex align="center" gap={6}>
                        <ClockCircleOutlined style={{ color: '#8C8C8C', fontSize: 12 }} />
                        <Text className="text-xs" style={{ color: '#8C8C8C' }}>
                            Expected completion: {service?.duration ?? `${detail?.timeline?.length ?? 0} steps`}
                        </Text>
                    </Flex>
                </Flex>

                <Divider style={{ borderColor: '#FFE4E4', margin: 0 }} />

                <Flex vertical gap={0} className="w-full">
                    {[
                        { label: 'Date', value: isLoading ? null : dateValue },
                        { label: 'Amount Paid', value: isLoading ? null : amountValue },
                        { label: 'Payment Mode', value: isLoading ? null : modeValue },
                    ].map(({ label, value }) => (
                        <Flex key={label} justify="space-between" align="center" className="py-3 px-6">
                            <Text className="text-xs" style={{ color: '#8C8C8C' }}>{label}</Text>
                            {isLoading ? (
                                <Skeleton.Input active size="small" style={{ width: 100 }} />
                            ) : (
                                <Text className="text-xs font-medium">{value}</Text>
                            )}
                        </Flex>
                    ))}
                </Flex>
            </Flex>

            <Flex
                vertical
                gap={12}
                style={{
                    width: '100%',
                    maxWidth: 480,
                    border: '1px solid #F0F0F0',
                    borderRadius: 12,
                    padding: 20,
                    backgroundColor: '#FFFFFF',
                }}
            >
                <Text strong className="text-sm">
                    What happens next?
                </Text>
                <Flex vertical gap={8}>
                    {[
                        'Our team will review your application within 24 hours',
                        "We'll submit it to the relevant government department",
                        "You'll receive your certificate once approved",
                    ].map((item, i) => (
                        <Flex align="flex-start" gap={8} key={i}>
                            <span style={{ color: '#FF3A3A', fontSize: 16, lineHeight: '20px', flexShrink: 0 }}>•</span>
                            <Text className="text-xs">{item}</Text>
                        </Flex>
                    ))}
                </Flex>
            </Flex>

            <Flex gap={12} style={{ width: '100%', maxWidth: 480 }}>
                <Button
                    block
                    onClick={() => navigate(`${paths.dashboard.governmentServices}/explore`)}
                >
                    Apply for another service
                </Button>
                <Button
                    type="primary"
                    block
                    disabled={!applicationId}
                    onClick={() => navigate(`${paths.dashboard.governmentServices}/${paths.governmentServices.application}/${applicationId}`)}
                >
                    Track Application
                </Button>
            </Flex>
        </Flex>
    );
};

export default SuccessPage;
