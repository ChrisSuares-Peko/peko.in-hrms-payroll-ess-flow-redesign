import { useEffect, useState } from 'react';

import { CheckCircleFilled, ClockCircleOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Flex, Row, Skeleton, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { getGovtServiceByAccessKeyApi, getGovernmentServiceApplicationApi, submitGovernmentServiceApplicationApi } from '../apis';
import docIcon from '../assets/icons/doc.svg';
import { setSelectedService } from '../slices';
import { Service } from '../types';
import { getServiceDetailByAccessKey } from '../utils';

const { Title, Text } = Typography;

const SectionCard = ({ children, title }: { children: React.ReactNode; title: string }) => (
    <Flex vertical gap={10} className="p-4 rounded-lg h-full" style={{ border: '1px solid #F0F0F0' }}>
        <Text strong className="text-sm">
            {title}
        </Text>
        {children}
    </Flex>
);

const ServiceDetail = () => {
    const { serviceId } = useParams<{ serviceId: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [eligibilityAnswers, setEligibilityAnswers] = useState<Record<number, string>>({});
    const [isFetching, setIsFetching] = useState(false);
    const [isDraftFetching, setIsDraftFetching] = useState(false);
    const [isApplying, setIsApplying] = useState(false);

    const { role, id: userId } = useAppSelector((state) => state.reducer.auth);
    const reduxService = useAppSelector((state) => state.reducer.governmentServices.selectedService);
    const servicesList = useAppSelector((state) => state.reducer.governmentServices.servicesList);
    const serviceIdNum = Number(serviceId);

    const selectedService = reduxService?.id === serviceIdNum ? reduxService : null;

    useEffect(() => {
        if (!selectedService) {
            const accessKeyFromList = servicesList.find((s) => s.id === serviceIdNum)?.accessKey;
            if (!accessKeyFromList) {
                navigate(`${paths.dashboard.governmentServices}/explore`);
                return;
            }
            setIsFetching(true);
            getGovtServiceByAccessKeyApi(userId, role, accessKeyFromList).then((item) => {
                if (item) {
                    const rawGovtFee = item.govtFee;
                    const svc: Service = {
                        id: item.id,
                        name: item.name,
                        slug: item.slug,
                        accessKey: item.accessKey,
                        description: item.description ?? '',
                        category: item.category,
                        tab: item.tag,
                        duration: item.processingTime ?? '',
                        price: Number(item.price),
                        govtFee:
                            rawGovtFee === null || rawGovtFee === 'Free' || Number(rawGovtFee) === 0
                                ? 'Free'
                                : Number(rawGovtFee),
                    };
                    dispatch(setSelectedService(svc));
                } else {
                    navigate(`${paths.dashboard.governmentServices}/explore`);
                }
                setIsFetching(false);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceIdNum]);

    const detail = selectedService ? getServiceDetailByAccessKey(selectedService.accessKey) : undefined;
    const eligibilityQuestions: string[] = detail?.eligibilityQuestions ?? [];

    useEffect(() => {
        if (!selectedService?.accessKey || eligibilityQuestions.length === 0) return;
        setIsDraftFetching(true);
        getGovernmentServiceApplicationApi(userId, role, selectedService.accessKey).then(draft => {
            const saved = draft?.formData?.eligibility as Record<string, string> | undefined;
            if (saved) {
                const preselected: Record<number, string> = {};
                eligibilityQuestions.forEach((q, i) => {
                    if (saved[q]) preselected[i] = saved[q];
                });
                if (Object.keys(preselected).length > 0) setEligibilityAnswers(preselected);
            }
            setIsDraftFetching(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedService?.accessKey]);

    if (isFetching || isDraftFetching) {
        return <Skeleton active paragraph={{ rows: 10 }} className="p-4" />;
    }

    if (!selectedService) {
        return null;
    }

    const pekoFee = selectedService.price;
    const govFee = selectedService.govtFee === 'Free' ? 0 : selectedService.govtFee;
    const total = pekoFee + govFee;

    const benefits: string[] = detail?.benefits ?? [];
    const whoShouldApply: string[] = detail?.whoShouldApply ?? [];
    const documents: string[] = detail?.documents ?? [];
    const timeline = detail?.timeline ?? [];

    return (
        <Flex vertical gap={16} className="p-4">
            <Flex vertical gap={4}>
                <Title level={4} className="!mb-0">
                    {selectedService.name}
                </Title>
                {detail?.subtitle && (
                    <Text style={{ color: '#8C8C8C' }} className="text-sm">
                        {detail.subtitle}
                    </Text>
                )}
            </Flex>

            {detail && (
                <>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                        <SectionCard title="Key Benefits">
                            <Flex vertical gap={16}>
                                {benefits.map((benefit, i) => (
                                    <Flex align="center" gap={8} key={i}>
                                        <CheckCircleFilled style={{ color: '#26A411', fontSize: 14, flexShrink: 0 }} />
                                        <Text className="text-xs">{benefit}</Text>
                                    </Flex>
                                ))}
                            </Flex>
                        </SectionCard>
                    </Col>
                    <Col xs={24} md={12}>
                        <SectionCard title="Who Should Apply">
                            <Flex vertical gap={16}>
                                {whoShouldApply.map((item, i) => (
                                    <Flex align="flex-start" gap={8} key={i}>
                                        <span style={{ color: '#FF3A3A', fontSize: 22, lineHeight: '18px', flexShrink: 0 }}>•</span>
                                        <Text className="text-xs">{item}</Text>
                                    </Flex>
                                ))}
                            </Flex>
                        </SectionCard>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                        <SectionCard title="Check Your Eligibility">
                            <Flex vertical gap={16}>
                                {eligibilityQuestions.map((question, i) => (
                                    <Flex vertical gap={6} key={i}>
                                        <Text className="text-xs">{question}</Text>
                                        <Flex gap={8}>
                                            {['Yes', 'No'].map((opt) => (
                                                <Button
                                                    key={opt}
                                                    size="small"
                                                    onClick={() =>
                                                        setEligibilityAnswers((prev) => ({
                                                            ...prev,
                                                            [i]: opt.toLowerCase(),
                                                        }))
                                                    }
                                                    style={{
                                                        borderColor: eligibilityAnswers[i] === opt.toLowerCase() ? '#FF3A3A' : '#D9D9D9',
                                                        color: eligibilityAnswers[i] === opt.toLowerCase() ? '#FF3A3A' : '#595959',
                                                        backgroundColor: '#FFFFFF',
                                                        minWidth: 48,
                                                    }}
                                                >
                                                    {opt}
                                                </Button>
                                            ))}
                                        </Flex>
                                    </Flex>
                                ))}
                            </Flex>
                        </SectionCard>
                    </Col>
                    <Col xs={24} md={12}>
                        <SectionCard title="Documents Required">
                            <Flex vertical gap={16}>
                                {documents.map((doc, i) => {
                                    const condition = detail?.documentConditions?.[doc];
                                    return (
                                        <Flex align="center" gap={8} key={i}>
                                            <img src={docIcon} alt="doc" style={{ width: 16, height: 16, flexShrink: 0 }} />
                                            <Flex vertical gap={2}>
                                                <Text className="text-xs">{doc}</Text>
                                                {condition && (
                                                    <Text className="text-xs" style={{ color: '#FA8C16' }}>
                                                        {condition.label ?? 'Companies only'}
                                                    </Text>
                                                )}
                                            </Flex>
                                        </Flex>
                                    );
                                })}
                            </Flex>
                        </SectionCard>
                    </Col>
                </Row>
                </>
            )}
            <Flex vertical gap={18} className="px-24">
                  <Flex vertical gap={8} className="p-4 rounded-lg" style={{ border: '1px solid #F0F0F0' }}>
                <Text strong className="text-sm">
                    Pricing Breakdown
                </Text>
                {selectedService.govtFee !== 'Free' && selectedService.govtFee !== 0 && (
                    <Flex justify="space-between">
                        <Text className="text-xs" style={{ color: '#8C8C8C' }}>Government Fee</Text>
                        <Text className="text-xs" style={{ color: '#8C8C8C' }}>
                            ₹ {(selectedService.govtFee as number).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                    </Flex>
                )}
                <Flex justify="space-between">
                    <Text className="text-xs" style={{ color: '#8C8C8C' }}>
                        Peko Service Fee
                    </Text>
                    <Text className="text-xs" style={{ color: '#8C8C8C' }}>
                        ₹ {pekoFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                </Flex>
                <Divider className="!my-1" />
                <Flex justify="space-between">
                    <Text className="text-xs font-medium">Total</Text>
                    <Text className="text-xs font-medium" style={{ color: '#FF3A3A' }}>
                        ₹ {total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                </Flex>
            </Flex>

            <Flex vertical gap={8} className="p-4 rounded-lg" style={{ border: '1px solid #F0F0F0' }}>
                <Text strong className="text-sm">
                    Application Timeline
                </Text>
                <Flex align="center"  gap={6}>
                    <ClockCircleOutlined style={{ color: '#8C8C8C', fontSize: 12 }} />
                    <Text className="text-xs" style={{ color: '#8C8C8C' }}>
                        Estimated time: {selectedService.duration}
                    </Text>
                </Flex>
                <Flex vertical gap={0} className="mt-3">
                    {timeline.map((step, i, arr) => {
                        const isLast = i === arr.length - 1;
                        return (
                            <Flex key={i} gap={12}>
                                <Flex vertical align="center" style={{ flexShrink: 0 }}>
                                    <Flex
                                        align="center"
                                        justify="center"
                                        style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#FFF0F0', flexShrink: 0 }}
                                    >
                                        <Text style={{ fontSize: 11, color: '#FF3A3A', fontWeight: 500 }}>{i + 1}</Text>
                                    </Flex>
                                    {!isLast && (
                                        <div style={{ width: 1, flex: 1, minHeight: 20, backgroundColor: '#F0F0F0', margin: '4px 0' }} />
                                    )}
                                </Flex>
                                <Flex vertical gap={2} style={{ paddingBottom: isLast ? 0 : 16, justifyContent: 'center' }}>
                                    <Text className="text-sm font-medium">{step.title}</Text>
                                    {step.description && (
                                        <Text className="text-xs" style={{ color: '#8C8C8C' }}>{step.description}</Text>
                                    )}
                                </Flex>
                            </Flex>
                        );
                    })}
                </Flex>
            </Flex>


            <Button
                type="primary"
                danger
                style={{ width: 'fit-content' }}
                loading={isApplying}
                onClick={async () => {
                    if (
                        eligibilityQuestions.length > 0 &&
                        Object.keys(eligibilityAnswers).length < eligibilityQuestions.length
                    ) {
                        dispatch(showToast({ description: 'Please check your eligibility before applying', variant: 'warning' }));
                        return;
                    }
                    const eligibilityData = Object.fromEntries(
                        eligibilityQuestions.map((q, i) => [q, eligibilityAnswers[i] ?? ''])
                    );
                    setIsApplying(true);
                    const result = await submitGovernmentServiceApplicationApi({
                        userId,
                        userType: role,
                        accessKey: selectedService.accessKey,
                        formData: { eligibility: eligibilityData },
                    });
                    setIsApplying(false);
                    if (result) {
                        navigate(
                            `${paths.dashboard.governmentServices}/${paths.governmentServices.service}/${serviceId}/apply`,
                            { state: { eligibilityAnswers: eligibilityData, existingApplicationId: Number(result.applicationId) } }
                        );
                    }
                }}
            >
                Apply with Peko
            </Button>

            </Flex>

          
        </Flex>
    );
};

export default ServiceDetail;
